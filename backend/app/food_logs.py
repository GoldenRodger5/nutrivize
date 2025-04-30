from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

async def get_food_logs_for_timeframe(db, user_id: str, start_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Get food logs for a specific timeframe.
    If start_date is None, returns all logs.
    
    Args:
        db: Database connection
        user_id: User ID
        start_date: Optional start date
        
    Returns:
        List of food log entries
    """
    # Import get_user_food_logs to avoid circular imports
    from .models import get_user_food_logs
    
    try:
        # Convert start_date to date object if it exists
        start_date_obj = None
        if start_date:
            if isinstance(start_date, datetime):
                start_date_obj = start_date.date()
            else:
                # Try to parse date string
                try:
                    start_date_obj = datetime.fromisoformat(str(start_date)).date()
                except:
                    # Use 7 days ago as default if parsing fails
                    start_date_obj = (datetime.now() - timedelta(days=7)).date()
        
        # Get all logs and filter by date if needed
        logs = get_user_food_logs(user_id)
        
        if start_date_obj and logs:
            # Filter logs to only include those after start_date
            filtered_logs = []
            for log in logs:
                # Parse log date if it's a string
                log_date = log.get("date")
                if isinstance(log_date, str):
                    try:
                        log_date = datetime.fromisoformat(log_date.replace('Z', '+00:00')).date()
                    except:
                        # Skip this log if date parsing fails
                        continue
                elif isinstance(log_date, datetime):
                    log_date = log_date.date()
                else:
                    # Skip this log if date is missing or invalid
                    continue
                
                # Include log if it's on or after start_date
                if log_date >= start_date_obj:
                    filtered_logs.append(log)
            
            return filtered_logs
        
        return logs
    except Exception as e:
        print(f"Error getting food logs for timeframe: {str(e)}")
        return [] 