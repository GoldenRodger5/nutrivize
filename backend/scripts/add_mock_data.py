#!/usr/bin/env python3
"""
Script to add mock food log data for a specific user for the past week plus today.
"""

import sys
import os
import datetime
from datetime import timedelta, timezone
import pymongo
import random
import json

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import needed modules from the app
from app.database import get_database
from app.models import log_food
from app.firebase_init import initialize_firebase
import firebase_admin
from firebase_admin import auth

# Initialize Firebase
if not firebase_admin._apps:
    initialize_firebase()

# Sample food items with realistic nutrition values
BREAKFAST_FOODS = [
    {"name": "Scrambled Eggs", "calories": 220, "proteins": 14, "carbs": 2, "fats": 16, "amount": 2, "unit": "eggs"},
    {"name": "Whole Grain Toast", "calories": 120, "proteins": 4, "carbs": 20, "fats": 2, "amount": 1, "unit": "slice"},
    {"name": "Avocado", "calories": 160, "proteins": 2, "carbs": 8, "fats": 15, "amount": 0.5, "unit": "whole"},
    {"name": "Greek Yogurt", "calories": 150, "proteins": 15, "carbs": 8, "fats": 5, "amount": 1, "unit": "cup"},
    {"name": "Banana", "calories": 105, "proteins": 1, "carbs": 27, "fats": 0, "amount": 1, "unit": "medium"},
    {"name": "Oatmeal", "calories": 150, "proteins": 5, "carbs": 27, "fats": 3, "amount": 1, "unit": "cup"},
    {"name": "Protein Smoothie", "calories": 280, "proteins": 20, "carbs": 30, "fats": 5, "amount": 1, "unit": "serving"}
]

LUNCH_FOODS = [
    {"name": "Grilled Chicken Sandwich", "calories": 350, "proteins": 28, "carbs": 35, "fats": 10, "amount": 1, "unit": "sandwich"},
    {"name": "Turkey and Avocado Wrap", "calories": 380, "proteins": 25, "carbs": 32, "fats": 18, "amount": 1, "unit": "wrap"},
    {"name": "Mediterranean Salad", "calories": 320, "proteins": 12, "carbs": 15, "fats": 22, "amount": 1, "unit": "bowl"},
    {"name": "Quinoa Bowl", "calories": 420, "proteins": 15, "carbs": 55, "fats": 14, "amount": 1, "unit": "bowl"},
    {"name": "Vegetable Soup", "calories": 180, "proteins": 8, "carbs": 25, "fats": 5, "amount": 1, "unit": "bowl"},
    {"name": "Tuna Salad", "calories": 280, "proteins": 30, "carbs": 12, "fats": 14, "amount": 1, "unit": "serving"}
]

DINNER_FOODS = [
    {"name": "Grilled Salmon", "calories": 367, "proteins": 40, "carbs": 0, "fats": 19, "amount": 6, "unit": "oz"},
    {"name": "Sweet Potato", "calories": 180, "proteins": 4, "carbs": 41, "fats": 0, "amount": 1, "unit": "medium"},
    {"name": "Brown Rice", "calories": 216, "proteins": 5, "carbs": 45, "fats": 2, "amount": 1, "unit": "cup"},
    {"name": "Stir-Fried Vegetables", "calories": 120, "proteins": 4, "carbs": 12, "fats": 7, "amount": 1, "unit": "cup"},
    {"name": "Chicken Thigh", "calories": 280, "proteins": 26, "carbs": 0, "fats": 18, "amount": 1, "unit": "thigh"},
    {"name": "Pasta with Marinara", "calories": 320, "proteins": 12, "carbs": 58, "fats": 6, "amount": 1, "unit": "serving"},
    {"name": "Beef Stir-Fry", "calories": 380, "proteins": 30, "carbs": 15, "fats": 22, "amount": 1, "unit": "serving"}
]

