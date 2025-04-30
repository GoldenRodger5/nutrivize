#!/usr/bin/env python
"""
Test direct Firebase login to isolate authentication issues
"""

import os
import sys
from app.constants import TEST_USER_ID
from app.database import get_database
import firebase_admin
from firebase_admin import auth, credentials
import pyrebase

# Configuration for Firebase Authentication
api_key = os.getenv("FIREBASE_API_KEY", "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks")
auth_domain = os.getenv("FIREBASE_AUTH_DOMAIN", "food-tracker-6096d.firebaseapp.com")
project_id = os.getenv("FIREBASE_PROJECT_ID", "food-tracker-6096d")
storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "food-tracker-6096d.firebasestorage.app")
messaging_sender_id = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "215135700985")
app_id = os.getenv("FIREBASE_APP_ID", "1:215135700985:web:bfb71581010bcaab6c5f28")

# Initialize Firebase
firebase_config = {
    "apiKey": api_key,
    "authDomain": auth_domain,
    "projectId": project_id,
    "storageBucket": storage_bucket,
    "messagingSenderId": messaging_sender_id,
    "appId": app_id,
    "databaseURL": ""  # This is not needed for Firebase Authentication
}

print(f"Firebase config being used: {firebase_config}")

# Initialize Pyrebase for client-side operations
firebase = pyrebase.initialize_app(firebase_config)
firebase_auth = firebase.auth()

# Test user credentials
test_email = "test@example.com"
test_password = "testpassword123"

print(f"Testing login with: {test_email} / {test_password}")

try:
    # Sign in with email and password
    user = firebase_auth.sign_in_with_email_and_password(
        test_email,
        test_password
    )
    
    print("✅ Authentication successful!")
    print(f"User ID: {user['localId']}")
    print(f"Email: {user['email']}")
    print(f"Token (first 40 chars): {user['idToken'][:40]}...")
    
    # Try to get user profile from Firebase
    firebase_user = auth.get_user(user['localId'])
    print(f"Firebase display name: {firebase_user.display_name}")
    
    # Check if user exists in our database
    db = get_database()
    db_user = db.users.find_one({"uid": user['localId']})
    
    if db_user:
        print(f"✅ User exists in MongoDB database")
        print(f"MongoDB name: {db_user.get('name')}")
    else:
        print("❌ User not found in MongoDB database")
        
except Exception as e:
    print(f"❌ Authentication failed: {str(e)}") 