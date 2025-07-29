"""
Enhanced error handling for analytics and database operations
"""

from fastapi import HTTPException
import traceback
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nutrivize")

class DatabaseError(Exception):
    """Exception raised for database connection and query errors"""
    pass

class AnalyticsError(Exception):
    """Exception raised for analytics calculation errors"""
    pass

class DataNotFoundError(Exception):
    """Exception raised when required data is not found"""
    pass

def handle_analytics_error(func):
    """Decorator to handle analytics errors gracefully"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except DataNotFoundError as e:
            # Return empty results when no data is available
            logger.warning(f"No data available: {str(e)}")
            return {
                "message": str(e),
                "data": [],
                "error": "NO_DATA"
            }
        except DatabaseError as e:
            logger.error(f"Database error in {func.__name__}: {str(e)}")
            # Return a proper error response without exposing sensitive details
            raise HTTPException(
                status_code=503, 
                detail="Database service unavailable. Please try again later."
            )
        except AnalyticsError as e:
            logger.error(f"Analytics error in {func.__name__}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="An error occurred while processing analytics. Please try again."
            )
        except Exception as e:
            # Log the full exception for debugging
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            logger.debug(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail="An unexpected error occurred. The team has been notified."
            )
    return wrapper
