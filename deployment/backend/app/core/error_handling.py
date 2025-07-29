"""
Error handling middleware and utilities for Nutrivize application
"""
import logging
import traceback
import uuid
from typing import Any, Dict, Optional
from datetime import datetime

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from .exceptions import (
    NutrivizeException, 
    ValidationError, 
    DatabaseError,
    to_http_exception
)

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to handle exceptions and add request context"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add request ID to headers
        response = None
        
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as exc:
            logger.error(
                f"Unhandled exception in request {request_id}: {str(exc)}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "traceback": traceback.format_exc()
                }
            )
            
            # Convert to appropriate HTTP response
            if isinstance(exc, NutrivizeException):
                http_exc = to_http_exception(exc)
                return create_error_response(
                    status_code=http_exc.status_code,
                    error_code=exc.error_code,
                    message=exc.message,
                    details=exc.details,
                    request_id=request_id
                )
            
            # For unexpected exceptions, return generic 500
            return create_error_response(
                status_code=500,
                error_code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred",
                details={"request_id": request_id},
                request_id=request_id
            )


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """Create standardized error response"""
    
    error_response = {
        "error": True,
        "error_code": error_code,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {}
    }
    
    if request_id:
        error_response["request_id"] = request_id
    
    headers = {}
    if request_id:
        headers["X-Request-ID"] = request_id
    
    return JSONResponse(
        status_code=status_code,
        content=error_response,
        headers=headers
    )


# Exception handlers for FastAPI
async def nutrivize_exception_handler(request: Request, exc: NutrivizeException):
    """Handle custom Nutrivize exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    logger.warning(
        f"Nutrivize exception in request {request_id}: {exc.error_code} - {exc.message}",
        extra={
            "request_id": request_id,
            "error_code": exc.error_code,
            "path": request.url.path,
            "method": request.method,
            "details": exc.details
        }
    )
    
    http_exc = to_http_exception(exc)
    return create_error_response(
        status_code=http_exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request_id=request_id
    )


async def validation_exception_handler(request: Request, exc: PydanticValidationError):
    """Handle Pydantic validation errors"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # Convert Pydantic errors to our format
    validation_errors = []
    for error in exc.errors():
        field_path = ".".join(str(x) for x in error["loc"])
        validation_errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    logger.info(
        f"Validation error in request {request_id}",
        extra={
            "request_id": request_id,
            "validation_errors": validation_errors,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return create_error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Input validation failed",
        details={"validation_errors": validation_errors},
        request_id=request_id
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTP exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # If detail is already our format, use it
    if isinstance(exc.detail, dict) and "error_code" in exc.detail:
        return create_error_response(
            status_code=exc.status_code,
            error_code=exc.detail["error_code"],
            message=exc.detail["message"],
            details=exc.detail.get("details", {}),
            request_id=request_id
        )
    
    # Convert standard HTTP exceptions
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN", 
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE"
    }
    
    error_code = error_code_map.get(exc.status_code, "HTTP_ERROR")
    message = str(exc.detail) if exc.detail else "HTTP error occurred"
    
    return create_error_response(
        status_code=exc.status_code,
        error_code=error_code,
        message=message,
        request_id=request_id
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle any unhandled exceptions"""
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    logger.error(
        f"Unhandled exception in request {request_id}: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    )
    
    return create_error_response(
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        details={"type": type(exc).__name__},
        request_id=request_id
    )


# Utility functions for services
def handle_database_error(operation: str, error: Exception) -> None:
    """Convert database errors to DatabaseError exceptions"""
    error_msg = str(error)
    
    if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
        raise ValidationError(
            message="A record with this information already exists",
            details={"operation": operation, "database_error": error_msg}
        )
    elif "not found" in error_msg.lower():
        raise DatabaseError(
            message="Database record not found",
            operation=operation,
            details={"database_error": error_msg}
        )
    elif "timeout" in error_msg.lower():
        raise DatabaseError(
            message="Database operation timed out",
            operation=operation,
            details={"database_error": error_msg}
        )
    else:
        raise DatabaseError(
            message=f"Database operation failed: {operation}",
            operation=operation,
            details={"database_error": error_msg}
        )


def validate_user_access(user_id: str, resource_user_id: str) -> None:
    """Validate that user has access to the resource"""
    if user_id != resource_user_id:
        from .exceptions import AuthorizationError
        raise AuthorizationError(
            message="You don't have permission to access this resource",
            details={"resource_user_id": resource_user_id}
        )
