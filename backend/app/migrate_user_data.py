from pymongo import MongoClient
from app.constants import USER_ID
from app.database import get_database

# This script migrates data from old user ID to new user ID

# Use the database connection from the app
db = get_database()

# Old user ID
OLD_USER_ID = "demo_user"

def migrate_data():
    # Migrate food index items
    food_count = 0
    for food in db.food_index.find({"created_by": OLD_USER_ID}):
        db.food_index.update_one(
            {"_id": food["_id"]},
            {"$set": {"created_by": USER_ID}}
        )
        food_count += 1
    
    # Migrate food logs
    log_count = 0
    for log in db.food_logs.find({"user_id": OLD_USER_ID}):
        db.food_logs.update_one(
            {"_id": log["_id"]},
            {"$set": {"user_id": USER_ID}}
        )
        log_count += 1
    
    # Migrate goals
    goal_count = 0
    for goal in db.goals.find({"user_id": OLD_USER_ID}):
        db.goals.update_one(
            {"_id": goal["_id"]},
            {"$set": {"user_id": USER_ID}}
        )
        goal_count += 1
        
    print(f"Migration complete:")
    print(f"- {food_count} food items updated")
    print(f"- {log_count} food logs updated")
    print(f"- {goal_count} goals updated")
    
if __name__ == "__main__":
    migrate_data() 