# 🔐 Nutrivize V2 - Security & Authentication Documentation

## 📋 **Table of Contents**
- [Authentication Overview](#authentication-overview)
- [Production Security Features](#production-security-features)
- [Firebase Authentication](#firebase-authentication)
- [JWT Token Management](#jwt-token-management)
- [Backend Security](#backend-security)
- [Frontend Security](#frontend-security)
- [Database Security](#database-security)
- [API Security](#api-security)
- [User Data Privacy](#user-data-privacy)
- [Security Best Practices](#security-best-practices)

---

## 🎯 **Authentication Overview**

Nutrivize V2 implements a **zero-trust security model** with Firebase Authentication as the identity provider and enhanced production security features for enterprise-grade protection.

### **Security Architecture**
```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant SEC as Security Layer
    participant FB as Firebase Auth
    participant BE as Backend API
    participant DB as MongoDB

    U->>FE: Login Request
    FE->>FB: Firebase Authentication
    FB-->>FE: ID Token (JWT)
    FE->>FE: Store Token Securely
    
    FE->>SEC: API Request + Bearer Token
    SEC->>SEC: Security Headers Check
    SEC->>SEC: Rate Limiting Check
    SEC->>SEC: Request Size Validation
    
    SEC->>BE: Verified Request + Request ID
    BE->>BE: Verify JWT with Firebase
    BE->>BE: Extract User ID (uid)
    BE->>DB: Query with User Isolation
    DB-->>BE: User-Specific Data Only
    BE-->>SEC: Authorized Response
    SEC-->>FE: Enhanced Response + Security Headers
```

### **Key Security Principles**
- **Zero Trust**: Every request is authenticated and authorized
- **User Isolation**: All data queries filtered by authenticated user ID
- **Token-Based**: Stateless authentication with JWT tokens
- **Encrypted Transport**: HTTPS/TLS for all communications
- **Principle of Least Privilege**: Minimal required permissions
- **Defense in Depth**: Multi-layer security protection
- **Request Tracking**: Unique request IDs for security monitoring

---

## 🛡️ **Production Security Features (v2.0)**

### **Security Middleware Stack**
```yaml
Security Headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
  - Permissions-Policy: geolocation=(), microphone=(), camera=()

Rate Limiting:
  - Global: 120 requests/minute with 20 burst allowance
  - Sliding window algorithm
  - Rate limit headers in responses
  - Automatic 429 responses for violations

Request Validation:
  - Maximum request size: 10MB
  - Content-type validation
  - Request timeout protection
  - Malformed request rejection

Request Tracking:
  - Unique request ID generation
  - Request/response logging
  - Performance metrics tracking
  - Error correlation across services
```

### **Enhanced Error Security**
```yaml
Error Response Security:
  - No sensitive data leakage
  - Structured error responses
  - Request ID for tracking
  - User-friendly error messages
  - Developer context preservation

Rate Limiting Protection:
  - Progressive rate limiting
  - Burst allowance for normal usage
  - Client notification headers
  - Automatic threat detection
```

---

## 🔥 **Firebase Authentication**

### **Firebase Configuration**
```typescript
// Frontend Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "food-tracker-6096d.firebaseapp.com",
  projectId: "food-tracker-6096d",
  storageBucket: "food-tracker-6096d.appspot.com",
  messagingSenderId: "113969268568573013827",
  appId: "1:113969268568573013827:web:..."
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
```

### **Authentication Methods**
```typescript
// Email/Password Authentication
const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()
    
    // Store token for API requests
    localStorage.setItem('authToken', idToken)
    
    return userCredential.user
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// User Registration
const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update user profile
    await updateProfile(userCredential.user, {
      displayName: name
    })
    
    // Create user document in MongoDB
    const idToken = await userCredential.user.getIdToken()
    await createUserProfile(idToken, name)
    
    return userCredential.user
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`)
  }
}
```

### **Token Refresh Strategy**
```typescript
// Automatic token refresh
const refreshAuthToken = async () => {
  const user = auth.currentUser
  if (user) {
    try {
      const freshToken = await user.getIdToken(true) // Force refresh
      localStorage.setItem('authToken', freshToken)
      return freshToken
    } catch (error) {
      // Token refresh failed, redirect to login
      signOut(auth)
      window.location.href = '/login'
    }
  }
}

// Token refresh interval (every 50 minutes)
setInterval(refreshAuthToken, 50 * 60 * 1000)
```

---

## 🎫 **JWT Token Management**

### **Token Structure**
```json
{
  "iss": "https://securetoken.google.com/food-tracker-6096d",
  "aud": "food-tracker-6096d",
  "auth_time": 1705766400,
  "user_id": "firebase_uid_123",
  "sub": "firebase_uid_123",
  "iat": 1705766400,
  "exp": 1705770000,
  "email": "user@example.com",
  "email_verified": true,
  "firebase": {
    "identities": {
      "email": ["user@example.com"]
    },
    "sign_in_provider": "password"
  }
}
```

### **Backend Token Verification**
```python
# Firebase Admin SDK Configuration
import firebase_admin
from firebase_admin import credentials, auth
import json
import base64

# Initialize Firebase Admin
def initialize_firebase():
    if not firebase_admin._apps:
        # Decode service account from environment variable
        service_account_json = base64.b64decode(
            os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
        ).decode('utf-8')
        
        service_account = json.loads(service_account_json)
        cred = credentials.Certificate(service_account)
        
        firebase_admin.initialize_app(cred)

# Token verification middleware
async def verify_firebase_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing or invalid"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Verify token with Firebase
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "uid": user_id,
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token verification failed: {str(e)}"
        )

# User dependency for protected routes
async def get_current_user(
    token_data: dict = Depends(verify_firebase_token),
    db: Database = Depends(get_database)
):
    user = await db.users.find_one({"uid": token_data["uid"]})
    
    if not user:
        # Create user if doesn't exist
        user_data = {
            "uid": token_data["uid"],
            "email": token_data["email"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(user_data)
        user = user_data
    
    return user
```

---

## 🛡️ **Backend Security**

### **FastAPI Security Configuration**
```python
# CORS Configuration
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Nutrivize V2 API",
    description="Secure nutrition tracking API",
    version="2.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None
)

# Production CORS settings
origins = [
    "http://localhost:3000",    # Local development
    "http://localhost:5173",    # Vite dev server
    "https://nutrivize-frontend.onrender.com",  # Production frontend
    "https://nutrivize.onrender.com",           # Alternative domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response
```

### **Input Validation with Pydantic**
```python
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime

class FoodLogCreate(BaseModel):
    date: datetime = Field(..., description="Date of consumption")
    meal_type: str = Field(..., regex="^(breakfast|lunch|dinner|snack)$")
    food_id: str = Field(..., description="Food ID from database")
    amount: float = Field(..., gt=0, le=10000, description="Amount consumed")
    unit: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('date')
    def validate_date(cls, v):
        # Prevent future dates beyond tomorrow
        if v.date() > datetime.now().date() + timedelta(days=1):
            raise ValueError('Date cannot be more than 1 day in the future')
        return v
    
    @validator('notes')
    def validate_notes(cls, v):
        if v:
            # Basic XSS prevention
            if '<' in v or '>' in v or 'script' in v.lower():
                raise ValueError('Invalid characters in notes')
        return v

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    height_cm: Optional[float] = Field(None, ge=100, le=300)
    weight_kg: Optional[float] = Field(None, ge=30, le=500)
    activity_level: Optional[str] = Field(
        None, 
        regex="^(sedentary|lightly_active|moderately_active|very_active|extra_active)$"
    )
    dietary_preferences: Optional[List[str]] = Field(None, max_items=20)
    
    @validator('dietary_preferences')
    def validate_dietary_preferences(cls, v):
        if v:
            allowed_preferences = [
                'vegetarian', 'vegan', 'keto', 'paleo', 'low_carb', 
                'low_fat', 'mediterranean', 'dash', 'gluten_free'
            ]
            for pref in v:
                if pref not in allowed_preferences:
                    raise ValueError(f'Invalid dietary preference: {pref}')
        return v
```

### **Rate Limiting (Future Enhancement)**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limited endpoints
@app.post("/auth/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, login_data: LoginRequest):
    # Login logic
    pass

@app.post("/ai/chat")
@limiter.limit("20/minute")  # 20 AI requests per minute
async def ai_chat(request: Request, current_user: dict = Depends(get_current_user)):
    # AI chat logic
    pass
```

---

## 🔒 **Frontend Security**

### **Secure Token Storage**
```typescript
// Token storage utility
class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'nutrivize_auth_token'
  private static readonly REFRESH_KEY = 'nutrivize_refresh_token'
  
  static setToken(token: string): void {
    // Use sessionStorage for more security (cleared on tab close)
    sessionStorage.setItem(this.TOKEN_KEY, token)
  }
  
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY)
  }
  
  static removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY)
    sessionStorage.removeItem(this.REFRESH_KEY)
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}
```

### **Protected Route Component**
```typescript
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}

// Usage in routing
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route
    path="/*"
    element={
      <ProtectedRoute>
        <AppRoutes />
      </ProtectedRoute>
    }
  />
</Routes>
```

### **API Client Security**
```typescript
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

// Secure API client configuration
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = SecureTokenStorage.getToken()
    
    if (token) {
      if (SecureTokenStorage.isTokenExpired(token)) {
        // Token expired, redirect to login
        SecureTokenStorage.removeToken()
        window.location.href = '/login'
        return Promise.reject(new Error('Token expired'))
      }
      
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, clear token and redirect
      SecureTokenStorage.removeToken()
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)
```

### **Input Sanitization**
```typescript
import DOMPurify from 'dompurify'

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  })
}

// Secure form handling
export const useSecureForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void
) => {
  const handleSubmit = (values: T) => {
    // Sanitize all string values
    const sanitizedValues = Object.keys(values).reduce((acc, key) => {
      const value = values[key]
      acc[key] = typeof value === 'string' ? sanitizeInput(value) : value
      return acc
    }, {} as T)
    
    onSubmit(sanitizedValues)
  }
  
  return { handleSubmit }
}
```

---

## 🗃️ **Database Security**

### **Connection Security**
```python
from motor.motor_asyncio import AsyncIOMotorClient
import ssl

# Secure MongoDB connection
async def connect_to_mongo():
    # MongoDB Atlas connection with TLS
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsAllowInvalidCertificates=False,  # Verify certificates
        serverSelectionTimeoutMS=5000,     # 5 second timeout
        maxPoolSize=50,                    # Connection pool size
        minPoolSize=5,
        maxIdleTimeMS=30000,               # 30 second idle timeout
    )
    
    # Verify connection
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        return client[settings.DATABASE_NAME]
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

# User data isolation
class UserDataRepository:
    def __init__(self, db: Database, user_id: str):
        self.db = db
        self.user_id = user_id
    
    async def find_food_logs(self, filters: dict = None):
        """Get food logs for authenticated user only"""
        query = {"user_id": self.user_id}
        if filters:
            query.update(filters)
        
        return await self.db.food_logs.find(query).to_list(1000)
    
    async def create_food_log(self, log_data: dict):
        """Create food log with automatic user_id injection"""
        log_data["user_id"] = self.user_id
        log_data["created_at"] = datetime.utcnow()
        
        return await self.db.food_logs.insert_one(log_data)
    
    async def update_food_log(self, log_id: str, update_data: dict):
        """Update food log only if owned by user"""
        result = await self.db.food_logs.update_one(
            {"_id": ObjectId(log_id), "user_id": self.user_id},
            {"$set": {**update_data, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Food log not found")
        
        return result
```

### **Data Validation at Database Level**
```python
# MongoDB schema validation
food_logs_validator = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "date", "meal_type", "food_id", "amount"],
        "properties": {
            "user_id": {
                "bsonType": "string",
                "description": "User ID from Firebase Auth"
            },
            "date": {
                "bsonType": "date",
                "description": "Date of food consumption"
            },
            "meal_type": {
                "enum": ["breakfast", "lunch", "dinner", "snack"],
                "description": "Type of meal"
            },
            "amount": {
                "bsonType": "number",
                "minimum": 0.1,
                "maximum": 10000,
                "description": "Amount consumed"
            },
            "nutrition.calories": {
                "bsonType": "number",
                "minimum": 0,
                "maximum": 10000
            }
        }
    }
}

# Apply validation to collection
await db.create_collection("food_logs", validator=food_logs_validator)
```

---

## 🔐 **API Security**

### **Endpoint Protection**
```python
# All endpoints require authentication
@router.get("/food-logs/")
async def get_food_logs(
    current_user: dict = Depends(get_current_user),  # Authentication required
    db: Database = Depends(get_database),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    # User can only access their own data
    repository = UserDataRepository(db, current_user["uid"])
    
    filters = {}
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        filters["date"] = date_filter
    
    food_logs = await repository.find_food_logs(filters)
    return {"data": food_logs}

# Admin-only endpoints (future enhancement)
@router.get("/admin/users/")
async def get_all_users(
    current_user: dict = Depends(get_admin_user),  # Admin authentication
    db: Database = Depends(get_database)
):
    # Admin functionality
    pass
```

### **Error Handling Security**
```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse
import logging

# Secure error handler that doesn't leak sensitive information
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full error details
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # Return generic error to client (don't leak internal details)
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path)
            }
        )
    else:
        # Development: return detailed error
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
                "type": type(exc).__name__
            }
        )

# Validation error handler
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## 👤 **User Data Privacy**

### **Data Isolation Enforcement**
```python
# Repository pattern ensuring user data isolation
class BaseUserRepository:
    def __init__(self, db: Database, user_id: str):
        self.db = db
        self.user_id = user_id
    
    def _add_user_filter(self, query: dict) -> dict:
        """Automatically add user_id filter to all queries"""
        return {**query, "user_id": self.user_id}
    
    async def find_one(self, collection: str, query: dict = None):
        query = query or {}
        user_query = self._add_user_filter(query)
        return await self.db[collection].find_one(user_query)
    
    async def find_many(self, collection: str, query: dict = None, limit: int = 100):
        query = query or {}
        user_query = self._add_user_filter(query)
        return await self.db[collection].find(user_query).limit(limit).to_list(limit)
    
    async def insert_one(self, collection: str, document: dict):
        document["user_id"] = self.user_id
        document["created_at"] = datetime.utcnow()
        return await self.db[collection].insert_one(document)
    
    async def update_one(self, collection: str, filter_query: dict, update: dict):
        user_filter = self._add_user_filter(filter_query)
        update["updated_at"] = datetime.utcnow()
        return await self.db[collection].update_one(user_filter, {"$set": update})
    
    async def delete_one(self, collection: str, query: dict):
        user_query = self._add_user_filter(query)
        return await self.db[collection].delete_one(user_query)
```

### **Data Export and Deletion (GDPR Compliance)**
```python
@router.get("/user/export-data")
async def export_user_data(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    """Export all user data for GDPR compliance"""
    user_id = current_user["uid"]
    
    # Collect all user data
    user_data = {
        "user_profile": await db.users.find_one({"uid": user_id}),
        "food_logs": await db.food_logs.find({"user_id": user_id}).to_list(10000),
        "meal_plans": await db.meal_plans.find({"user_id": user_id}).to_list(1000),
        "favorites": await db.user_favorites.find({"user_id": user_id}).to_list(1000),
        "ai_history": await db.ai_chat_history.find({"user_id": user_id}).to_list(1000),
        "export_timestamp": datetime.utcnow().isoformat()
    }
    
    return {"data": user_data}

@router.delete("/user/delete-account")
async def delete_user_account(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
    confirmation: str = Body(..., embed=True)
):
    """Permanently delete user account and all data"""
    if confirmation != "DELETE_MY_ACCOUNT":
        raise HTTPException(status_code=400, detail="Invalid confirmation")
    
    user_id = current_user["uid"]
    
    # Delete all user data
    await db.users.delete_one({"uid": user_id})
    await db.food_logs.delete_many({"user_id": user_id})
    await db.meal_plans.delete_many({"user_id": user_id})
    await db.user_favorites.delete_many({"user_id": user_id})
    await db.ai_chat_history.delete_many({"user_id": user_id})
    
    # Delete from Firebase Auth
    try:
        auth.delete_user(user_id)
    except Exception as e:
        logger.error(f"Failed to delete Firebase user {user_id}: {e}")
    
    return {"message": "Account and all data permanently deleted"}
```

---

## 🛡️ **Security Best Practices**

### **Environment Variables Management**
```bash
# Production environment variables (secure storage)
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/nutrivize_v2"
ANTHROPIC_API_KEY="sk-ant-api03-..."
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoi..."
SECRET_KEY="nutrivize-production-secret-key-2025-super-secure"
FRONTEND_URL="https://nutrivize-frontend.onrender.com"

# Security configurations
ENVIRONMENT="production"
DEBUG=false
LOG_LEVEL="INFO"
CORS_ORIGINS="https://nutrivize-frontend.onrender.com,https://nutrivize.onrender.com"
```

### **Security Checklist**
- ✅ **Authentication**: Firebase Auth with JWT verification
- ✅ **Authorization**: User-specific data access controls
- ✅ **Input Validation**: Pydantic models with strict typing
- ✅ **Output Sanitization**: DOMPurify for frontend content
- ✅ **HTTPS**: TLS encryption for all communications
- ✅ **CORS**: Restrictive cross-origin policies
- ✅ **Error Handling**: Secure error messages in production
- ✅ **Token Management**: Secure storage and automatic refresh
- ✅ **Database Security**: TLS connections and user isolation
- ⏳ **Rate Limiting**: API throttling (future enhancement)
- ⏳ **Audit Logging**: Security event logging (future enhancement)
- ⏳ **Penetration Testing**: Regular security assessments (recommended)

### **Security Monitoring**
```python
import logging
from datetime import datetime

# Security event logging
security_logger = logging.getLogger("security")

async def log_security_event(event_type: str, user_id: str, details: dict):
    """Log security-related events for monitoring"""
    security_logger.info(
        f"SECURITY_EVENT: {event_type}",
        extra={
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details
        }
    )

# Usage examples
await log_security_event("LOGIN_SUCCESS", user_id, {"ip_address": request.client.host})
await log_security_event("LOGIN_FAILED", None, {"email": email, "ip_address": request.client.host})
await log_security_event("TOKEN_REFRESH", user_id, {"old_token_exp": exp_time})
await log_security_event("DATA_ACCESS", user_id, {"endpoint": "/food-logs/", "method": "GET"})
```

---

This comprehensive security documentation ensures that Nutrivize V2 maintains the highest standards of user data protection and system security.
