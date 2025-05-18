import sys
import os
sys.path.append(os.path.abspath("."))
from backend.app.database import get_database
from datetime import datetime

def main():
    """Verify Swift iOS HealthKit data in MongoDB"""
    print("Verifying Swift iOS HealthKit data in MongoDB...")
    
    # Get the database connection
    db = get_database()
    
    # Count HealthKit entries from iOS specifically
    total_count = db.healthkit_data.count_documents({})
    swift_count = db.healthkit_data.count_documents({"source": "Apple HealthKit (iOS)"})
    
    print(f"Total HealthKit entries: {total_count}")
    print(f"Swift iOS entries: {swift_count}")
    
    # Check for zero values in Swift data
    zero_count = db.healthkit_data.count_documents({"source": "Apple HealthKit (iOS)", "steps": 0, "calories": 0})
    print(f"Swift iOS entries with zero values: {zero_count}")
    
    # Check date range for Swift data
    earliest = db.healthkit_data.find_one({"source": "Apple HealthKit (iOS)"}, sort=[("date", 1)])
    latest = db.healthkit_data.find_one({"source": "Apple HealthKit (iOS)"}, sort=[("date", -1)])
    
    if earliest and latest:
        earliest_date = earliest.get("date")
        latest_date = latest.get("date")
        print(f"Swift iOS date range: {earliest_date.strftime('%Y-%m-%d')} to {latest_date.strftime('%Y-%m-%d')}")
    
    # Show Swift entries
    print("\nSwift iOS entries:")
    cursor = db.healthkit_data.find({"source": "Apple HealthKit (iOS)"}).sort("date_key", 1)
    
    for doc in cursor:
        date_key = doc.get("date_key")
        steps = doc.get("steps", 0)
        calories = doc.get("calories", 0)
        
        # Add an indicator for zero values
        zero_indicator = " [ZERO VALUES]" if steps == 0 and calories == 0 else ""
        
        print(f"Date: {date_key}{zero_indicator} | Steps: {steps} | Calories: {calories}")

if __name__ == "__main__":
    main() 