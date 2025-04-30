from app.database import get_database
from firebase_admin import auth
import firebase_admin
import app.auth as app_auth

print("Checking and updating test user IDs")
print("---------------------------------")

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    firebase_config = app_auth.firebase_config
    firebase_admin.initialize_app(options={
        'projectId': firebase_config['projectId']
    })

# Test user email
TEST_EMAIL = "test@example.com"

# Get the user from Firebase
try:
    firebase_user = auth.get_user_by_email(TEST_EMAIL)
    firebase_uid = firebase_user.uid
    print(f"Firebase User: {firebase_user.uid} / {firebase_user.email}")
except Exception as e:
    print(f"Error getting Firebase user: {e}")
    exit(1)

# Get the user from MongoDB
db = get_database()
mongo_user = db.users.find_one({"email": TEST_EMAIL})

if not mongo_user:
    print(f"User {TEST_EMAIL} not found in MongoDB")
    exit(1)

print(f"MongoDB User: {mongo_user['uid']} / {mongo_user['email']}")

# Check if UIDs match
if mongo_user['uid'] != firebase_uid:
    print(f"UID mismatch: MongoDB has {mongo_user['uid']} but Firebase has {firebase_uid}")
    
    # Update MongoDB user to match Firebase
    result = db.users.update_one(
        {"_id": mongo_user["_id"]},
        {"$set": {"uid": firebase_uid}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Updated MongoDB user UID to match Firebase: {firebase_uid}")
    else:
        print("❌ Failed to update MongoDB user UID")
        
    # Update any related data
    food_logs_update = db.food_logs.update_many(
        {"user_id": mongo_user['uid']},
        {"$set": {"user_id": firebase_uid}}
    )
    print(f"Updated {food_logs_update.modified_count} food logs")
    
    food_index_update = db.food_index.update_many(
        {"created_by": mongo_user['uid']},
        {"$set": {"created_by": firebase_uid}}
    )
    print(f"Updated {food_index_update.modified_count} food index items")
    
    goals_update = db.goals.update_many(
        {"user_id": mongo_user['uid']},
        {"$set": {"user_id": firebase_uid}}
    )
    print(f"Updated {goals_update.modified_count} goals")
else:
    print("✅ User IDs match correctly between Firebase and MongoDB") 