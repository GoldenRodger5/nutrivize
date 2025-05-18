#!/usr/bin/env python3
import sys
import json
import requests
from pymongo import MongoClient
from datetime import datetime

def delete_all_healthkit_data(email, password):
    # First, login to get the user ID
    login_url = "http://localhost:5001/auth/login"
    login_data = {
        "email": email,
        "password": password
    }
    
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return False
    
    token = login_response.json()["token"]
    user_id = login_response.json()["uid"]
    
    print(f"Authenticated as user: {user_id}")
    
    # Connect to MongoDB directly
    try:
        # Use the same connection string as in the backend
        uri = "mongodb+srv://isaacmineo:8VoRLZ3N9iC18oDR@nutrivize.rbj6ly6.mongodb.net/?retryWrites=true&w=majority&appName=Nutrivize"
        client = MongoClient(uri)
        
        # Access the database
        db = client.nutrivize
        
        # Get the healthkit_data collection
        healthkit_collection = db.healthkit_data
        
        # Count documents before deletion
        before_count = healthkit_collection.count_documents({"user_id": user_id})
        print(f"Found {before_count} HealthKit data entries for user {user_id}")
        
        # Delete all documents for this user
        result = healthkit_collection.delete_many({"user_id": user_id})
        
        print(f"Deleted {result.deleted_count} HealthKit data entries for user {user_id}")
        return True
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        return False

if __name__ == "__main__":
    email = "IsaacMineo@gmail.com"
    password = "Buddydog41"
    
    delete_all_healthkit_data(email, password) 