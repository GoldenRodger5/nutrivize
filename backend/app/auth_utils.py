import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, Header
from typing import Optional
import os

# Secret key for JWT encoding/decoding - replace with a secure key in production
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-for-jwt-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token for the given data
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    """
    Decode and validate a JWT token
    
    Args:
        token: The JWT token to decode
        
    Returns:
        dict: The decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_token_user(authorization: Optional[str] = Header(None)):
    """
    FastAPI dependency to extract and validate the user from the Authorization header
    
    Args:
        authorization: The Authorization header value
        
    Returns:
        dict: User information from the token
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    return decode_token(token)

def auth_required(authorization: Optional[str] = Header(None)):
    """
    Simple middleware to check if a request is authenticated
    
    Args:
        authorization: The Authorization header value
        
    Returns:
        bool: True if authenticated
        
    Raises:
        HTTPException: If not authenticated
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = parts[1]
        decode_token(token)
        return True
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e)) 