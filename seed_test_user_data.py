#!/usr/bin/env python3

import os
import sys
import firebase_admin
from firebase_admin import auth, credentials
from app.database import get_database
from app.seed_mock_data import seed_for_user

# Set up Python path if needed
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Email address for the test user
TEST_EMAIL = "test@example.com"

def main():
    print("Seeding data for test user...")
    
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
        # Get the test user from Firebase
        user = auth.get_user_by_email(TEST_EMAIL)
        print(f"Found user with UID: {user.uid}")
        
        # Seed data for this user
        seed_for_user(user.uid)
        
        print("Successfully seeded data for test user.")
    except auth.AuthError as e:
        print(f"Firebase auth error: {e}")
        return 1
    except Exception as e:
        print(f"Error seeding data: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 