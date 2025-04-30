import os
import dotenv
from datetime import datetime, timezone, timedelta, time
from bson import ObjectId
from pymongo import MongoClient
import random
from app.database import get_database
from create_test_user import create_test_user, TEST_EMAIL

# Load environment variables
dotenv.load_dotenv()

# Make sure the test user exists
test_user = create_test_user()

# Connect to the database
db = get_database()

# Get the test user's ID
if not test_user:
    # Look up the test user by email
    test_user = db.users.find_one({"email": TEST_EMAIL})
    if not test_user:
        print("Test user not found and could not be created. Firebase authentication might not be properly configured.")
        print("You can modify the Firebase authentication settings in .env or provide firebase-credentials.json")
        print("For testing purposes, you can still use the frontend test user login with email: test@example.com and password: testpassword123")
        exit(0)  # Exit gracefully

USER_ID = test_user["uid"]
print(f"Seeding data for test user {USER_ID}")

# Delete existing food logs for this user to prevent duplicates
db.food_logs.delete_many({"user_id": USER_ID})
print(f"Deleted existing food logs for user {USER_ID}")

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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
    },
    {
        "name": "Broccoli", 
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 34,
        "proteins": 2.8,
        "carbs": 7,
        "fats": 0.4,
        "fiber": 2.6,
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
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
        "source": "test-data",
        "created_by": USER_ID
    },
    {
        "name": "Almonds", 
        "serving_size": 30,
        "serving_unit": "g",
        "calories": 173,
        "proteins": 6.3,
        "carbs": 6.1,
        "fats": 14.9,
        "fiber": 3.5,
        "source": "test-data",
        "created_by": USER_ID
    }
]

# First, add these foods to the food index
food_ids = {}

# Check if foods already exist in the index and add them if they don't
for food in mock_foods:
    existing_food = db.food_index.find_one({"name": food["name"], "created_by": USER_ID})
    
    if existing_food:
        food_ids[food["name"]] = existing_food["_id"]
        print(f"Food {food['name']} already exists with ID: {existing_food['_id']}")
    else:
        result = db.food_index.insert_one(food)
        food_ids[food["name"]] = result.inserted_id
        print(f"Added {food['name']} to food index with ID: {result.inserted_id}")

# Set up dates for food logs (last 7 days)
today = datetime.now().date()
date_range = [today - timedelta(days=i) for i in range(7)]
date_range.reverse()  # Start from earliest date

# Set up meal types
meal_types = ["breakfast", "lunch", "dinner", "snack"]

# Generate food logs for each specific date
for log_date in date_range:
    # Convert to midnight UTC for consistent date handling
    log_date_midnight = datetime.combine(log_date, time.min).replace(tzinfo=timezone.utc)
    
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
            "user_id": USER_ID,
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

# Create a goal for the test user
current_goal = db.goals.find_one({"user_id": USER_ID, "active": True})

if not current_goal:
    goal = {
        "user_id": USER_ID,
        "name": "Weight Loss Goal",
        "type": "weight_loss",
        "target_value": 75.0,  # target weight in kg
        "current_value": 80.0,  # current weight in kg
        "start_date": datetime.now(timezone.utc),
        "target_date": (datetime.now(timezone.utc) + timedelta(days=90)),
        "active": True,
        "nutrition_targets": {
            "calories": {
                "daily": 1800,
                "weekly": 12600
            },
            "proteins": {
                "daily": 120,
                "weekly": 840
            },
            "carbs": {
                "daily": 180,
                "weekly": 1260
            },
            "fats": {
                "daily": 60,
                "weekly": 420
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = db.goals.insert_one(goal)
    print(f"Created weight loss goal for test user (ID: {result.inserted_id})")
else:
    goal_name = current_goal.get('name', 'Unknown')
    print(f"Test user already has an active goal: {goal_name}")

print("\nTest user data seeded successfully!")
print(f"User ID: {USER_ID}")
print(f"Email: {TEST_EMAIL}")
print(f"Food items added: {len(food_ids)}")
print(f"Food logs added: {sum([random.randint(3, 5) for _ in range(7)])}")
print("Goal added: Weight Loss Goal") 