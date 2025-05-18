import firebase_admin
from firebase_admin import credentials, auth
import os
import json

# Path to your Firebase service account credentials file
CREDENTIALS_PATH = "/Users/isaacmineo/Main/projects/nutrivize/food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json"

# Test user credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "password123"
TEST_DISPLAY_NAME = "Test User"

def main():
    # Initialize Firebase Admin SDK if not already initialized
    try:
        if not firebase_admin._apps:
            print(f"Initializing Firebase with credentials file: {CREDENTIALS_PATH}")
            cred = credentials.Certificate(CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        else:
            print("Firebase Admin SDK already initialized")
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        return False
    
    # Try to get user by email first (to avoid creating duplicates)
    try:
        user = auth.get_user_by_email(TEST_EMAIL)
        print(f"User already exists: {user.uid} ({user.email})")
        return True
    except auth.UserNotFoundError:
        print(f"User with email {TEST_EMAIL} not found, will create new user")
    except Exception as e:
        print(f"Error checking for existing user: {str(e)}")
        return False
    
    # Create new user
    try:
        user = auth.create_user(
            email=TEST_EMAIL,
            password=TEST_PASSWORD,
            display_name=TEST_DISPLAY_NAME,
            email_verified=True
        )
        print(f"Successfully created new user: {user.uid}")
        print(f"Email: {user.email}")
        print(f"Name: {user.display_name}")
        return True
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("Script completed successfully")
    else:
        print("Script failed")
        exit(1) 