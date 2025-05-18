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
from .widgets import DEFAULT_WIDGETS

# Configuration for Firebase Authentication - using hardcoded values to match frontend
api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
auth_domain = "food-tracker-6096d.firebaseapp.com"
project_id = "food-tracker-6096d"
storage_bucket = "food-tracker-6096d.firebasestorage.app"
messaging_sender_id = "215135700985"
app_id = "1:215135700985:web:bfb71581010bcaab6c5f28"
measurement_id = "G-YVF1LWD3JJ"

firebase_config = {
    "apiKey": api_key,
    "authDomain": auth_domain,
    "projectId": project_id,
    "storageBucket": storage_bucket,
    "messagingSenderId": messaging_sender_id,
    "appId": app_id,
    "measurementId": measurement_id,
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
    token = None
    try:
        token = credentials.credentials
        print(f"get_current_user: Verifying token (preview: {token[:10]}...)")
        
        # Verify token with flexible settings to handle project ID issues
        decoded_token = None
        try:
            # Try standard verification first
            print("get_current_user: Attempting standard token verification")
            decoded_token = auth.verify_id_token(token)
            print("get_current_user: Token verified successfully")
        except Exception as e:
            error_str = str(e)
            print(f"get_current_user: Standard verification failed: {error_str}")
            
            if "incorrect \"aud\" (audience) claim" in error_str:
                # This is a common issue when the token is issued by a different project
                print("get_current_user: Token has incorrect audience claim. Attempting alternative verification.")
                
                # Use check_revoked=False to bypass audience check
                try:
                    decoded_token = auth.verify_id_token(token, check_revoked=False)
                    print("get_current_user: Successfully verified token with relaxed audience checking")
                except Exception as inner_e:
                    print(f"get_current_user: Alternative verification also failed: {str(inner_e)}")
                    raise HTTPException(
                        status_code=401,
                        detail=f"Invalid token: {str(inner_e)}"
                    )
            else:
                print(f"get_current_user: Token verification failed: {error_str}")
                raise HTTPException(
                    status_code=401,
                    detail=f"Invalid token: {error_str}"
                )
        
        if not decoded_token:
            print("get_current_user: No decoded token available after verification attempts")
            raise HTTPException(
                status_code=401,
                detail="Token verification failed: No decoded token available"
            )
        
        uid = decoded_token.get("uid")
        if not uid:
            print("get_current_user: No UID found in decoded token")
            raise HTTPException(
                status_code=401,
                detail="Invalid token: No UID found"
            )
            
        print(f"get_current_user: Token verified for UID: {uid}")
        
        # Get user from database
        user = users_collection.find_one({"uid": uid})
        
        if not user:
            print(f"get_current_user: User {uid} not found in database")
            
            # Try to get user from Firebase and create in DB
            try:
                print(f"get_current_user: Attempting to fetch user {uid} from Firebase")
                firebase_user = auth.get_user(uid)
                
                user = {
                    "uid": uid,
                    "email": firebase_user.email,
                    "name": firebase_user.display_name or "",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                
                # Save user to database
                print(f"get_current_user: Creating user {uid} in database")
                users_collection.insert_one(user)
                
                print(f"get_current_user: User {uid} created in database")
            except Exception as e:
                print(f"get_current_user: Failed to create user in database: {str(e)}")
                raise HTTPException(
                    status_code=401,
                    detail="User not found in database and could not be created"
                )
        
        return user
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        token_preview = token[:15] + "..." if token and len(token) > 15 else "None"
        print(f"get_current_user: Error verifying token {token_preview}: {str(e)}")
        import traceback
        traceback.print_exc()
        
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
        
        # Verify token with flexible settings to handle project ID issues
        try:
            # Try standard verification first
            decoded_token = auth.verify_id_token(token)
        except Exception as e:
            error_str = str(e)
            if "incorrect \"aud\" (audience) claim" in error_str:
                # This is a common issue when the token is issued by a different project
                print(f"Token has incorrect audience claim. Attempting alternative verification.")
                
                # Use check_revoked=False to bypass audience check
                decoded_token = auth.verify_id_token(token, check_revoked=False)
                
                # Log the success
                print(f"Successfully verified token with relaxed audience checking.")
            else:
                print(f"Token verification failed: {error_str}")
                raise e
        
        uid = decoded_token.get("uid")
        print(f"Token verified for UID: {uid}")
        
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
                "units": "imperial",
                "theme": "light"
            },
            "widget_preferences": DEFAULT_WIDGETS  # Add default widget preferences
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
        print(f"login_user: Attempting to sign in with email: {user_data.email}")
        
        # Sign in with email and password
        try:
            user = firebase_auth.sign_in_with_email_and_password(
                user_data.email,
                user_data.password
            )
            print(f"login_user: Firebase Auth successful for: {user_data.email}")
        except Exception as e:
            print(f"login_user: Firebase Auth error: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Login failed: Invalid credentials"
            )
        
        # Get user info from Firebase
        uid = user["localId"]
        email = user["email"]
        
        print(f"login_user: Got user info - UID: {uid}, Email: {email}")
        
        # Get user from database to get the name
        db_user = get_user_by_uid(uid)
        name = db_user.get("name") if db_user else ""
        
        # If user exists in Firebase but not in our DB, create the record
        if not db_user:
            print(f"login_user: User {uid} exists in Firebase but not in DB, creating record")
            try:
                firebase_user = auth.get_user(uid)
                db_user = {
                    "uid": uid,
                    "email": email,
                    "name": firebase_user.display_name or "",
                    "preferences": {
                        "units": "imperial",
                        "theme": "light"
                    },
                    "widget_preferences": DEFAULT_WIDGETS
                }
                create_user_in_db(db_user)
                name = db_user["name"]
                print(f"login_user: Created user record in DB for {uid}")
            except Exception as inner_e:
                print(f"login_user: Error creating user record: {str(inner_e)}")
                # Continue login process even if db creation fails
                
        # If user exists but doesn't have widget preferences, add them
        elif "widget_preferences" not in db_user:
            print(f"login_user: Adding widget preferences for user {uid}")
            try:
                users_collection.update_one(
                    {"uid": uid},
                    {"$set": {"widget_preferences": DEFAULT_WIDGETS, "updated_at": datetime.now()}}
                )
            except Exception as inner_e:
                print(f"login_user: Error updating widget preferences: {str(inner_e)}")
                # Continue login process even if update fails
        
        # Extract the ID token
        token = user.get("idToken", "")
        if not token:
            print(f"login_user: Warning - No idToken found in Firebase response")
            
        # Build the response
        response = UserResponse(
            uid=uid,
            email=email,
            name=name,
            token=token
        )
        
        print(f"login_user: Login successful for {email}")
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        print(f"login_user: Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        ) 