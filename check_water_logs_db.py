#!/usr/bin/env python3
"""
Check water logs in MongoDB
"""
import sys
import os
from datetime import date, datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.config import get_database

def check_water_logs():
    """Check water logs in the database"""
    try:
        db = get_database()
        water_logs_collection = db.water_logs
        
        print("=== Water Logs Database Check ===")
        print(f"Collection name: {water_logs_collection.name}")
        
        # Count total documents
        total_count = water_logs_collection.count_documents({})
        print(f"Total water logs in database: {total_count}")
        
        if total_count > 0:
            # Show some sample logs
            print("\nSample water logs:")
            sample_logs = list(water_logs_collection.find({}).limit(5))
            for log in sample_logs:
                print(f"- Date: {log.get('date', 'N/A')}, Amount: {log.get('amount', 'N/A')}, User: {log.get('user_id', 'N/A')}")
        
        # Check today's logs
        today = date.today()
        today_str = today.isoformat()
        today_count = water_logs_collection.count_documents({"date": today_str})
        print(f"\nToday's water logs ({today_str}): {today_count}")
        
        if today_count > 0:
            today_logs = list(water_logs_collection.find({"date": today_str}))
            for log in today_logs:
                print(f"- Amount: {log.get('amount', 'N/A')}, User: {log.get('user_id', 'N/A')}, Notes: {log.get('notes', 'N/A')}")
        
        # Check unique users
        unique_users = water_logs_collection.distinct("user_id")
        print(f"\nUnique users with water logs: {len(unique_users)}")
        
        # Check recent logs
        recent_logs = list(water_logs_collection.find({}).sort("logged_at", -1).limit(3))
        print(f"\nMost recent water logs:")
        for log in recent_logs:
            print(f"- Date: {log.get('date', 'N/A')}, Amount: {log.get('amount', 'N/A')}, Logged at: {log.get('logged_at', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"Error checking water logs: {e}")
        return False

if __name__ == "__main__":
    check_water_logs()