SNACK_FOODS = [
    {"name": "Apple", "calories": 95, "proteins": 0.5, "carbs": 25, "fats": 0.3, "amount": 1, "unit": "medium"},
    {"name": "Almonds", "calories": 160, "proteins": 6, "carbs": 6, "fats": 14, "amount": 0.25, "unit": "cup"},
    {"name": "Protein Bar", "calories": 200, "proteins": 15, "carbs": 20, "fats": 8, "amount": 1, "unit": "bar"},
    {"name": "String Cheese", "calories": 80, "proteins": 7, "carbs": 1, "fats": 6, "amount": 1, "unit": "stick"},
    {"name": "Hummus with Carrots", "calories": 150, "proteins": 5, "carbs": 15, "fats": 8, "amount": 1, "unit": "serving"},
    {"name": "Greek Yogurt", "calories": 100, "proteins": 18, "carbs": 6, "fats": 0, "amount": 1, "unit": "cup"}
]

def get_user_id_from_email(email):
    """Get the Firebase UID for a user with the given email."""
    try:
        user = auth.get_user_by_email(email)
        return user.uid
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None

def create_food_log_entry(user_id, date, meal_type, food):
    """Create a food log entry for a user."""
    entry = {
        "user_id": user_id,
        "date": date,
        "meal_type": meal_type,
        "food_id": "generated",
        "name": food["name"],
        "amount": food["amount"],
        "unit": food["unit"],
        "calories": food["calories"],
        "proteins": food["proteins"],
        "carbs": food["carbs"],
        "fats": food["fats"],
        "fiber": random.uniform(0, 4),  # Random fiber content between 0-4g
        "notes": f"Mock data entry for {meal_type}."
    }
    return entry

def add_mock_data_for_user(email, days_back=7):
    """Add mock food log data for a user for the past X days plus today."""
    user_id = get_user_id_from_email(email)
    if not user_id:
        print(f"User with email {email} not found.")
        return False
    
    print(f"Found user with ID: {user_id}")
    db = get_database()
    
    # Generate data for each day
    today = datetime.datetime.now(timezone.utc)
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Normalize to start of day
    
    total_entries = 0
    for day_offset in range(days_back, -1, -1):  # From days_back to 0 (today)
        current_date = today - timedelta(days=day_offset)
        
        # For each day, add random selections from each meal type
        # Breakfast (1-2 items)
        breakfast_count = random.randint(1, 2)
        breakfast_foods = random.sample(BREAKFAST_FOODS, breakfast_count)
        for food in breakfast_foods:
            entry = create_food_log_entry(user_id, current_date, "breakfast", food)
            log_id = log_food(entry)
            total_entries += 1
            print(f"Added breakfast entry for {current_date.strftime('%Y-%m-%d')}: {food['name']}")
        
        # Lunch (1-3 items)
        lunch_count = random.randint(1, 3)
        lunch_foods = random.sample(LUNCH_FOODS, lunch_count)
        for food in lunch_foods:
            entry = create_food_log_entry(user_id, current_date, "lunch", food)
            log_id = log_food(entry)
            total_entries += 1
            print(f"Added lunch entry for {current_date.strftime('%Y-%m-%d')}: {food['name']}")
        
        # Dinner (2-3 items)
        dinner_count = random.randint(2, 3)
        dinner_foods = random.sample(DINNER_FOODS, dinner_count)
        for food in dinner_foods:
            entry = create_food_log_entry(user_id, current_date, "dinner", food)
            log_id = log_food(entry)
            total_entries += 1
            print(f"Added dinner entry for {current_date.strftime('%Y-%m-%d')}: {food['name']}")
        
        # Snacks (0-2 items)
        if random.random() > 0.3:  # 70% chance of having snacks
            snack_count = random.randint(1, 2)
            snack_foods = random.sample(SNACK_FOODS, snack_count)
            for food in snack_foods:
                entry = create_food_log_entry(user_id, current_date, "snack", food)
                log_id = log_food(entry)
                total_entries += 1
                print(f"Added snack entry for {current_date.strftime('%Y-%m-%d')}: {food['name']}")
    
    print(f"Added {total_entries} food log entries for user {email}")
    return True

if __name__ == "__main__":
    user_email = "isaacmineo@gmail.com"
    days = 7  # Past week plus today
    
    print(f"Adding mock food log data for user {user_email} for the past {days} days plus today...")
    result = add_mock_data_for_user(user_email, days)
    
    if result:
        print("Successfully added mock data!")
    else:
        print("Failed to add mock data.") 