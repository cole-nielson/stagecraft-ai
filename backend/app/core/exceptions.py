from fastapi import HTTPException
from typing import Any, Dict, Optional


class StageCraftException(Exception):
    """Base exception class for StageCraft AI."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ImageValidationError(StageCraftException):
    """Raised when image validation fails."""
    pass


class AIServiceError(StageCraftException):
    """Raised when AI service encounters an error."""
    pass


class ProcessingError(StageCraftException):
    """Raised when staging processing fails."""
    pass


class StorageError(StageCraftException):
    """Raised when file storage operations fail."""
    pass


def create_http_exception(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> HTTPException:
    """Create standardized HTTP exception."""
    return HTTPException(
        status_code=status_code,
        detail={
            "error": {
                "code": error_code,
                "message": message,
                "details": details or {},
            }
        }
    )


# Common HTTP exceptions
def bad_request_exception(message: str, details: Optional[Dict[str, Any]] = None) -> HTTPException:
    return create_http_exception(400, "BAD_REQUEST", message, details)


def not_found_exception(message: str, details: Optional[Dict[str, Any]] = None) -> HTTPException:
    return create_http_exception(404, "NOT_FOUND", message, details)


def internal_server_exception(message: str, details: Optional[Dict[str, Any]] = None) -> HTTPException:
    return create_http_exception(500, "INTERNAL_ERROR", message, details)


def service_unavailable_exception(message: str, details: Optional[Dict[str, Any]] = None) -> HTTPException:
    return create_http_exception(503, "SERVICE_UNAVAILABLE", message, details)