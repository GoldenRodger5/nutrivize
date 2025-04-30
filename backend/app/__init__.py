# Nutrivize backend app 
# This file ensures that the app directory is recognized as a Python package
# Import improved modules
from .improved_resilience import (
    validate_and_parse_meal_response,
    generate_fallback_meal,
    get_meal_suggestions_from_ai_with_retry,
    MealDiversityTracker,
    build_enhanced_meal_prompt
)

import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK with the service account credentials
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "/Users/isaacmineo/Main/projects/nutrivize/food-tracker-6096d-firebase-adminsdk-fbsvc-59aac81350.json")
firebase_cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(firebase_cred)

# Package-level imports
from .models import *
from .database import test_connection, get_database

# Test MongoDB connection
db_connected = test_connection()
print(f"MongoDB connection successful: {db_connected}") 