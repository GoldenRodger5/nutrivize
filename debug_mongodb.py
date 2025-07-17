#!/usr/bin/env python3
"""
Debug script to check MongoDB data directly
"""
import os
import sys
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from pymongo import MongoClient
from datetime import datetime, timedelta
import json

# Connect to MongoDB
client = MongoClient("mongodb+srv://isaacmineo:f0odtrack3r@cluster0.bfgsw.mongodb.net/nutrivize?retryWrites=true&w=majority")
db = client.nutrivize
users_collection = db.users

def main():
    print("🔍 Debug MongoDB Recent Foods")
    print("=" * 50)
    
    # Find the test user
    user_uid = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
    user = users_collection.find_one({"uid": user_uid})
    
    if not user:
        print("❌ User not found in database")
        return
    
    print(f"✅ Found user: {user['name']} ({user['email']})")
    
    # Check recent foods
    recent_foods = user.get("recent_foods", [])
    print(f"\n📋 Recent foods count: {len(recent_foods)}")
    
    if recent_foods:
        print("\n🍎 Recent Foods:")
        for i, food in enumerate(recent_foods):
            print(f"  {i+1}. {food.get('food_name', 'Unknown')} - {food.get('last_used', 'No timestamp')}")
            print(f"     Type: {type(food.get('last_used', 'None'))}")
            print(f"     Raw: {food.get('last_used', 'None')}")
            
            # Try to parse the timestamp
            try:
                if isinstance(food.get('last_used'), str):
                    parsed_time = datetime.fromisoformat(food['last_used'].replace("Z", "+00:00"))
                    print(f"     Parsed: {parsed_time}")
                    
                    # Check if it's within 5 days
                    five_days_ago = datetime.utcnow() - timedelta(days=5)
                    is_recent = parsed_time > five_days_ago
                    print(f"     Is recent (< 5 days): {is_recent}")
                    print(f"     Five days ago: {five_days_ago}")
                    print(f"     Difference: {datetime.utcnow() - parsed_time}")
                    
            except Exception as e:
                print(f"     ❌ Parse error: {e}")
            
            print()
    else:
        print("   No recent foods found")
    
    # Check favorite foods
    favorite_foods = user.get("favorite_foods", [])
    print(f"\n⭐ Favorite foods count: {len(favorite_foods)}")
    
    if favorite_foods:
        print("\n🌟 Favorite Foods:")
        for i, food in enumerate(favorite_foods):
            print(f"  {i+1}. {food.get('food_name', 'Unknown')} - {food.get('added_date', 'No timestamp')}")
    
    client.close()

if __name__ == "__main__":
    main()
