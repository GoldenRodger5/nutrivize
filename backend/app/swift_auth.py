from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import Optional
import json
from datetime import timedelta
import firebase_admin
from firebase_admin import auth

# Import from local modules
from .auth_utils import create_access_token, get_token_user, auth_required
from .constants import USER_ID

router = APIRouter()

# Hardcoded user info
HARDCODED_USER_ID = USER_ID  # "GME7nGpJQRc2v9T057vJ4oyqAJN2"
HARDCODED_EMAIL = "isaacmineo@gmail.com"

class SwiftAuthRequest(BaseModel):
    email: str
    password: str
    device_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

class MockLoginRequest(BaseModel):
    user_id: str = USER_ID

@router.post("/swift/login", response_model=TokenResponse)
async def swift_login(auth_data: SwiftAuthRequest):
    """
    Authenticate a Swift app user with email and password
    
    Returns a JWT token that can be used for subsequent requests
    
    Note: This endpoint now directly uses hardcoded credentials to simplify testing
    """
    try:
        # Get the data from the request
        email = auth_data.email
        password = auth_data.password
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        print(f"Login attempt for email: {email}")
        print(f"Using hardcoded user ID: {HARDCODED_USER_ID}")
        
        # Always use hardcoded user ID instead of Firebase authentication
        user_id = HARDCODED_USER_ID
            
        # Generate access token with user information
        token_data = {
            "sub": user_id,
            "email": HARDCODED_EMAIL,
            "device_id": auth_data.device_id,
            "user_id": user_id  # Include user_id explicitly in the token payload
        }
        
        # Create token with 24 hour expiry
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(hours=24)
        )
        
        print(f"Created token for hardcoded user ID: {user_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id
        }
    except Exception as e:
        print(f"Login error: {str(e)}")
        # Even on error, return a success with hardcoded user ID for testing
        user_id = HARDCODED_USER_ID
        token_data = {
            "sub": user_id,
            "email": HARDCODED_EMAIL,
            "device_id": auth_data.device_id or "unknown-device",
            "user_id": user_id
        }
        
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(hours=24)
        )
        
        print(f"Error occurred but created fallback token for hardcoded user ID: {user_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id
        }

@router.post("/swift/refresh")
async def refresh_token(current_user: dict = Depends(get_token_user)):
    """
    Refresh an existing token
    
    Requires a valid token in the Authorization header
    Returns a new token with extended expiration
    """
    # Always use hardcoded user ID
    user_id = HARDCODED_USER_ID
    
    # Create a new token with the hardcoded user ID
    new_token = create_access_token(
        data={
            "sub": user_id,
            "email": HARDCODED_EMAIL,
            "device_id": current_user.get("device_id", "unknown-device"),
            "user_id": user_id
        }
    )
    
    print(f"Refreshed token for hardcoded user ID: {user_id}")
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "user_id": user_id
    }

@router.get("/swift/validate")
async def validate_token(is_authenticated: bool = Depends(auth_required)):
    """
    Validate an existing token
    
    Requires a valid token in the Authorization header
    Returns success if token is valid
    """
    return {"status": "valid", "authenticated": True, "user_id": HARDCODED_USER_ID}

@router.post("/swift/mock-login")
async def mock_login(request: MockLoginRequest):
    """
    Create a mock token for testing purposes
    """
    # Always use hardcoded user ID
    user_id = HARDCODED_USER_ID
    
    print(f"Creating mock token for hardcoded user ID: {user_id}")
    
    # Generate access token with user information
    token_data = {
        "sub": user_id,
        "email": HARDCODED_EMAIL,
        "device_id": "test-device",
        "user_id": user_id
    }
    
    # Create token with 24 hour expiry
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id
    }

@router.get("/swift/login")
async def swift_login_info():
    """
    Provides information about how to use the Swift login endpoint
    
    This endpoint helps developers understand how to use the POST version of this endpoint
    """
    return {
        "message": "Please use POST method for this endpoint",
        "usage": {
            "method": "POST",
            "content_type": "application/json",
            "body": {
                "email": "user@example.com",
                "password": "password123",
                "device_id": "optional-device-id"
            }
        },
        "response": {
            "access_token": "jwt-token",
            "token_type": "bearer",
            "user_id": "firebase-user-id"
        },
        "note": "This endpoint now uses a hardcoded user ID for all requests: " + HARDCODED_USER_ID
    } 