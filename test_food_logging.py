#!/usr/bin/env python3
"""
Test script for the food logging functionality in the Add Log feature.
"""

import requests
import json
from datetime import date

def test_food_logging():
    BASE_URL = "http://localhost:8000"
    
    # Test data for logging food
    test_log = {
        "date": str(date.today()),
        "meal_type": "lunch",
        "food_id": "test_food_123",
        "food_name": "Apple (Medium)",
        "amount": 1.0,
        "unit": "medium",
        "nutrition": {
            "calories": 95,
            "protein": 0.5,
            "carbs": 25,
            "fat": 0.3,
            "fiber": 4,
            "sugar": 19,
            "sodium": 2
        },
        "notes": "Test log from Add Log button"
    }
    
    print("Testing Food Logging API...")
    print(f"Target URL: {BASE_URL}/food-logs")
    print(f"Log data: {json.dumps(test_log, indent=2)}")
    
    try:
        # Note: This will fail without auth token, but we can see the endpoint structure
        response = requests.post(f"{BASE_URL}/food-logs", json=test_log)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 401:
            print("✅ Expected 401 - Authentication required (API is working)")
        elif response.status_code == 200:
            print("✅ Success - Food logged successfully")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_food_logging()
