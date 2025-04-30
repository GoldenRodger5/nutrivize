from app.database import get_database
from datetime import datetime, timezone, time

def fix_log_dates():
    """Fix the dates in the food_logs collection to ensure consistency."""
    db = get_database()
    
    # Get all logs
    all_logs = list(db.food_logs.find())
    print(f"Found {len(all_logs)} logs to check")
    
    updates = 0
    for log in all_logs:
        log_id = log["_id"]
        log_date = log.get("date")
        
        # Skip if date is missing
        if not log_date:
            print(f"Log {log_id} has no date, skipping")
            continue
        
        # Get the date part and normalize to start of day
        try:
            # If already a datetime
            if isinstance(log_date, datetime):
                date_obj = log_date
            else:
                # Try to parse string date
                date_obj = datetime.fromisoformat(str(log_date).replace('Z', '+00:00'))
            
            # Normalize to start of day in UTC
            normalized_date = datetime.combine(date_obj.date(), time.min).replace(tzinfo=timezone.utc)
            
            # Update if different
            if normalized_date != log_date:
                db.food_logs.update_one(
                    {"_id": log_id},
                    {"$set": {"date": normalized_date}}
                )
                updates += 1
                print(f"Updated log {log_id} date from {log_date} to {normalized_date}")
        except Exception as e:
            print(f"Error processing log {log_id}: {e}")
    
    print(f"Updated {updates} logs")

if __name__ == "__main__":
    fix_log_dates() 