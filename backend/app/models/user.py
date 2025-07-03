from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserPreferences(BaseModel):
    """User preferences"""
    units: str = "metric"  # metric or imperial
    theme: str = "light"   # light or dark
    timezone: str = "UTC"


class User(BaseModel):
    """User model"""
    uid: str
    email: str
    name: str
    preferences: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    """User creation model"""
    email: str
    name: str
    preferences: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    """User login request"""
    email: str
    password: str


class UserRegister(BaseModel):
    """User registration request"""
    email: str
    password: str
    name: str


class UserResponse(BaseModel):
    """User response model"""
    uid: str
    email: str
    name: str
    preferences: Dict[str, Any] = {}


class AuthResponse(BaseModel):
    """Authentication response with token"""
    user: UserResponse
    token: str
    message: str
