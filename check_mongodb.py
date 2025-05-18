#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.abspath("."))
from backend.app.database import get_database
from datetime import datetime

def main():
    """Check detailed HealthKit data in MongoDB"""
    print("Retrieving HealthKit data from MongoDB...")
    
    # Get the database connection
    db = get_database()
    
    # Get all HealthKit documents, sorted by date
    cursor = db.healthkit_data.find().sort("date", 1)
    
    print("\nHealthKit Data (Apple HealthKit iOS):")
    print("=" * 80)
    print(f"{'Date':<12} | {'Steps':<10} | {'Calories':<10} | {'Distance (m)':<12} | {'Exercise (min)':<14} | {'Sleep (hrs)':<10} | {'Resting HR':<10} | {'Walking HR':<10}")
    print("-" * 80)
    
    for doc in cursor:
        date_key = doc.get("date_key", "Unknown")
        steps = doc.get("steps", 0)
        calories = doc.get("calories", 0)
        distance = doc.get("distance", 0)
        exercise = doc.get("exercise_minutes", 0)
        sleep = doc.get("sleep_hours", 0)
        resting_hr = doc.get("resting_heart_rate", 0)
        walking_hr = doc.get("walking_heart_rate", 0)
        
        print(f"{date_key:<12} | {steps:<10.1f} | {calories:<10.1f} | {distance:<12.1f} | {exercise:<14.1f} | {sleep:<10.2f} | {resting_hr:<10.1f} | {walking_hr:<10.1f}")
    
    # Get summary information
    total_count = db.healthkit_data.count_documents({})
    date_range = db.healthkit_data.distinct("date_key")
    date_range.sort()
    
    print("\nSummary:")
    print(f"Total entries: {total_count}")
    print(f"Date range: {date_range[0]} to {date_range[-1]}")
    print(f"Days with data: {', '.join(date_range)}")
    
    # Calculate averages
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg_steps": {"$avg": "$steps"},
                "avg_calories": {"$avg": "$calories"},
                "avg_distance": {"$avg": "$distance"},
                "avg_exercise": {"$avg": "$exercise_minutes"},
                "avg_sleep": {"$avg": "$sleep_hours"},
                "avg_resting_hr": {"$avg": "$resting_heart_rate"},
                "avg_walking_hr": {"$avg": "$walking_heart_rate"}
            }
        }
    ]
    
    avg_result = list(db.healthkit_data.aggregate(pipeline))
    
    if avg_result:
        avg = avg_result[0]
        print("\nAverages:")
        print(f"Steps: {avg['avg_steps']:.1f}")
        print(f"Calories: {avg['avg_calories']:.1f}")
        print(f"Distance: {avg['avg_distance']:.1f} meters")
        print(f"Exercise: {avg['avg_exercise']:.1f} minutes")
        print(f"Sleep: {avg['avg_sleep']:.2f} hours")
        print(f"Resting HR: {avg['avg_resting_hr']:.1f} bpm")
        print(f"Walking HR: {avg['avg_walking_hr']:.1f} bpm")

if __name__ == "__main__":
    main() 