#!/usr/bin/env python3

import os
import sys
import firebase_admin
from firebase_admin import auth, credentials
from app.database import get_database

# Set up Python path if needed
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Email address for the test user
TEST_EMAIL = "test@example.com"

def main():
    print("Checking data for test user...")
    
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
        # Get database connection
        db = get_database()
        
        # Get the test user from Firebase
        user = auth.get_user_by_email(TEST_EMAIL)
        print(f"Found user with UID: {user.uid}")
        user_id = user.uid
        
        # Check food items
        food_items = list(db.food_index.find({"created_by": user_id}))
        print(f"Food items found: {len(food_items)}")
        if food_items:
            print("\nSample food items:")
            for i, item in enumerate(food_items[:3]):  # Show first 3 items
                print(f"  {i+1}. {item['name']} - {item['calories']} calories")
        
        # Check food logs
        food_logs = list(db.food_logs.find({"user_id": user_id}))
        print(f"\nFood logs found: {len(food_logs)}")
        if food_logs:
            print("\nSample food logs:")
            for i, log in enumerate(food_logs[:3]):  # Show first 3 logs
                print(f"  {i+1}. {log['date']} - {log['meal_type']}: {log['name']} ({log['amount']} {log['unit']})")
        
        # Check goals
        goals = list(db.goals.find({"user_id": user_id}))
        print(f"\nGoals found: {len(goals)}")
        if goals:
            active_goals = [g for g in goals if g.get('active')]
            print(f"Active goals: {len(active_goals)}")
            if active_goals:
                g = active_goals[0]
                print(f"\nActive goal: {g.get('type')}")
                if 'weight_target' in g:
                    print(f"  Weight target: {g['weight_target']['current']} to {g['weight_target']['goal']}")
                if 'nutrition_targets' in g:
                    for nt in g['nutrition_targets']:
                        print(f"  Nutrition target: {nt['name']}")
                        print(f"    Calories: {nt['daily_calories']}")
                        print(f"    Proteins: {nt['proteins']}g")
                        print(f"    Carbs: {nt['carbs']}g")
                        print(f"    Fats: {nt['fats']}g")
        
        print("\nData verification complete.")
    except auth.AuthError as e:
        print(f"Firebase auth error: {e}")
        return 1
    except Exception as e:
        print(f"Error checking data: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 