#!/usr/bin/env python3
"""
Seed script to add sample foods and food logs for testing
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_database
from datetime import datetime, date, timedelta
import uuid

def seed_foods_and_logs():
    """Seed the database with sample foods and food logs"""
    db = get_database()
    food_collection = db["food_items"]
    food_logs_collection = db["food_logs"]
    
    # Sample foods to add
    sample_foods = [
        {
            "name": "Chicken Breast",
            "serving_size": 100,
            "serving_unit": "g",
            "nutrition": {
                "calories": 165,
                "protein": 31,
                "carbs": 0,
                "fat": 3.6,
                "fiber": 0,
                "sugar": 0,
                "sodium": 74
            },
            "source": "system"
        },
        {
            "name": "Brown Rice",
            "serving_size": 100,
            "serving_unit": "g",
            "nutrition": {
                "calories": 111,
                "protein": 2.6,
                "carbs": 23,
                "fat": 0.9,
                "fiber": 1.8,
                "sugar": 0.4,
                "sodium": 5
            },
            "source": "system"
        },
        {
            "name": "Broccoli",
            "serving_size": 100,
            "serving_unit": "g",
            "nutrition": {
                "calories": 34,
                "protein": 2.8,
                "carbs": 7,
                "fat": 0.4,
                "fiber": 2.6,
                "sugar": 1.5,
                "sodium": 33
            },
            "source": "system"
        },
        {
            "name": "Banana",
            "serving_size": 1,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 105,
                "protein": 1.3,
                "carbs": 27,
                "fat": 0.4,
                "fiber": 3.1,
                "sugar": 14,
                "sodium": 1
            },
            "source": "system"
        },
        {
            "name": "Greek Yogurt",
            "serving_size": 100,
            "serving_unit": "g",
            "nutrition": {
                "calories": 59,
                "protein": 10,
                "carbs": 3.6,
                "fat": 0.4,
                "fiber": 0,
                "sugar": 3.6,
                "sodium": 36
            },
            "source": "system"
        },
        {
            "name": "Almonds",
            "serving_size": 28,
            "serving_unit": "g",
            "nutrition": {
                "calories": 164,
                "protein": 6,
                "carbs": 6,
                "fat": 14,
                "fiber": 3.5,
                "sugar": 1,
                "sodium": 1
            },
            "source": "system"
        },
        {
            "name": "Salmon",
            "serving_size": 100,
            "serving_unit": "g",
            "nutrition": {
                "calories": 208,
                "protein": 20,
                "carbs": 0,
                "fat": 13,
                "fiber": 0,
                "sugar": 0,
                "sodium": 59
            },
            "source": "system"
        },
        {
            "name": "Oatmeal",
            "serving_size": 40,
            "serving_unit": "g",
            "nutrition": {
                "calories": 158,
                "protein": 5.4,
                "carbs": 28,
                "fat": 3.2,
                "fiber": 4,
                "sugar": 0.8,
                "sodium": 2
            },
            "source": "system"
        }
    ]
    
    # Insert foods and get their IDs
    food_ids = {}
    for food in sample_foods:
        # Check if food already exists
        existing = food_collection.find_one({"name": food["name"]})
        if existing:
            food_ids[food["name"]] = str(existing["_id"])
            print(f"Food '{food['name']}' already exists")
        else:
            result = food_collection.insert_one(food)
            food_ids[food["name"]] = str(result.inserted_id)
            print(f"Added food: {food['name']}")
    
    # Test user ID (you'll need to replace this with an actual user ID from your Firebase)
    test_user_id = "test_user_123"  # Replace with actual Firebase UID
    
    # Define date range: 6/27-6/30
    start_date = date(2025, 6, 27)
    dates = [start_date + timedelta(days=i) for i in range(4)]  # 6/27, 6/28, 6/29, 6/30
    
    # Sample meal plans for each day
    meal_plans = {
        "breakfast": [
            {"food": "Oatmeal", "amount": 1.5},
            {"food": "Banana", "amount": 1},
            {"food": "Almonds", "amount": 0.5}
        ],
        "lunch": [
            {"food": "Chicken Breast", "amount": 1.2},
            {"food": "Brown Rice", "amount": 0.8},
            {"food": "Broccoli", "amount": 1.5}
        ],
        "dinner": [
            {"food": "Salmon", "amount": 1.3},
            {"food": "Brown Rice", "amount": 0.6},
            {"food": "Broccoli", "amount": 1.0}
        ],
        "snack": [
            {"food": "Greek Yogurt", "amount": 1.0},
            {"food": "Almonds", "amount": 0.3}
        ]
    }
    
    # Clear existing logs for test user in this date range
    food_logs_collection.delete_many({
        "user_id": test_user_id,
        "date": {"$in": [d.isoformat() for d in dates]}
    })
    
    # Generate food logs
    for target_date in dates:
        for meal_type, foods in meal_plans.items():
            for food_info in foods:
                food_name = food_info["food"]
                amount = food_info["amount"]
                
                if food_name in food_ids:
                    # Get food details
                    food_doc = food_collection.find_one({"_id": ObjectId(food_ids[food_name])})
                    if food_doc:
                        # Calculate nutrition
                        base_nutrition = food_doc["nutrition"]
                        calculated_nutrition = {
                            "calories": base_nutrition["calories"] * amount,
                            "protein": base_nutrition["protein"] * amount,
                            "carbs": base_nutrition["carbs"] * amount,
                            "fat": base_nutrition["fat"] * amount,
                            "fiber": base_nutrition["fiber"] * amount,
                            "sugar": base_nutrition["sugar"] * amount,
                            "sodium": base_nutrition["sodium"] * amount
                        }
                        
                        # Create log entry
                        log_entry = {
                            "user_id": test_user_id,
                            "date": target_date.isoformat(),
                            "meal_type": meal_type,
                            "food_id": food_ids[food_name],
                            "food_name": food_name,
                            "amount": amount,
                            "unit": food_doc["serving_unit"],
                            "nutrition": calculated_nutrition,
                            "notes": "",
                            "logged_at": datetime.now()
                        }
                        
                        food_logs_collection.insert_one(log_entry)
                        print(f"Added {food_name} to {meal_type} on {target_date}")

if __name__ == "__main__":
    from bson import ObjectId
    seed_foods_and_logs()
    print("Seeding completed!")
