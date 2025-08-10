from fastapi import APIRouter, Depends, HTTPException, Header
from ..services.user_service import user_service
from ..models.user import UserResponse, UserCreate, UserLogin, UserRegister, AuthResponse
from ..core.firebase import firebase_manager
from typing import Optional


router = APIRouter(tags=["authentication"])


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserResponse:
    """Dependency to get current authenticated user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    try:
        user = await user_service.verify_token_and_get_user(token)
        return user
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register", response_model=UserResponse)
async def register_user(register_data: UserRegister):
    """Register a new user with email and password"""
    try:
        user = await user_service.register_user(register_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin):
    """Login user with email/password and return Firebase ID token"""
    try:
        auth_response = await user_service.login_user(login_data)
        return auth_response
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.get("/verify")
async def verify_token(current_user: UserResponse = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"valid": True, "user": current_user}


@router.get("/profile")
async def get_user_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get user profile information"""
    try:
        profile = await user_service.get_user_profile(current_user.uid)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")


@router.put("/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        updated_profile = await user_service.update_user_profile(current_user.uid, profile_data)
        return updated_profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")
