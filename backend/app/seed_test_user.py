from datetime import datetime, timezone, time, timedelta
from pymongo import MongoClient
import random
from bson import ObjectId
from app.database import get_database
import sys
import traceback

print("\n=== STARTING TEST USER SEED SCRIPT ===\n")

# Use the database connection from the app
try:
    db = get_database()
    db.command('ping')
    print("✅ MongoDB connection successful")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    sys.exit(1)

# Test user ID - this should match the one in the login component
# Using a format similar to Firebase UIDs (long alphanumeric string)
TEST_USER_ID = "test123456789"

# Create test user if not exists
try:
    user = db.users.find_one({"email": "test@example.com"})
    if not user:
        print("Creating test user...")
        user_data = {
            "uid": TEST_USER_ID,
            "email": "test@example.com",
            "name": "Test User",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "preferences": {
                "units": "metric",
                "theme": "light",
                "notification_settings": {}
            }
        }
        result = db.users.insert_one(user_data)
        print(f"✅ Test user created with ID: {result.inserted_id}")
    else:
        print(f"✅ Test user already exists with ID: {user.get('_id')}")
        if user.get('uid') != TEST_USER_ID:
            print(f"⚠️ Updating user ID from {user.get('uid')} to {TEST_USER_ID}")
            db.users.update_one({"_id": user["_id"]}, {"$set": {"uid": TEST_USER_ID}})
except Exception as e:
    print(f"❌ Error creating/finding test user: {e}")
    traceback.print_exc()
    sys.exit(1)

# Delete existing food logs for the test user to prevent duplicates
try:
    result = db.food_logs.delete_many({"user_id": TEST_USER_ID})
    print(f"✅ Deleted {result.deleted_count} existing food logs for test user")
except Exception as e:
    print(f"❌ Error deleting food logs: {e}")
    traceback.print_exc()

# Delete existing goals for the test user
try:
    result = db.goals.delete_many({"user_id": TEST_USER_ID})
    print(f"✅ Deleted {result.deleted_count} existing goals for test user")
except Exception as e:
    print(f"❌ Error deleting goals: {e}")
    traceback.print_exc()

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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
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
        "created_by": TEST_USER_ID
    }
]

# Add food items to the index if not already present
food_ids = {}
for food in mock_foods:
    try:
        # Check if food already exists
        existing = db.food_index.find_one({"name": food["name"]})
        if existing:
            food_ids[food["name"]] = existing["_id"]
            print(f"✅ Food '{food['name']}' already exists in index")
        else:
            # Add created_at and updated_at
            food["created_at"] = datetime.now(timezone.utc)
            food["updated_at"] = datetime.now(timezone.utc)
            result = db.food_index.insert_one(food)
            food_ids[food["name"]] = result.inserted_id
            print(f"✅ Added '{food['name']}' to food index")
    except Exception as e:
        print(f"❌ Error adding food {food['name']}: {e}")
        traceback.print_exc()

print(f"\nFood items in index: {len(food_ids)}")

# Define meal types
meal_types = ["breakfast", "lunch", "dinner", "snack"]

# Define the date range from today going back 2 weeks
end_date = datetime(2025, 4, 27)  # User specified date
start_date = end_date - timedelta(days=14)

# Generate list of dates
date_range = []
current_date = start_date
while current_date <= end_date:
    date_range.append(current_date)
    current_date += timedelta(days=1)

print(f"\nGenerating logs from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

# Generate food logs for each date
log_count = 0
for log_date in date_range:
    # Convert to midnight UTC for consistent date handling
    log_date_midnight = datetime.combine(log_date.date(), time.min).replace(tzinfo=timezone.utc)
    
    print(f"Generating logs for {log_date.strftime('%Y-%m-%d')}")
    
    # For each day, create 3-5 food logs
    num_logs = random.randint(3, 5)
    
    for _ in range(num_logs):
        try:
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
                "user_id": TEST_USER_ID,
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
            log_count += 1
            print(f"  ✅ Added {food_name} ({amount} {food_details['serving_unit']}) as {meal_type}")
        except Exception as e:
            print(f"  ❌ Error adding food log: {e}")
            traceback.print_exc()

print(f"\nCreated total of {log_count} food logs")

# Create a goal for the test user
try:
    goal_data = {
        "user_id": TEST_USER_ID,
        "start_date": start_date,
        "end_date": end_date + timedelta(days=30),  # Set goal end date 30 days after the last log
        "active": True,
        "type": "weight loss",
        "weight_target": {
            "current": 75,
            "goal": 70,
            "weekly_rate": 0.5
        },
        "nutrition_targets": [{
            "name": "Default",
            "daily_calories": 2000,
            "proteins": 150,
            "carbs": 200,
            "fats": 65,
            "fiber": 25
        }],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = db.goals.insert_one(goal_data)
    print(f"✅ Created goal for test user (ID: {result.inserted_id})")
except Exception as e:
    print(f"❌ Error creating goal: {e}")
    traceback.print_exc()

print("\n=== SEED SCRIPT COMPLETED SUCCESSFULLY ===")
print(f"Created food logs for test user from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
print(f"Please restart your backend and refresh your UI to see the data")

# Verify data was created correctly
print("\n=== VERIFYING CREATED DATA ===")
user_count = db.users.count_documents({"uid": TEST_USER_ID})
log_count = db.food_logs.count_documents({"user_id": TEST_USER_ID})
goal_count = db.goals.count_documents({"user_id": TEST_USER_ID})

print(f"✅ Users: {user_count}")
print(f"✅ Food logs: {log_count}")
print(f"✅ Goals: {goal_count}")
print("=== VERIFICATION COMPLETE ===\n")

# Optional: Perform a test query to ensure the data is accessible
from app.models import search_food_items, get_user_food_logs_by_date, get_user_active_goal

print("Testing API access:")
try:
    foods = search_food_items("", user_id=TEST_USER_ID)
    print(f"✅ Found {len(foods)} foods for the test user")
except Exception as e:
    print(f"❌ Error accessing foods: {e}")

try:
    logs = get_user_food_logs_by_date(TEST_USER_ID, "2025-04-27")
    print(f"✅ Found {len(logs)} logs for the test user on 2025-04-27")
except Exception as e:
    print(f"❌ Error accessing logs: {e}")

try:
    goal = get_user_active_goal(TEST_USER_ID)
    if goal:
        print(f"✅ Found active goal: {goal.get('type')}")
    else:
        print("⚠️ No active goal found")
except Exception as e:
    print(f"❌ Error accessing goal: {e}") 