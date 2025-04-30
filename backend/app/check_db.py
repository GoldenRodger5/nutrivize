from datetime import datetime
from app.database import get_database
import json
from bson import ObjectId

# Helper to convert MongoDB documents to JSON
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

# Get database connection
db = get_database()

# Check if we can connect to the database
print("Database connection check:")
try:
    db.command('ping')
    print("✅ MongoDB connection successful")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    exit(1)

# Check for the test user
TEST_USER_ID = "test123456789"
user = db.users.find_one({"uid": TEST_USER_ID})
print("\nTest user check:")
if user:
    print(f"✅ Found test user: {user['email']}")
else:
    print("❌ Test user not found")

# Check for food items
food_items = list(db.food_index.find({"created_by": TEST_USER_ID}))
print(f"\nFood items check ({len(food_items)} found):")
if food_items:
    for i, food in enumerate(food_items[:3], 1):  # Show first 3 
        print(f"{i}. {food['name']}: {food['calories']} calories")
    if len(food_items) > 3:
        print(f"... and {len(food_items) - 3} more")
else:
    print("❌ No food items found for test user")

# Check for food logs
food_logs = list(db.food_logs.find({"user_id": TEST_USER_ID}))
print(f"\nFood logs check ({len(food_logs)} found):")
if food_logs:
    for i, log in enumerate(food_logs[:3], 1):  # Show first 3
        print(f"{i}. {log.get('date')}: {log.get('name')} - {log.get('calories')} calories")
    if len(food_logs) > 3:
        print(f"... and {len(food_logs) - 3} more")
else:
    print("❌ No food logs found for test user")

# Check for goals
goals = list(db.goals.find({"user_id": TEST_USER_ID}))
print(f"\nGoals check ({len(goals)} found):")
if goals:
    for i, goal in enumerate(goals, 1):
        print(f"{i}. Type: {goal.get('type')}, Active: {goal.get('active')}")
else:
    print("❌ No goals found for test user")

# Test the endpoints that are failing
print("\nTest API functions that would be called from frontend:")

from app.models import search_food_items, get_user_food_logs_by_date
from datetime import datetime, timezone, time

try:
    print("\nTesting search_food_items function:")
    foods = search_food_items("", user_id=TEST_USER_ID)
    print(f"✅ search_food_items returned {len(foods)} items")
except Exception as e:
    print(f"❌ search_food_items error: {e}")

try:
    print("\nTesting get_user_food_logs_by_date function:")
    date = "2025-04-27"
    logs = get_user_food_logs_by_date(TEST_USER_ID, date)
    print(f"✅ get_user_food_logs_by_date returned {len(logs)} logs")
except Exception as e:
    print(f"❌ get_user_food_logs_by_date error: {e}")

try:
    print("\nTesting get_user_active_goal function:")
    from app.models import get_user_active_goal
    goal = get_user_active_goal(TEST_USER_ID)
    if goal:
        print(f"✅ get_user_active_goal returned goal: {goal.get('type')}")
    else:
        print("⚠️ get_user_active_goal returned None")
except Exception as e:
    print(f"❌ get_user_active_goal error: {e}")

print("\nDatabase check complete") 