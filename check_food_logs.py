#!/usr/bin/env python3
"""
Check what food logs exist for the user
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "email": "isaacmineo@gmail.com", 
    "password": "Buddydog41"
}

def get_auth_token():
    """Get authentication token"""
    print("🔐 Getting authentication token...")
    response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER)
    
    if response.status_code == 200:
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Authentication failed: {response.text}")
        return None

def check_food_logs():
    """Check food logs for the user"""
    headers = get_auth_token()
    if not headers:
        return
    
    print("\n🔍 Checking food logs...")
    
    # Check today's logs
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"📅 Checking logs for today ({today})...")
    
    response = requests.get(
        f"{BASE_URL}/food-logs/daily/{today}",
        headers=headers
    )
    
    if response.status_code == 200:
        logs = response.json()
        print(f"✅ Found {len(logs)} food logs for today")
        for log in logs:
            print(f"   - {log.get('food_name', 'Unknown')} ({log.get('amount', 0)} {log.get('unit', '')})")
    else:
        print(f"❌ Failed to get today's logs: {response.text}")
    
    # Check logs for the past week
    print(f"\n📅 Checking logs for the past 7 days...")
    
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        response = requests.get(
            f"{BASE_URL}/food-logs/daily/{date}",
            headers=headers
        )
        
        if response.status_code == 200:
            logs = response.json()
            if logs and isinstance(logs, list):
                print(f"   {date}: {len(logs)} logs")
                for log in logs[:3]:  # Show first 3
                    print(f"      - {log.get('food_name', 'Unknown')} ({log.get('amount', 0)} {log.get('unit', '')})")
            elif logs:
                print(f"   {date}: Non-list response - {type(logs)}")
            else:
                print(f"   {date}: No logs")
        else:
            print(f"   {date}: Error - {response.status_code} - {response.text}")

    # Check range endpoint
    print(f"\n📅 Checking range endpoint for past 7 days...")
    
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    response = requests.get(
        f"{BASE_URL}/food-logs/range",
        params={"start_date": start_date, "end_date": end_date},
        headers=headers
    )
    
    if response.status_code == 200:
        logs = response.json()
        print(f"✅ Found {len(logs)} total food logs in range")
        
        # Group by date
        logs_by_date = {}
        for log in logs:
            date = log.get('date', 'Unknown')
            if date not in logs_by_date:
                logs_by_date[date] = []
            logs_by_date[date].append(log)
        
        print(f"📊 Logs grouped by date:")
        for date, date_logs in sorted(logs_by_date.items(), reverse=True):
            print(f"   {date}: {len(date_logs)} logs")
            for log in date_logs[:2]:  # Show first 2 per date
                print(f"      - {log.get('food_name', 'Unknown')} ({log.get('amount', 0)} {log.get('unit', '')})")
    else:
        print(f"❌ Failed to get range logs: {response.text}")

if __name__ == "__main__":
    check_food_logs()
