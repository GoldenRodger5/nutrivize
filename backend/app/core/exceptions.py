"""
Custom exception classes for Nutrivize application
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException


class NutrivizeException(Exception):
    """Base exception for Nutrivize application"""
    
    def __init__(
        self, 
        message: str = "An error occurred",
        error_code: str = "GENERAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(NutrivizeException):
    """Raised when input validation fails"""
    
    def __init__(
        self, 
        message: str = "Validation failed",
        field: Optional[str] = None,
        value: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=details or {}
        )
        self.field = field
        self.value = value
        if field:
            self.details.update({"field": field, "value": str(value) if value is not None else None})


class DatabaseError(NutrivizeException):
    """Raised when database operations fail"""
    
    def __init__(
        self, 
        message: str = "Database operation failed",
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details=details or {}
        )
        self.operation = operation
        if operation:
            self.details.update({"operation": operation})


class NotFoundError(NutrivizeException):
    """Raised when a requested resource is not found"""
    
    def __init__(
        self, 
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            details=details or {}
        )
        self.resource_type = resource_type
        self.resource_id = resource_id
        if resource_type:
            self.details.update({"resource_type": resource_type})
        if resource_id:
            self.details.update({"resource_id": resource_id})


class AuthenticationError(NutrivizeException):
    """Raised when authentication fails"""
    
    def __init__(
        self, 
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=details or {}
        )


class AuthorizationError(NutrivizeException):
    """Raised when authorization fails"""
    
    def __init__(
        self, 
        message: str = "Access denied",
        required_permission: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=details or {}
        )
        self.required_permission = required_permission
        if required_permission:
            self.details.update({"required_permission": required_permission})


class RateLimitError(NutrivizeException):
    """Raised when rate limit is exceeded"""
    
    def __init__(
        self, 
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            details=details or {}
        )
        self.retry_after = retry_after
        if retry_after:
            self.details.update({"retry_after": retry_after})


class ExternalServiceError(NutrivizeException):
    """Raised when external service calls fail"""
    
    def __init__(
        self, 
        message: str = "External service error",
        service_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details or {}
        )
        self.service_name = service_name
        if service_name:
            self.details.update({"service_name": service_name})


class BusinessLogicError(NutrivizeException):
    """Raised when business logic validation fails"""
    
    def __init__(
        self, 
        message: str = "Business logic validation failed",
        rule: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details or {}
        )
        self.rule = rule
        if rule:
            self.details.update({"rule": rule})


# HTTP Exception mappers
def to_http_exception(error: NutrivizeException) -> HTTPException:
    """Convert Nutrivize exceptions to FastAPI HTTPExceptions"""
    
    status_code_map = {
        "VALIDATION_ERROR": 422,
        "NOT_FOUND": 404,
        "AUTHENTICATION_ERROR": 401,
        "AUTHORIZATION_ERROR": 403,
        "RATE_LIMIT_ERROR": 429,
        "BUSINESS_LOGIC_ERROR": 400,
        "DATABASE_ERROR": 500,
        "EXTERNAL_SERVICE_ERROR": 503,
        "GENERAL_ERROR": 500,
    }
    
    status_code = status_code_map.get(error.error_code, 500)
    
    detail = {
        "error": error.error_code,
        "message": error.message,
        "details": error.details
    }
    
    headers = {}
    if hasattr(error, 'retry_after') and error.retry_after:
        headers["Retry-After"] = str(error.retry_after)
    
    return HTTPException(
        status_code=status_code,
        detail=detail,
        headers=headers if headers else None
    )
