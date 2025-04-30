#!/bin/bash

# Export Firebase environment variables
export FIREBASE_API_KEY="AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
export FIREBASE_AUTH_DOMAIN="food-tracker-6096d.firebaseapp.com"
export FIREBASE_PROJECT_ID="food-tracker-6096d"
export FIREBASE_STORAGE_BUCKET="food-tracker-6096d.firebasestorage.app"
export FIREBASE_MESSAGING_SENDER_ID="215135700985"
export FIREBASE_APP_ID="1:215135700985:web:bfb71581010bcaab6c5f28"
export FIREBASE_CREDENTIALS_PATH="/Users/isaacmineo/Main/projects/nutrivize/food-tracker-6096d-firebase-adminsdk-fbsvc-59aac81350.json"

# Start the server
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 5001 