"""
Security middleware for Nutrivize application
"""
import time
import hashlib
from typing import Dict, Optional
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .exceptions import RateLimitError
from .error_handling import create_error_response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY" 
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Only add HSTS for HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy for API responses
        if "application/json" in response.headers.get("content-type", ""):
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 60, burst_requests: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_requests = burst_requests
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque())
        self.burst_tracking: Dict[str, list] = defaultdict(list)
        
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for the client"""
        # Use forwarded IP if available (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Include user agent for additional uniqueness
        user_agent = request.headers.get("User-Agent", "")
        identifier = f"{client_ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        
        return identifier
    
    def _clean_old_requests(self, request_times: deque, window_seconds: int):
        """Remove requests older than the specified window"""
        cutoff_time = time.time() - window_seconds
        while request_times and request_times[0] < cutoff_time:
            request_times.popleft()
    
    def _check_rate_limit(self, client_id: str) -> Optional[int]:
        """Check if client has exceeded rate limits. Returns retry_after seconds if limited."""
        current_time = time.time()
        
        # Check burst limit (last 10 seconds)
        burst_window = 10
        if client_id not in self.burst_tracking:
            self.burst_tracking[client_id] = []
        
        burst_times = self.burst_tracking[client_id]
        # Clean old burst requests
        burst_times[:] = [t for t in burst_times if current_time - t < burst_window]
        
        if len(burst_times) >= self.burst_requests:
            return burst_window
        
        # Check per-minute limit
        minute_window = 60
        request_times = self.request_history[client_id]
        self._clean_old_requests(request_times, minute_window)
        
        if len(request_times) >= self.requests_per_minute:
            oldest_request = request_times[0]
            retry_after = int(oldest_request + minute_window - current_time) + 1
            return max(retry_after, 1)
        
        # Record this request
        request_times.append(current_time)
        burst_times.append(current_time)
        
        return None
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_id = self._get_client_identifier(request)
        retry_after = self._check_rate_limit(client_id)
        
        if retry_after:
            return create_error_response(
                status_code=429,
                error_code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please slow down.",
                details={
                    "retry_after": retry_after,
                    "requests_per_minute": self.requests_per_minute,
                    "burst_limit": self.burst_requests
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining_requests = max(0, self.requests_per_minute - len(self.request_history[client_id]))
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining_requests)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + 60))
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log API requests for monitoring and debugging"""
    
    def __init__(self, app, log_body: bool = False, max_body_size: int = 1024):
        super().__init__(app)
        self.log_body = log_body
        self.max_body_size = max_body_size
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        # Log request details
        import logging
        logger = logging.getLogger("nutrivize.requests")
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        request_info = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": client_ip,
            "user_agent": request.headers.get("User-Agent", ""),
            "content_type": request.headers.get("Content-Type", ""),
            "content_length": request.headers.get("Content-Length", "0")
        }
        
        # Log request body for POST/PUT/PATCH (if enabled and safe)
        if self.log_body and request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("Content-Type", "")
            if "application/json" in content_type:
                try:
                    # Read body safely
                    body = await request.body()
                    if len(body) <= self.max_body_size:
                        # Don't log sensitive data
                        body_str = body.decode("utf-8")
                        if not any(sensitive in body_str.lower() for sensitive in ["password", "token", "secret", "key"]):
                            request_info["body"] = body_str[:self.max_body_size]
                except Exception:
                    pass  # Skip body logging if there's an issue
        
        logger.info(f"Request started: {request.method} {request.url.path}", extra=request_info)
        
        # Process request
        response = await call_next(request)
        
        # Log response details
        duration = time.time() - start_time
        response_info = {
            **request_info,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2)
        }
        
        log_level = "info"
        if response.status_code >= 500:
            log_level = "error"
        elif response.status_code >= 400:
            log_level = "warning"
        
        getattr(logger, log_level)(
            f"Request completed: {request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)",
            extra=response_info
        )
        
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request body size"""
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("Content-Length")
        
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size:
                    return create_error_response(
                        status_code=413,
                        error_code="REQUEST_TOO_LARGE",
                        message=f"Request body too large. Maximum size is {self.max_size} bytes.",
                        details={"max_size": self.max_size, "received_size": size}
                    )
            except ValueError:
                pass  # Invalid Content-Length header, let it pass
        
        return await call_next(request)
