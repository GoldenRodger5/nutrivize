import os
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from pydantic import BaseModel
from .database import get_database
import pyrebase

# Configuration for Firebase Authentication
api_key = os.getenv("FIREBASE_API_KEY")
auth_domain = os.getenv("FIREBASE_AUTH_DOMAIN")
project_id = os.getenv("FIREBASE_PROJECT_ID")
storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
messaging_sender_id = os.getenv("FIREBASE_MESSAGING_SENDER_ID")
app_id = os.getenv("FIREBASE_APP_ID")

# Debug - use hardcoded values if environment variables not set
# This is a fallback for local testing
if not api_key:
    api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    auth_domain = "food-tracker-6096d.firebaseapp.com"
    project_id = "food-tracker-6096d"
    storage_bucket = "food-tracker-6096d.firebasestorage.app"
    messaging_sender_id = "215135700985"
    app_id = "1:215135700985:web:bfb71581010bcaab6c5f28"
    print(f"WARNING: Using hardcoded Firebase config since environment variables are not set!")

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

# Use Firebase Admin for server-side operations (verifying tokens, etc.)
auth_security = HTTPBearer()
db = get_database()
users_collection = db["users"]

# Models
class UserRegistration(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    token: str

class UserInDB(BaseModel):
    uid: str
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_security)):
    """
    Verify Firebase ID token and return user information
    """
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        # Get user from database
        user = users_collection.find_one({"uid": uid})
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found in database"
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(auth_security)):
    """
    Verify Firebase ID token and return only the user ID
    """
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        # Get user from database
        user = users_collection.find_one({"uid": uid})
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found in database"
            )
        
        return uid
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

def create_user_in_db(user_data: dict) -> str:
    """
    Create a user in MongoDB based on Firebase user
    """
    user_data["created_at"] = datetime.now()
    user_data["updated_at"] = datetime.now()
    
    # Check if user already exists in DB
    existing_user = users_collection.find_one({"uid": user_data["uid"]})
    if existing_user:
        return str(existing_user["_id"])
    
    # Create user in DB
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)

def get_user_by_uid(uid: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a user from the database by Firebase UID
    """
    return users_collection.find_one({"uid": uid})

# Authentication functions
async def register_user(user_data: UserRegistration) -> UserResponse:
    """
    Register a new user with Firebase Auth and create in database
    """
    try:
        # Create user in Firebase Authentication
        user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.name,
        )
        
        # Create custom token for initial sign-in
        custom_token = auth.create_custom_token(user.uid)
        
        # Convert bytes to string if needed
        if isinstance(custom_token, bytes):
            custom_token = custom_token.decode('utf-8')
        
        # Sign in with custom token to get ID token
        user_credentials = firebase_auth.sign_in_with_custom_token(custom_token)
        token = user_credentials["idToken"]
        
        # Store user in MongoDB
        db_user = {
            "uid": user.uid,
            "email": user.email,
            "name": user.display_name,
            "preferences": {
                "units": "metric",
                "theme": "light"
            }
        }
        create_user_in_db(db_user)
        
        return UserResponse(
            uid=user.uid,
            email=user.email,
            name=user.display_name,
            token=token
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}"
        )

async def login_user(user_data: UserLogin) -> UserResponse:
    """
    Login user with Firebase Auth
    """
    try:
        # Sign in with email and password
        user = firebase_auth.sign_in_with_email_and_password(
            user_data.email,
            user_data.password
        )
        
        # Get user info from Firebase
        uid = user["localId"]
        email = user["email"]
        
        # Get user from database to get the name
        db_user = get_user_by_uid(uid)
        name = db_user.get("name") if db_user else ""
        
        # If user exists in Firebase but not in our DB, create the record
        if not db_user:
            firebase_user = auth.get_user(uid)
            db_user = {
                "uid": uid,
                "email": email,
                "name": firebase_user.display_name or "",
                "preferences": {
                    "units": "metric",
                    "theme": "light"
                }
            }
            create_user_in_db(db_user)
            name = db_user["name"]
            
        return UserResponse(
            uid=uid,
            email=email,
            name=name,
            token=user["idToken"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Login failed: {str(e)}"
        ) 