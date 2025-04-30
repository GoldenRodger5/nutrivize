#!/usr/bin/env python3

import os
import sys
import firebase_admin
from firebase_admin import auth, credentials
import json

# Set up Python path if needed
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Email address for the test user
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

def main():
    print("Creating test user...")
    
    # Make sure Firebase is initialized
    try:
        app = firebase_admin.get_app()
    except ValueError:
        # Firebase not initialized, initialize it now
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") 
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    
    try:
        # Check if user already exists
        try:
            user = auth.get_user_by_email(TEST_EMAIL)
            print(f"User already exists with UID: {user.uid}")
            
            # Update user password
            auth.update_user(user.uid, password=TEST_PASSWORD)
            print(f"Updated password for user: {TEST_EMAIL}")
            
            return user.uid
        except auth.UserNotFoundError:
            # Create new user
            user = auth.create_user(
                email=TEST_EMAIL,
                password=TEST_PASSWORD,
                display_name="Test User",
                email_verified=True
            )
            print(f"Created new user with UID: {user.uid}")
            return user.uid
            
    except Exception as e:
        print(f"Error creating/updating test user: {e}")
        return None

if __name__ == "__main__":
    user_id = main()
    
    if user_id:
        # Save the user ID to a file for reference
        with open("test_user_id.txt", "w") as f:
            f.write(user_id)
        
        # Run the seed script for this user
        print("\nNow seeding data for the test user...")
        try:
            from app.seed_mock_data import seed_for_user
            seed_for_user(user_id)
            print("Successfully seeded data for test user.")
        except Exception as e:
            print(f"Error seeding data: {e}")
            sys.exit(1)
    else:
        sys.exit(1) 