from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import json
import os

# Import from local modules
from .models import save_healthkit_data, get_healthkit_data
from .auth_utils import get_token_user
from .database import get_database

router = APIRouter()

class HealthKitDataPoint(BaseModel):
    user_id: str
    date: datetime
    date_key: Optional[str] = None
    steps: float
    calories: float
    distance: float
    exercise_minutes: float
    resting_heart_rate: float
    walking_heart_rate: float
    sleep_hours: float
    source: Optional[str] = "Apple HealthKit (Swift)"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

class BatchHealthKitData(BaseModel):
    entries: List[HealthKitDataPoint]

@router.post("/swift/healthkit/upload")
async def upload_healthkit_data(
    data: HealthKitDataPoint,
    current_user: dict = Depends(get_token_user)
):
    """
    Upload a single HealthKit data entry
    
    Requires authentication via JWT token
    """
    try:
        # Validate that the user ID in the data matches the authenticated user
        if data.user_id != current_user["sub"]:
            raise HTTPException(status_code=403, detail="User ID in data does not match authenticated user")
        
        # Extract or generate date_key if not provided
        healthkit_entry = data.dict()
        if not healthkit_entry.get("date_key") and isinstance(healthkit_entry.get("date"), datetime):
            healthkit_entry["date_key"] = healthkit_entry["date"].strftime("%Y-%m-%d")
        
        # Add timestamps
        now = datetime.now(timezone.utc)
        healthkit_entry["created_at"] = now
        healthkit_entry["updated_at"] = now
        
        # Store the data
        entry_id = save_healthkit_data(healthkit_entry)
        
        return {
            "success": True,
            "id": str(entry_id),
            "date_key": healthkit_entry["date_key"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing HealthKit data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process HealthKit data: {str(e)}")

@router.post("/swift/healthkit/batch-upload")
async def batch_upload_healthkit_data(
    data: BatchHealthKitData,
    current_user: dict = Depends(get_token_user)
):
    """
    Upload multiple HealthKit data entries at once
    
    Requires authentication via JWT token
    """
    try:
        # Create a log file with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, f"swift_healthkit_data_{timestamp}.json")
        
        # Get authenticated user ID
        auth_user_id = current_user["sub"]
        
        # Log the raw data received
        with open(log_file, "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "user_id": auth_user_id,
                "entry_count": len(data.entries),
                "entries": [entry.dict() for entry in data.entries]
            }, f, indent=2, default=str)
        
        print(f"🔍 Swift HealthKit data logged to: {log_file}")
        
        # Log how many entries were received
        entry_count = len(data.entries)
        print(f"Received {entry_count} HealthKit entries from user {auth_user_id}")
        
        # Print a summary of the data received
        print("📊 Data summary:")
        for i, entry in enumerate(data.entries):
            print(f"  Entry {i+1}: {entry.date_key} - Steps: {entry.steps}, Calories: {entry.calories}")
        
        results = []
        errors = []
        
        for i, entry in enumerate(data.entries):
            try:
                # IMPORTANT: Always use the authenticated user's ID from the token
                # This overrides any user_id sent in the request for security
                
                # Process the entry
                healthkit_entry = entry.dict()
                
                # Set the correct user ID from the token
                healthkit_entry["user_id"] = auth_user_id
                
                # Extract or generate date_key if not provided
                if not healthkit_entry.get("date_key") and isinstance(healthkit_entry.get("date"), datetime):
                    healthkit_entry["date_key"] = healthkit_entry["date"].strftime("%Y-%m-%d")
                
                # Add timestamps
                now = datetime.now(timezone.utc)
                healthkit_entry["created_at"] = now
                healthkit_entry["updated_at"] = now
                
                # Log the entry being processed (including zero values)
                print(f"Processing entry {i}: date_key={healthkit_entry['date_key']}, " +
                      f"steps={healthkit_entry['steps']}, calories={healthkit_entry['calories']}")
                
                # Check for existing entry with the same user_id and date_key
                db = get_database()
                
                existing_entry = db.healthkit_data.find_one({
                    "user_id": auth_user_id,
                    "date_key": healthkit_entry["date_key"]
                })
                
                if existing_entry:
                    # Update existing entry
                    db.healthkit_data.update_one(
                        {"_id": existing_entry["_id"]},
                        {"$set": {
                            **healthkit_entry,
                            "updated_at": now
                        }}
                    )
                    results.append({
                        "index": i,
                        "status": "updated",
                        "id": str(existing_entry["_id"]),
                        "date_key": healthkit_entry["date_key"]
                    })
                    print(f"Updated existing entry for {healthkit_entry['date_key']}")
                else:
                    # Insert new entry
                    insert_result = db.healthkit_data.insert_one(healthkit_entry)
                    results.append({
                        "index": i,
                        "status": "created",
                        "id": str(insert_result.inserted_id),
                        "date_key": healthkit_entry["date_key"]
                    })
                    print(f"Created new entry for {healthkit_entry['date_key']}")
            except Exception as e:
                print(f"Error processing entry {i}: {str(e)}")
                errors.append({
                    "index": i,
                    "error": str(e),
                    "date_key": entry.date_key if hasattr(entry, 'date_key') and entry.date_key else 
                               entry.date.strftime("%Y-%m-%d") if hasattr(entry, 'date') and isinstance(entry.date, datetime) else 
                               "unknown"
                })
        
        # Log overall stats
        print(f"Batch upload complete: {len(results)} successful, {len(errors)} failed")
        
        return {
            "success": True,
            "results": results,
            "errors": errors,
            "total_received": entry_count,
            "total_processed": len(results),
            "log_file": log_file
        }
    except Exception as e:
        print(f"Error in batch upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/swift/healthkit/data")
async def get_user_healthkit_data(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_token_user)
):
    """
    Retrieve HealthKit data for the authenticated user
    
    Requires authentication via JWT token
    """
    try:
        user_id = current_user["sub"]
        
        # Parse date parameters
        parsed_date = None
        parsed_start = None
        parsed_end = None
        
        if date:
            try:
                parsed_date = datetime.fromisoformat(date.replace('Z', '+00:00')).date()
                parsed_date = datetime.combine(parsed_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid date format: {date}")
                
        if start_date:
            try:
                parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
                parsed_start = datetime.combine(parsed_start, datetime.min.time()).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid start_date format: {start_date}")
                
        if end_date:
            try:
                parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
                parsed_end = datetime.combine(parsed_end, datetime.max.time()).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid end_date format: {end_date}")
        
        # Fetch data from database
        healthkit_data = get_healthkit_data(user_id, parsed_date, parsed_start, parsed_end)
        
        # Convert ObjectId to string for JSON serialization
        for entry in healthkit_data:
            if "_id" in entry:
                entry["_id"] = str(entry["_id"])
            # Convert datetime objects to ISO format strings
            for key, value in entry.items():
                if isinstance(value, datetime):
                    entry[key] = value.isoformat()
        
        return {"data": healthkit_data}
    except Exception as e:
        print(f"Error retrieving health kit data: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 