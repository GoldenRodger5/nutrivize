#!/usr/bin/env python3
"""
Comprehensive seeding script for Nutrivize V2
1. Seeds diverse foods into the food index
2. Creates varied meal logs for dates 6/27-6/30 using only indexed foods
"""

import sys
import os
sys.path.append('/Users/isaacmineo/Main/projects/nutrivize-v2/backend')

from app.core.config import get_database
from datetime import datetime, timedelta
import random

# User ID for IsaacMineo@gmail.com
USER_ID = "GME7nGpJQRc2v9T057vJ4oyqAJN2"

def seed_foods():
    """Seed diverse foods into the food index"""
    db = get_database()
    foods_collection = db["food_items"]
    
    # Clear existing foods for this user
    foods_collection.delete_many({"created_by": USER_ID})
    
    foods_to_add = [
        # Breakfast foods
        {
            "name": "Steel Cut Oats",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 150,
                "protein": 5,
                "carbs": 27,
                "fat": 3,
                "fiber": 4,
                "sugar": 1,
                "sodium": 0
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Greek Yogurt (Plain)",
            "serving_size": 1,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 130,
                "protein": 20,
                "carbs": 9,
                "fat": 0,
                "fiber": 0,
                "sugar": 9,
                "sodium": 75
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Blueberries",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 42,
                "protein": 0.5,
                "carbs": 11,
                "fat": 0.2,
                "fiber": 2,
                "sugar": 7,
                "sodium": 1
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Whole Wheat Toast",
            "serving_size": 1,
            "serving_unit": "slice",
            "nutrition": {
                "calories": 80,
                "protein": 4,
                "carbs": 14,
                "fat": 1,
                "fiber": 2,
                "sugar": 1,
                "sodium": 170
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Almond Butter",
            "serving_size": 2,
            "serving_unit": "tbsp",
            "nutrition": {
                "calories": 190,
                "protein": 7,
                "carbs": 7,
                "fat": 17,
                "fiber": 3,
                "sugar": 2,
                "sodium": 0
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Free Range Eggs",
            "serving_size": 2,
            "serving_unit": "large",
            "nutrition": {
                "calories": 140,
                "protein": 12,
                "carbs": 1,
                "fat": 10,
                "fiber": 0,
                "sugar": 1,
                "sodium": 140
            },
            "source": "user",
            "created_by": USER_ID
        },
        
        # Lunch foods
        {
            "name": "Grilled Chicken Breast",
            "serving_size": 4,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 185,
                "protein": 35,
                "carbs": 0,
                "fat": 4,
                "fiber": 0,
                "sugar": 0,
                "sodium": 75
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Quinoa (Cooked)",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 111,
                "protein": 4,
                "carbs": 20,
                "fat": 2,
                "fiber": 3,
                "sugar": 0,
                "sodium": 7
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Mixed Greens Salad",
            "serving_size": 2,
            "serving_unit": "cups",
            "nutrition": {
                "calories": 20,
                "protein": 2,
                "carbs": 4,
                "fat": 0,
                "fiber": 2,
                "sugar": 2,
                "sodium": 20
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Avocado",
            "serving_size": 0.5,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 160,
                "protein": 2,
                "carbs": 9,
                "fat": 15,
                "fiber": 7,
                "sugar": 1,
                "sodium": 7
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Sweet Potato (Baked)",
            "serving_size": 1,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 112,
                "protein": 2,
                "carbs": 26,
                "fat": 0,
                "fiber": 4,
                "sugar": 5,
                "sodium": 6
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Brown Rice (Cooked)",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 108,
                "protein": 3,
                "carbs": 22,
                "fat": 1,
                "fiber": 2,
                "sugar": 0,
                "sodium": 2
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Salmon Fillet",
            "serving_size": 4,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 206,
                "protein": 28,
                "carbs": 0,
                "fat": 9,
                "fiber": 0,
                "sugar": 0,
                "sodium": 65
            },
            "source": "user",
            "created_by": USER_ID
        },
        
        # Dinner foods
        {
            "name": "Lean Ground Turkey",
            "serving_size": 4,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 120,
                "protein": 28,
                "carbs": 0,
                "fat": 1,
                "fiber": 0,
                "sugar": 0,
                "sodium": 90
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Broccoli (Steamed)",
            "serving_size": 1,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 25,
                "protein": 3,
                "carbs": 5,
                "fat": 0,
                "fiber": 3,
                "sugar": 2,
                "sodium": 30
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Whole Wheat Pasta (Cooked)",
            "serving_size": 1,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 174,
                "protein": 7,
                "carbs": 37,
                "fat": 1,
                "fiber": 6,
                "sugar": 1,
                "sodium": 4
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Olive Oil",
            "serving_size": 1,
            "serving_unit": "tbsp",
            "nutrition": {
                "calories": 119,
                "protein": 0,
                "carbs": 0,
                "fat": 14,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0
            },
            "source": "user",
            "created_by": USER_ID
        },
        
        # Snack foods
        {
            "name": "Almonds (Raw)",
            "serving_size": 1,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 164,
                "protein": 6,
                "carbs": 6,
                "fat": 14,
                "fiber": 4,
                "sugar": 1,
                "sodium": 0
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Apple (Medium)",
            "serving_size": 1,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 95,
                "protein": 0,
                "carbs": 25,
                "fat": 0,
                "fiber": 4,
                "sugar": 19,
                "sodium": 2
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Cottage Cheese (Low Fat)",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 90,
                "protein": 14,
                "carbs": 5,
                "fat": 1,
                "fiber": 0,
                "sugar": 5,
                "sodium": 450
            },
            "source": "user",
            "created_by": USER_ID
        },
        {
            "name": "Banana (Medium)",
            "serving_size": 1,
            "serving_unit": "medium",
            "nutrition": {
                "calories": 105,
                "protein": 1,
                "carbs": 27,
                "fat": 0,
                "fiber": 3,
                "sugar": 14,
                "sodium": 1
            },
            "source": "user",
            "created_by": USER_ID
        }
    ]
    
    # Insert foods and return their IDs
    result = foods_collection.insert_many(foods_to_add)
    print(f"✅ Added {len(result.inserted_ids)} foods to the index")
    
    # Return foods with their IDs for logging
    foods_with_ids = []
    for i, food in enumerate(foods_to_add):
        food_copy = food.copy()
        food_copy["_id"] = result.inserted_ids[i]
        foods_with_ids.append(food_copy)
    
    return foods_with_ids

def create_food_logs(foods_list):
    """Create varied food logs for the past 4 days using only indexed foods"""
    db = get_database()
    food_logs_collection = db["food_logs"]
    
    # Clear existing food logs for this user
    food_logs_collection.delete_many({"user_id": USER_ID})
    
    # Create logs for 6/26-6/30 (5 days)
    base_date = datetime(2025, 6, 26)
    
    # Organize foods by type for easier meal planning
    breakfast_foods = foods_list[:6]  # First 6 foods
    lunch_foods = foods_list[6:13]    # Next 7 foods  
    dinner_foods = foods_list[13:17]  # Next 4 foods
    snack_foods = foods_list[17:]     # Remaining foods
    
    logs_to_add = []
    
    for day_offset in range(5):  # 5 days: 6/26-6/30
        current_date = base_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Create breakfast (2-3 items)
        if day_offset == 0:  # 6/26 - Greek yogurt with blueberries
            logs_to_add.extend([
                create_log_entry(breakfast_foods[1], date_str, "breakfast", 1.0),  # Greek Yogurt
                create_log_entry(breakfast_foods[2], date_str, "breakfast", 1.0),  # Blueberries
            ])
        elif day_offset == 1:  # 6/27 - Oats with blueberries
            logs_to_add.extend([
                create_log_entry(breakfast_foods[0], date_str, "breakfast", 1.0),  # Steel Cut Oats
                create_log_entry(breakfast_foods[2], date_str, "breakfast", 1.0),  # Blueberries
            ])
        elif day_offset == 2:  # 6/28 - Greek yogurt with fruit
            logs_to_add.extend([
                create_log_entry(breakfast_foods[1], date_str, "breakfast", 0.75),  # Greek Yogurt
                create_log_entry(snack_foods[3], date_str, "breakfast", 1.0),      # Banana
            ])
        elif day_offset == 3:  # 6/29 - Toast with almond butter
            logs_to_add.extend([
                create_log_entry(breakfast_foods[3], date_str, "breakfast", 2.0),  # Whole Wheat Toast
                create_log_entry(breakfast_foods[4], date_str, "breakfast", 1.0),  # Almond Butter
            ])
        else:  # 6/30 - Eggs and toast
            logs_to_add.extend([
                create_log_entry(breakfast_foods[5], date_str, "breakfast", 1.0),  # Free Range Eggs
                create_log_entry(breakfast_foods[3], date_str, "breakfast", 1.0),  # Whole Wheat Toast
            ])
        
        # Create lunch (3-4 items)
        if day_offset == 0:  # 6/26 - Salmon with quinoa
            logs_to_add.extend([
                create_log_entry(lunch_foods[6], date_str, "lunch", 1.0),  # Salmon
                create_log_entry(lunch_foods[1], date_str, "lunch", 1.0),  # Quinoa
                create_log_entry(lunch_foods[2], date_str, "lunch", 1.0),  # Mixed Greens
            ])
        elif day_offset == 1:  # 6/27 - Chicken quinoa salad
            logs_to_add.extend([
                create_log_entry(lunch_foods[0], date_str, "lunch", 1.0),  # Grilled Chicken
                create_log_entry(lunch_foods[1], date_str, "lunch", 1.0),  # Quinoa
                create_log_entry(lunch_foods[2], date_str, "lunch", 1.0),  # Mixed Greens
                create_log_entry(lunch_foods[3], date_str, "lunch", 1.0),  # Avocado
            ])
        elif day_offset == 2:  # 6/28 - Salmon with sweet potato
            logs_to_add.extend([
                create_log_entry(lunch_foods[6], date_str, "lunch", 1.0),  # Salmon
                create_log_entry(lunch_foods[4], date_str, "lunch", 1.0),  # Sweet Potato
                create_log_entry(lunch_foods[2], date_str, "lunch", 1.0),  # Mixed Greens
            ])
        elif day_offset == 3:  # 6/29 - Chicken with brown rice
            logs_to_add.extend([
                create_log_entry(lunch_foods[0], date_str, "lunch", 1.0),  # Grilled Chicken
                create_log_entry(lunch_foods[5], date_str, "lunch", 1.0),  # Brown Rice
                create_log_entry(dinner_foods[1], date_str, "lunch", 1.0), # Broccoli
            ])
        else:  # 6/30 - Quinoa salad bowl
            logs_to_add.extend([
                create_log_entry(lunch_foods[1], date_str, "lunch", 1.0),  # Quinoa
                create_log_entry(lunch_foods[2], date_str, "lunch", 1.5),  # Mixed Greens
                create_log_entry(lunch_foods[3], date_str, "lunch", 1.0),  # Avocado
                create_log_entry(dinner_foods[3], date_str, "lunch", 0.5), # Olive Oil
            ])
        
        # Create dinner (3-4 items)
        if day_offset == 0:  # 6/26 - Chicken with sweet potato
            logs_to_add.extend([
                create_log_entry(lunch_foods[0], date_str, "dinner", 1.0),  # Grilled Chicken
                create_log_entry(lunch_foods[4], date_str, "dinner", 1.0),  # Sweet Potato
                create_log_entry(dinner_foods[1], date_str, "dinner", 1.0),  # Broccoli
            ])
        elif day_offset == 1:  # 6/27 - Turkey with pasta
            logs_to_add.extend([
                create_log_entry(dinner_foods[0], date_str, "dinner", 1.0),  # Lean Ground Turkey
                create_log_entry(dinner_foods[2], date_str, "dinner", 1.0),  # Whole Wheat Pasta
                create_log_entry(dinner_foods[1], date_str, "dinner", 1.5),  # Broccoli
                create_log_entry(dinner_foods[3], date_str, "dinner", 0.5),  # Olive Oil
            ])
        elif day_offset == 2:  # 6/28 - Chicken with sweet potato
            logs_to_add.extend([
                create_log_entry(lunch_foods[0], date_str, "dinner", 1.0),  # Grilled Chicken
                create_log_entry(lunch_foods[4], date_str, "dinner", 1.0),  # Sweet Potato
                create_log_entry(dinner_foods[1], date_str, "dinner", 1.0),  # Broccoli
            ])
        elif day_offset == 3:  # 6/29 - Salmon with quinoa
            logs_to_add.extend([
                create_log_entry(lunch_foods[6], date_str, "dinner", 1.0),  # Salmon
                create_log_entry(lunch_foods[1], date_str, "dinner", 1.0),  # Quinoa
                create_log_entry(lunch_foods[2], date_str, "dinner", 1.0),  # Mixed Greens
            ])
        else:  # 6/30 - Turkey pasta
            logs_to_add.extend([
                create_log_entry(dinner_foods[0], date_str, "dinner", 1.0),  # Turkey
                create_log_entry(dinner_foods[2], date_str, "dinner", 0.75), # Pasta
                create_log_entry(dinner_foods[1], date_str, "dinner", 1.0),  # Broccoli
            ])
        
        # Create snacks (1-2 items per day)
        if day_offset == 0:  # 6/26
            logs_to_add.append(create_log_entry(snack_foods[3], date_str, "snack", 1.0))  # Banana
        elif day_offset == 1:  # 6/27
            logs_to_add.append(create_log_entry(snack_foods[0], date_str, "snack", 1.0))  # Almonds
        elif day_offset == 2:  # 6/28
            logs_to_add.append(create_log_entry(snack_foods[1], date_str, "snack", 1.0))  # Apple
        elif day_offset == 3:  # 6/29
            logs_to_add.append(create_log_entry(snack_foods[2], date_str, "snack", 1.0))  # Cottage Cheese
        else:  # 6/30
            logs_to_add.extend([
                create_log_entry(snack_foods[1], date_str, "snack", 1.0),  # Apple
                create_log_entry(snack_foods[0], date_str, "snack", 0.5),  # Almonds
            ])
    
    # Insert all logs
    result = food_logs_collection.insert_many(logs_to_add)
    print(f"✅ Added {len(result.inserted_ids)} food log entries")

def create_log_entry(food, date_str, meal_type, amount):
    """Create a food log entry"""
    return {
        "user_id": USER_ID,
        "date": date_str,
        "meal_type": meal_type,
        "food_id": str(food["_id"]),
        "food_name": food["name"],
        "amount": amount,
        "unit": food["serving_unit"],
        "nutrition": {
            "calories": food["nutrition"]["calories"] * amount,
            "protein": food["nutrition"]["protein"] * amount,
            "carbs": food["nutrition"]["carbs"] * amount,
            "fat": food["nutrition"]["fat"] * amount,
            "fiber": food["nutrition"]["fiber"] * amount,
            "sugar": food["nutrition"]["sugar"] * amount,
            "sodium": food["nutrition"]["sodium"] * amount
        },
        "notes": "",
        "logged_at": datetime.utcnow()
    }

def main():
    print("🌱 Starting comprehensive data seeding...")
    print(f"👤 User ID: {USER_ID}")
    
    # Step 1: Seed foods
    print("\n📦 Seeding food index...")
    foods_list = seed_foods()
    
    # Step 2: Create food logs using only indexed foods
    print("\n📝 Creating food logs...")
    create_food_logs(foods_list)
    
    print("\n✅ Seeding completed successfully!")
    # Add completion summary
    print(f"\n✅ Data seeding completed for user: IsaacMineo@gmail.com")
    print(f"- Added {len(foods_list)} diverse foods to the index")
    print("- Created meal logs for 6/27-6/30 (4 days)")
    print("- Each day includes breakfast, lunch, dinner, and snacks")
    print("- All logs use only foods from the index")

if __name__ == "__main__":
    main()
