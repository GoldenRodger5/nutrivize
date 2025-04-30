from firebase_admin import auth
import firebase_admin
from firebase_admin import credentials
import os
import json
import app.auth as app_auth

print("Updating test user password")
print("--------------------------")

# Get Firebase config from app.auth
firebase_config = app_auth.firebase_config
print(f"Using Firebase project: {firebase_config['projectId']}")

# Initialize Firebase Admin SDK if needed
if not firebase_admin._apps:
    try:
        # Use the project ID from the config
        firebase_admin.initialize_app(options={
            'projectId': firebase_config['projectId']
        })
        print(f"Initialized Firebase Admin SDK with project ID: {firebase_config['projectId']}")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        exit(1)

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

try:
    # Look up the user by email
    user = auth.get_user_by_email(TEST_EMAIL)
    print(f"Found user with UID: {user.uid}")
    
    # Update the password
    auth.update_user(
        user.uid,
        password=TEST_PASSWORD
    )
    
    print(f"✅ Password updated successfully for user: {TEST_EMAIL}")
    print(f"You can now login with:")
    print(f"Email: {TEST_EMAIL}")
    print(f"Password: {TEST_PASSWORD}")
    
except Exception as e:
    print(f"❌ Failed to update password: {str(e)}") 