import datetime
from app.database import test_connection, get_database
from app.models import (
    # User functions
    create_user,
    
    # Food index functions
    add_food_item,
    update_food_item,
    delete_food_item,
    get_food_item,
    
    # Food log functions
    log_food,
    delete_food_log_entry,
    update_food_log_entry,
    get_user_food_logs_by_date,
    
    # Goal functions
    create_goal,
    update_goal,
    get_user_active_goal,
    add_nutrition_target
)
from bson.objectid import ObjectId

def setup_basic_indexes():
    """Set up basic indexes for the collections"""
    db = get_database()
    db.users.create_index("email", unique=True)
    db.food_index.create_index("name")
    db.food_logs.create_index([("user_id", 1), ("date", 1)])
    db.goals.create_index("user_id")

def test_basic_operations():
    """Test basic CRUD operations across all collections"""
    print("Testing MongoDB connection...")
    
    # Test connection
    if not test_connection():
        print("Failed to connect to MongoDB!")
        return False
    
    # Set up indexes
    setup_basic_indexes()
    
    # Clean up any existing test data
    db = get_database()
    db.users.delete_many({"email": "test@example.com"})
    
    print("\nRunning tests...")
    
    # Test 1: Create a user
    print("\n1. Creating test user...")
    user_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password_hash": "hashed_password_here"
    }
    user_id = create_user(user_data)
    print(f"User created with ID: {user_id}")
    
    # Test 2: Create food items
    print("\n2. Adding food items...")
    food1_data = {
        "name": "Apple",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 52,
        "proteins": 0.3,
        "carbs": 14,
        "fats": 0.2,
        "fiber": 2.4,
        "source": "USDA",
        "created_by": str(user_id)
    }
    food1_id = add_food_item(food1_data)
    print(f"Food item created with ID: {food1_id}")
    
    # Test 3: Update food item
    print("\n3. Updating food item...")
    update_result = update_food_item(food1_id, {"calories": 55})
    updated_food = get_food_item(food1_id)
    print(f"Update successful: {update_result}")
    print(f"Updated calories: {updated_food.get('calories')}")
    
    # Test 4: Log food
    print("\n4. Logging food for user...")
    today = datetime.datetime.now()
    log_data = {
        "user_id": str(user_id),
        "date": today,
        "meal_type": "breakfast",
        "food_id": str(food1_id),
        "name": "Apple",
        "amount": 1,
        "unit": "medium apple",
        "calories": 55,
        "proteins": 0.3,
        "carbs": 14,
        "fats": 0.2,
        "fiber": 2.4
    }
    log_id = log_food(log_data)
    print(f"Food log created with ID: {log_id}")
    
    # Test 5: Get user's food logs
    print("\n5. Getting user's food logs...")
    logs = get_user_food_logs_by_date(str(user_id), today.date())
    print(f"Found {len(logs)} logs for today")
    
    # Test 6: Update food log
    print("\n6. Updating food log entry...")
    update_log_result = update_food_log_entry(log_id, {"amount": 2})
    print(f"Log update successful: {update_log_result}")
    
    # Test 7: Create user goal
    print("\n7. Creating user goal...")
    goal_data = {
        "user_id": str(user_id),
        "start_date": today,
        "end_date": today + datetime.timedelta(days=30),
        "active": True,
        "type": "weight loss",
        "weight_target": {
            "current": 80,
            "goal": 75,
            "weekly_rate": 0.5
        },
        "nutrition_targets": []
    }
    goal_id = create_goal(goal_data)
    print(f"Goal created with ID: {goal_id}")
    
    # Test 8: Add nutrition target
    print("\n8. Adding nutrition target...")
    target_data = {
        "name": "Regular Day",
        "daily_calories": 2000,
        "proteins": 150,
        "carbs": 200,
        "fats": 65,
        "fiber": 25,
        "water": 2000,
        "applies_to": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
    add_target_result = add_nutrition_target(goal_id, target_data)
    print(f"Target added successfully: {add_target_result}")
    
    # Test 9: Get active goal
    print("\n9. Getting user's active goal...")
    active_goal = get_user_active_goal(str(user_id))
    if active_goal:
        print(f"Active goal found: {active_goal.get('type')}")
        targets = active_goal.get('nutrition_targets', [])
        if targets:
            print(f"Target daily calories: {targets[0].get('daily_calories')}")
    
    # Test 10: Delete food log entry
    print("\n10. Deleting food log entry...")
    delete_log_result = delete_food_log_entry(log_id)
    print(f"Log deleted successfully: {delete_log_result}")
    
    # Test 11: Delete food item
    print("\n11. Deleting food item...")
    delete_food_result = delete_food_item(food1_id)
    print(f"Food deleted successfully: {delete_food_result}")
    
    # Clean up test data
    print("\nCleaning up test data...")
    db.users.delete_many({"email": "test@example.com"})
    
    print("\nAll tests completed successfully!")
    return True

if __name__ == "__main__":
    test_basic_operations() 