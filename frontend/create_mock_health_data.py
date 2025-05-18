import pymongo
import json
from datetime import datetime, timedelta
import random

def main():
    """Generate mock Apple HealthKit data for the last 7 days"""
    print("Generating mock health data for the last 7 days...")
    
    # Calculate date range for the last 7 days
    end_date = datetime.now()
    end_date = datetime(end_date.year, end_date.month, end_date.day)  # Normalize to midnight
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Create the healthkit_data collection if it doesn't exist
        if "healthkit_data" not in db.list_collection_names():
            print("Creating healthkit_data collection...")
        
        # Access or create the healthkit_data collection
        healthkit_collection = db["healthkit_data"]
        
        # For each of the last 7 days, create a mock health data entry
        created_entries = []
        
        for i in range(7):
            date = end_date - timedelta(days=i)
            print(f"Generating data for {date.strftime('%Y-%m-%d')}...")
            
            # Check if data already exists for this date
            existing = healthkit_collection.find_one({"date": date})
            if existing:
                print(f"  Data already exists for {date.strftime('%Y-%m-%d')}, updating...")
                healthkit_collection.delete_one({"_id": existing["_id"]})
            
            # Generate realistic but random health data
            # Base values with some random variation for each day
            base_steps = 8000
            base_calories = 350
            base_exercise = 45
            base_resting_hr = 65
            base_walking_hr = 105
            base_sleep = 7.2
            
            # Apply some variance each day
            variance = random.uniform(0.8, 1.2)
            exercise_variance = random.uniform(0.7, 1.3)
            sleep_variance = random.uniform(0.85, 1.15)
            
            # Create the mock data entry
            mock_data = {
                "user_id": "GME7nGpJQRc2v9T057vJ4oyqAJN2",  # This should match your actual user ID
                "date": date,
                "steps": int(base_steps * variance),
                "calories": int(base_calories * variance),
                "distance": round(base_steps * variance * 0.0008, 2),  # Approximate distance in km
                "exercise_minutes": int(base_exercise * exercise_variance),
                "resting_heart_rate": int(base_resting_hr * random.uniform(0.9, 1.1)),
                "walking_heart_rate": int(base_walking_hr * random.uniform(0.9, 1.1)),
                "sleep_hours": round(base_sleep * sleep_variance, 1),
                "source": "Mock Data Generator",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Insert the mock data
            result = healthkit_collection.insert_one(mock_data)
            created_entries.append({
                "date": date.strftime('%Y-%m-%d'),
                "id": str(result.inserted_id),
                "steps": mock_data["steps"],
                "calories": mock_data["calories"]
            })
        
        print(f"\nSuccessfully created {len(created_entries)} mock health data entries")
        print("You can now view this data in the Nutrivize app's Apple Health tab")
        
        # Print a summary of what was created
        print("\nCreated entries:")
        for entry in sorted(created_entries, key=lambda x: x["date"]):
            print(f"  {entry['date']}: Steps: {entry['steps']}, Calories: {entry['calories']}, ID: {entry['id']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return

if __name__ == "__main__":
    main() 