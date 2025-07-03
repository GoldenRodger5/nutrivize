#!/usr/bin/env python3
"""
Comprehensive seeding script for Nutrivize V2
1. Seeds diverse foods into the food index
2. Creates varied meal logs for dates 6/26-6/30 using only indexed foods
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
    foods_collection = db["foods"]
    
    # Clear existing foods for this user
    foods_collection.delete_many({"user_id": USER_ID})
    
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
            "user_id": USER_ID
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
            "user_id": USER_ID
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
            "user_id": USER_ID
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
            "user_id": USER_ID
        },
        {
            "name": "Almond Butter",
            "serving_size": 2,
            "serving_unit": "tbsp",
            "nutrition": {
                "calories": 196,
                "protein": 7,
                "carbs": 7,
                "fat": 18,
                "fiber": 4,
                "sugar": 2,
                "sodium": 0
            },
            "source": "user",
            "user_id": USER_ID
        },
        {
            "name": "Eggs (Large)",
            "serving_size": 2,
            "serving_unit": "eggs",
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
            "user_id": USER_ID
        },
        {
            "name": "Spinach (Fresh)",
            "serving_size": 2,
            "serving_unit": "cups",
            "nutrition": {
                "calories": 14,
                "protein": 2,
                "carbs": 2,
                "fat": 0,
                "fiber": 1,
                "sugar": 0,
                "sodium": 47
            },
            "source": "user",
            "user_id": USER_ID
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
            "user_id": USER_ID
        },
        # Lunch/Dinner proteins
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
                "sodium": 84
            },
            "source": "user",
            "user_id": USER_ID
        },
        {
            "name": "Salmon (Atlantic)",
            "serving_size": 4,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 206,
                "protein": 28,
                "carbs": 0,
                "fat": 9,
                "fiber": 0,
                "sugar": 0,
                "sodium": 59
            },
            "source": "user",
            "user_id": USER_ID
        },
        {
            "name": "Ground Turkey (Lean)",
            "serving_size": 4,
            "serving_unit": "oz",
            "nutrition": {
                "calories": 120,
                "protein": 26,
                "carbs": 0,
                "fat": 1,
                "fiber": 0,
                "sugar": 0,
                "sodium": 65
            },
            "source": "user",
            "user_id": USER_ID
        },
        # Carbs
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
            "user_id": USER_ID
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
                "sodium": 7
            },
            "source": "user",
            "user_id": USER_ID
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
                "sodium": 6
            },
            "source": "user",
            "user_id": USER_ID
        },
        # Vegetables
        {
            "name": "Broccoli (Steamed)",
            "serving_size": 1,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 27,
                "protein": 3,
                "carbs": 5,
                "fat": 0,
                "fiber": 2,
                "sugar": 2,
                "sodium": 19
            },
            "source": "user",
            "user_id": USER_ID
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
                "sodium": 22
            },
            "source": "user",
            "user_id": USER_ID
        },
        {
            "name": "Bell Peppers (Mixed)",
            "serving_size": 1,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 24,
                "protein": 1,
                "carbs": 6,
                "fat": 0,
                "fiber": 2,
                "sugar": 4,
                "sodium": 2
            },
            "source": "user",
            "user_id": USER_ID
        },
        # Snacks
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
            "user_id": USER_ID
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
            "user_id": USER_ID
        },
        {
            "name": "Hummus",
            "serving_size": 2,
            "serving_unit": "tbsp",
            "nutrition": {
                "calories": 70,
                "protein": 3,
                "carbs": 6,
                "fat": 5,
                "fiber": 2,
                "sugar": 0,
                "sodium": 115
            },
            "source": "user",
            "user_id": USER_ID
        },
        {
            "name": "Cottage Cheese (Low Fat)",
            "serving_size": 0.5,
            "serving_unit": "cup",
            "nutrition": {
                "calories": 81,
                "protein": 14,
                "carbs": 3,
                "fat": 1,
                "fiber": 0,
                "sugar": 3,
                "sodium": 459
            },
            "source": "user",
            "user_id": USER_ID
        }
    ]
    
    # Insert foods
    result = foods_collection.insert_many(foods_to_add)
    print(f"Added {len(result.inserted_ids)} foods to the index")
    
    return foods_to_add

def seed_goals():
    """Create nutrition goals for the user"""
    db = get_database()
    goals_collection = db["goals"]
    
    # Clear existing goals for this user
    goals_collection.delete_many({"user_id": USER_ID})
    
    goal = {
        "user_id": USER_ID,
        "goal_type": "weight_loss",
        "target_weight": 180,
        "activity_level": "moderately_active",
        "nutrition_targets": {
            "calories": 2000,
            "protein": 150,
            "carbs": 200,
            "fat": 89
        },
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    goals_collection.insert_one(goal)
    print("Created nutrition goals")

def seed_food_logs():
    """Create varied food logs for the past 5 days using indexed foods"""
    db = get_database()
    food_logs_collection = db["food_logs"]
    foods_collection = db["foods"]
    
    # Clear existing logs for this user
    food_logs_collection.delete_many({"user_id": USER_ID})
    
    # Get all foods for this user
    foods = list(foods_collection.find({"user_id": USER_ID}))
    
    if not foods:
        print("No foods found! Make sure to run seed_foods() first.")
        return
    
    # Create food lookup by name for easy access
    foods_by_name = {food["name"]: food for food in foods}
    
    # Define dates for the past 5 days (6/26-6/30)
    start_date = datetime(2024, 6, 26)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]
    
    print(f"Creating logs for dates: {dates}")
    
    # Define varied meal plans for each day
    meal_plans = [
        # Day 1 (6/26)
        {
            "breakfast": [
                {"food": "Steel Cut Oats", "quantity": 1},
                {"food": "Blueberries", "quantity": 1},
                {"food": "Almond Butter", "quantity": 0.5}
            ],
            "lunch": [
                {"food": "Grilled Chicken Breast", "quantity": 1},
                {"food": "Quinoa (Cooked)", "quantity": 1},
                {"food": "Broccoli (Steamed)", "quantity": 1},
                {"food": "Avocado", "quantity": 0.5}
            ],
            "dinner": [
                {"food": "Salmon (Atlantic)", "quantity": 1},
                {"food": "Sweet Potato (Baked)", "quantity": 1},
                {"food": "Spinach (Fresh)", "quantity": 1}
            ],
            "snacks": [
                {"food": "Greek Yogurt (Plain)", "quantity": 0.5},
                {"food": "Almonds (Raw)", "quantity": 1}
            ]
        },
        # Day 2 (6/27)
        {
            "breakfast": [
                {"food": "Eggs (Large)", "quantity": 1},
                {"food": "Whole Wheat Toast", "quantity": 2},
                {"food": "Avocado", "quantity": 0.5}
            ],
            "lunch": [
                {"food": "Ground Turkey (Lean)", "quantity": 1},
                {"food": "Brown Rice (Cooked)", "quantity": 1},
                {"food": "Bell Peppers (Mixed)", "quantity": 1},
                {"food": "Mixed Greens Salad", "quantity": 1}
            ],
            "dinner": [
                {"food": "Grilled Chicken Breast", "quantity": 1},
                {"food": "Quinoa (Cooked)", "quantity": 1},
                {"food": "Broccoli (Steamed)", "quantity": 1.5}
            ],
            "snacks": [
                {"food": "Apple (Medium)", "quantity": 1},
                {"food": "Cottage Cheese (Low Fat)", "quantity": 1}
            ]
        },
        # Day 3 (6/28)
        {
            "breakfast": [
                {"food": "Greek Yogurt (Plain)", "quantity": 1},
                {"food": "Blueberries", "quantity": 1.5},
                {"food": "Almonds (Raw)", "quantity": 0.5}
            ],
            "lunch": [
                {"food": "Salmon (Atlantic)", "quantity": 1},
                {"food": "Sweet Potato (Baked)", "quantity": 1},
                {"food": "Spinach (Fresh)", "quantity": 2}
            ],
            "dinner": [
                {"food": "Ground Turkey (Lean)", "quantity": 1.25},
                {"food": "Brown Rice (Cooked)", "quantity": 1},
                {"food": "Bell Peppers (Mixed)", "quantity": 1},
                {"food": "Avocado", "quantity": 0.5}
            ],
            "snacks": [
                {"food": "Hummus", "quantity": 2},
                {"food": "Apple (Medium)", "quantity": 1}
            ]
        },
        # Day 4 (6/29)
        {
            "breakfast": [
                {"food": "Steel Cut Oats", "quantity": 1.25},
                {"food": "Almond Butter", "quantity": 1},
                {"food": "Blueberries", "quantity": 0.75}
            ],
            "lunch": [
                {"food": "Grilled Chicken Breast", "quantity": 1.25},
                {"food": "Quinoa (Cooked)", "quantity": 1},
                {"food": "Mixed Greens Salad", "quantity": 1.5},
                {"food": "Avocado", "quantity": 0.5}
            ],
            "dinner": [
                {"food": "Salmon (Atlantic)", "quantity": 1},
                {"food": "Sweet Potato (Baked)", "quantity": 1},
                {"food": "Broccoli (Steamed)", "quantity": 1}
            ],
            "snacks": [
                {"food": "Cottage Cheese (Low Fat)", "quantity": 1},
                {"food": "Almonds (Raw)", "quantity": 1}
            ]
        },
        # Day 5 (6/30)
        {
            "breakfast": [
                {"food": "Eggs (Large)", "quantity": 1.5},
                {"food": "Spinach (Fresh)", "quantity": 1},
                {"food": "Whole Wheat Toast", "quantity": 1}
            ],
            "lunch": [
                {"food": "Ground Turkey (Lean)", "quantity": 1},
                {"food": "Brown Rice (Cooked)", "quantity": 1.25},
                {"food": "Bell Peppers (Mixed)", "quantity": 1.5},
                {"food": "Hummus", "quantity": 1}
            ],
            "dinner": [
                {"food": "Grilled Chicken Breast", "quantity": 1},
                {"food": "Quinoa (Cooked)", "quantity": 1},
                {"food": "Broccoli (Steamed)", "quantity": 1},
                {"food": "Avocado", "quantity": 1}
            ],
            "snacks": [
                {"food": "Greek Yogurt (Plain)", "quantity": 0.75},
                {"food": "Blueberries", "quantity": 1},
                {"food": "Apple (Medium)", "quantity": 1}
            ]
        }
    ]
    
    total_logs = 0
    
    for day_idx, date in enumerate(dates):
        day_plan = meal_plans[day_idx]
        
        for meal_type, foods_in_meal in day_plan.items():
            for food_entry in foods_in_meal:
                food_name = food_entry["food"]
                quantity = food_entry["quantity"]
                
                if food_name not in foods_by_name:
                    print(f"Warning: Food '{food_name}' not found in index!")
                    continue
                
                food = foods_by_name[food_name]
                
                # Calculate nutrition based on quantity
                base_nutrition = food["nutrition"]
                actual_nutrition = {
                    key: round(value * quantity, 1) for key, value in base_nutrition.items()
                }
                
                log_entry = {
                    "user_id": USER_ID,
                    "food_id": str(food["_id"]),
                    "food_name": food["name"],
                    "date": date,
                    "meal_type": meal_type,
                    "quantity": quantity,
                    "serving_size": food["serving_size"],
                    "serving_unit": food["serving_unit"],
                    "nutrition": actual_nutrition,
                    "logged_at": datetime.utcnow()
                }
                
                food_logs_collection.insert_one(log_entry)
                total_logs += 1
    
    print(f"Created {total_logs} food log entries")

def main():
    """Run the comprehensive seeding process"""
    print("Starting comprehensive data seeding...")
    print(f"User ID: {USER_ID}")
    print()
    
    # Step 1: Seed foods
    print("1. Seeding foods...")
    foods_list = seed_foods()
    print()
    
    # Step 2: Seed goals
    print("2. Seeding goals...")
    seed_goals()
    print()
    
    # Step 3: Seed food logs
    print("3. Seeding food logs...")
    seed_food_logs()
    print()
    
    print("=== SEEDING COMPLETE ===")
    print("Data summary:")
    print(f"- Added {len(foods_list)} diverse foods to the index")
    print("- Created meal logs for 6/26-6/30 (5 days)")
    print("- Each day includes breakfast, lunch, dinner, and snacks")
    print("- All logs use only foods from the index")
    print("- Created nutrition goals for weight loss")

if __name__ == "__main__":
    main()
