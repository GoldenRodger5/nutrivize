from app.database import get_database, test_connection
from app.models import get_user_food_logs_by_date, get_user_active_goal
from datetime import datetime

# Demo user ID used in the app
DEMO_USER_ID = "demo_user"

def test_database_access():
    """Test if we can access the MongoDB database and retrieve user data"""
    print("Testing database connection...")
    if not test_connection():
        print("❌ Failed to connect to MongoDB!")
        return False
    
    print("✅ Connected to MongoDB successfully!")
    
    # Test getting food logs
    today = datetime.now().date()
    print(f"Testing food logs retrieval for {today}...")
    
    try:
        logs = get_user_food_logs_by_date(DEMO_USER_ID, today)
        print(f"Retrieved {len(logs)} food logs")
        
        if logs:
            print("Sample log data:")
            print(logs[0])
        else:
            print("No logs found for today")
            
            # Check if there are logs for any day
            db = get_database()
            all_logs = list(db.food_logs.find({"user_id": DEMO_USER_ID}))
            print(f"Total logs in database for this user: {len(all_logs)}")
            
            if all_logs:
                print("Sample log from database:")
                print(all_logs[0])
    except Exception as e:
        print(f"❌ Error retrieving food logs: {e}")
    
    # Test getting user goals
    print("\nTesting goals retrieval...")
    
    try:
        active_goal = get_user_active_goal(DEMO_USER_ID)
        if active_goal:
            print("✅ Active goal found:")
            print(f"Type: {active_goal.get('type')}")
            if 'weight_target' in active_goal:
                print(f"Weight target: {active_goal['weight_target']}")
            if 'nutrition_targets' in active_goal and active_goal['nutrition_targets']:
                print(f"Calories target: {active_goal['nutrition_targets'][0].get('daily_calories')}")
        else:
            print("No active goal found")
            
            # Check if there are any goals
            db = get_database()
            all_goals = list(db.goals.find({"user_id": DEMO_USER_ID}))
            print(f"Total goals in database for this user: {len(all_goals)}")
    except Exception as e:
        print(f"❌ Error retrieving goals: {e}")
    
    return True

if __name__ == "__main__":
    test_database_access() 