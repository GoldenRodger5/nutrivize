from datetime import datetime, timezone, time
from pymongo import MongoClient
import random
from bson import ObjectId
import os
import sys
from app.database import get_database

# Function to seed mock data for a specific user
def seed_for_user(user_id=None):
    """
    Seed the database with mock data for a specific user.
    
    Args:
        user_id: The user ID to create data for. If None, will use TEST_USER_ID from constants.
    """
    # If no user_id provided, use the test user ID from constants
    if user_id is None:
        from app.constants import TEST_USER_ID
        user_id = TEST_USER_ID
        print("No user ID provided, using test user ID from constants")

    # Use the database connection from the app
    db = get_database()

    print(f"Seeding mock data for user: {user_id}")

    # Delete existing food logs to prevent duplicates
    db.food_logs.delete_many({"user_id": user_id})
    print(f"Deleted existing food logs for user {user_id}")

    # Mock food items to add to the index
    mock_foods = [
        {
            "name": "Oatmeal", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 150,
            "proteins": 5,
            "carbs": 27,
            "fats": 3,
            "fiber": 4,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Scrambled Eggs", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 180,
            "proteins": 12,
            "carbs": 1,
            "fats": 13,
            "fiber": 0,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Avocado Toast", 
            "serving_size": 1,
            "serving_unit": "slice",
            "calories": 220,
            "proteins": 5,
            "carbs": 20,
            "fats": 15,
            "fiber": 7,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Banana", 
            "serving_size": 1,
            "serving_unit": "piece",
            "calories": 105,
            "proteins": 1.3,
            "carbs": 27,
            "fats": 0.4,
            "fiber": 3.1,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Chicken Breast", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 165,
            "proteins": 31,
            "carbs": 0,
            "fats": 3.6,
            "fiber": 0,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Salmon", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 208,
            "proteins": 20,
            "carbs": 0,
            "fats": 13,
            "fiber": 0,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Brown Rice", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 112,
            "proteins": 2.6,
            "carbs": 24,
            "fats": 0.9,
            "fiber": 1.8,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Sweet Potato", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 86,
            "proteins": 1.6,
            "carbs": 20,
            "fats": 0.1,
            "fiber": 3,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Greek Yogurt", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 59,
            "proteins": 10,
            "carbs": 3.6,
            "fats": 0.4,
            "fiber": 0,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Almonds", 
            "serving_size": 30,
            "serving_unit": "g",
            "calories": 173,
            "proteins": 6.3,
            "carbs": 6.1,
            "fats": 15,
            "fiber": 3.5,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Broccoli", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 34,
            "proteins": 2.8,
            "carbs": 6.6,
            "fats": 0.4,
            "fiber": 2.6,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Beef Steak", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 271,
            "proteins": 26,
            "carbs": 0,
            "fats": 18,
            "fiber": 0,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Quinoa", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 120,
            "proteins": 4.4,
            "carbs": 21.3,
            "fats": 1.9,
            "fiber": 2.8,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Peanut Butter", 
            "serving_size": 32,
            "serving_unit": "g",
            "calories": 188,
            "proteins": 8,
            "carbs": 6,
            "fats": 16,
            "fiber": 2,
            "source": "mock-data",
            "created_by": user_id
        },
        {
            "name": "Black Beans", 
            "serving_size": 100,
            "serving_unit": "g",
            "calories": 130,
            "proteins": 8.9,
            "carbs": 23.7,
            "fats": 0.5,
            "fiber": 8.7,
            "source": "mock-data",
            "created_by": user_id
        }
    ]

    # Add food items to the index if not already present
    food_ids = {}
    for food in mock_foods:
        # Check if food already exists
        existing = db.food_index.find_one({"name": food["name"]})
        if existing:
            food_ids[food["name"]] = existing["_id"]
            print(f"Food '{food['name']}' already exists in index")
        else:
            # Add created_at and updated_at
            food["created_at"] = datetime.now(timezone.utc)
            food["updated_at"] = datetime.now(timezone.utc)
            result = db.food_index.insert_one(food)
            food_ids[food["name"]] = result.inserted_id
            print(f"Added '{food['name']}' to food index")

    # Define meal types
    meal_types = ["breakfast", "lunch", "dinner", "snack"]

    # Define the exact date range 4/18-4/24 (2025)
    date_range = [
        datetime(2025, 4, 18),
        datetime(2025, 4, 19),
        datetime(2025, 4, 20),
        datetime(2025, 4, 21),
        datetime(2025, 4, 22),
        datetime(2025, 4, 23),
        datetime(2025, 4, 24)
    ]

    # Generate food logs for each specific date
    for log_date in date_range:
        # Convert to midnight UTC for consistent date handling
        log_date_midnight = datetime.combine(log_date.date(), time.min).replace(tzinfo=timezone.utc)
        
        print(f"Generating logs for {log_date.strftime('%Y-%m-%d')}")
        
        # For each day, create 3-5 food logs
        num_logs = random.randint(3, 5)
        
        for _ in range(num_logs):
            # Pick a random food and meal type
            food_name = random.choice(list(food_ids.keys()))
            meal_type = random.choice(meal_types)
            
            # Get the food details from our mock_foods list
            food_details = next(food for food in mock_foods if food["name"] == food_name)
            
            # Create a random amount (0.5-2.0 servings)
            amount = round(random.uniform(0.5, 2.0), 1)
            
            # Calculate nutrition based on amount
            calories = round(food_details["calories"] * amount)
            proteins = round(food_details["proteins"] * amount, 1)
            carbs = round(food_details["carbs"] * amount, 1)
            fats = round(food_details["fats"] * amount, 1)
            fiber = round(food_details["fiber"] * amount, 1)
            
            # Create log entry
            log_entry = {
                "user_id": user_id,
                "date": log_date_midnight,
                "meal_type": meal_type,
                "food_id": str(food_ids[food_name]),
                "name": food_name,
                "amount": amount,
                "unit": food_details["serving_unit"],
                "calories": calories,
                "proteins": proteins,
                "carbs": carbs,
                "fats": fats,
                "fiber": fiber,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Insert into database
            result = db.food_logs.insert_one(log_entry)
            print(f"  Added {food_name} ({amount} {food_details['serving_unit']}) as {meal_type} (ID: {result.inserted_id})")

    print("\nMock data creation complete!")
    print(f"Created food logs for dates: {', '.join(d.strftime('%Y-%m-%d') for d in date_range)}")
    print(f"Please restart your backend and refresh your UI to see the data")

# When the script is run directly
if __name__ == "__main__":
    # Check if user ID was passed as an argument
    user_id = None
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        print(f"Using provided user ID: {user_id}")
    
    # Call the main seeding function
    seed_for_user(user_id) 