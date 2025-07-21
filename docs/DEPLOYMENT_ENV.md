# 🚀 Nutrivize V2 - Deployment & Environment Configuration

## 📋 **Table of Contents**
- [Deployment Overview](#deployment-overview)
- [Environment Configuration](#environment-configuration)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Render.com Configuration](#rendercom-configuration)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## 🎯 **Deployment Overview**

Nutrivize V2 uses a **cloud-native deployment strategy** with separate services for frontend and backend, ensuring scalability and maintainability.

### **Deployment Architecture**
```mermaid
graph TB
    subgraph "Production Environment"
        FE[Frontend - Render Static Site]
        BE[Backend - Render Web Service]
        DB[MongoDB Atlas]
        FB[Firebase Auth]
        AI[Anthropic Claude API]
        GV[Google Cloud Vision]
    end
    
    subgraph "Development Environment"
        DEV_FE[Local Frontend :5173]
        DEV_BE[Local Backend :8000]
        DEV_DB[MongoDB Atlas]
        DEV_FB[Firebase Auth]
    end
    
    FE --> BE
    BE --> DB
    BE --> FB
    BE --> AI
    BE --> GV
    
    DEV_FE --> DEV_BE
    DEV_BE --> DEV_DB
    DEV_BE --> DEV_FB
```

### **Service Configuration**
| Service | Type | Host | Purpose |
|---------|------|------|---------|
| Frontend | Static Site | `nutrivize-frontend.onrender.com` | React SPA |
| Backend | Web Service | `nutrivize-backend.onrender.com` | FastAPI server |
| Database | Cloud Service | MongoDB Atlas | Data storage |
| Authentication | Cloud Service | Firebase | User auth |
| AI Service | API | Anthropic Claude | AI features |

---

## ⚙️ **Environment Configuration**

### **Environment Types**
```yaml
# Development Environment
Environment: local
Debug: enabled
Hot Reload: enabled
API Docs: accessible
CORS: permissive (localhost)

# Production Environment  
Environment: production
Debug: disabled
Hot Reload: disabled
API Docs: restricted
CORS: strict (production domains only)
```

### **Configuration Management**
```python
# backend/app/core/config.py
from pydantic import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Database
    MONGODB_URL: str
    DATABASE_NAME: str = "nutrivize_v2"
    
    # Authentication
    FIREBASE_SERVICE_ACCOUNT_BASE64: str
    SECRET_KEY: str
    
    # External APIs
    ANTHROPIC_API_KEY: str
    GOOGLE_CLOUD_VISION_CREDENTIALS_BASE64: str
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://nutrivize-frontend.onrender.com"
    ]
    
    class Config:
        env_file = f".env.{os.getenv('ENVIRONMENT', 'development')}"
        case_sensitive = True

settings = Settings()
```

---

## 💻 **Local Development Setup**

### **Quick Start Script**
```bash
#!/bin/bash
# scripts/development/start-nutrivize.sh

echo "🚀 Starting Nutrivize V2 Development Environment..."

# Check and kill processes on ports
echo "🔍 Checking and freeing ports..."
kill -9 $(lsof -ti:8000,5173) 2>/dev/null
sleep 2

# Set up environment variables for local development
echo "🔧 Setting up environment..."
export ENVIRONMENT="local"

# Create/update the .env.local file with correct values
echo "📝 Setting up .env.local file..."
cat > backend/.env.local << EOL
# Local development environment variables
MONGODB_URL="mongodb+srv://isaacmineo:1vWVKLtI4cFn1LNN@nutrivize.rbj6ly6.mongodb.net/nutrivize_v2?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true"
ANTHROPIC_API_KEY="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"
FIREBASE_PROJECT_ID="food-tracker-6096d"
ENVIRONMENT="local"
DEBUG=true
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoi..."
GOOGLE_CLOUD_VISION_CREDENTIALS_BASE64="eyJ0eXBlIjoi..."
SECRET_KEY="nutrivize-development-secret-key-2025"
FRONTEND_URL="http://localhost:5173"
EOL

echo "🔙 Starting backend server..."
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🎨 Starting frontend development server..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

### **Development Dependencies**
```bash
# Backend dependencies (requirements.txt)
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2
firebase-admin==6.2.0
anthropic==0.7.7
google-cloud-vision==3.4.5
pydantic==2.5.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
bcrypt==4.1.2
python-dotenv==1.0.0

# Frontend dependencies (package.json)
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.16.5",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "firebase": "^10.7.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.1.1",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
```

---

## 🌐 **Production Deployment**

### **Render.com Deployment Configuration**

#### **Backend Service Configuration**
```yaml
# render.yaml (Backend)
services:
  - type: web
    name: nutrivize-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    plan: starter
    region: oregon
    branch: main
    rootDir: backend
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: MONGODB_URL
        sync: false  # Set manually in dashboard
      - key: ANTHROPIC_API_KEY
        sync: false  # Set manually in dashboard
      - key: FIREBASE_SERVICE_ACCOUNT_BASE64
        sync: false  # Set manually in dashboard
      - key: GOOGLE_CLOUD_VISION_CREDENTIALS_BASE64
        sync: false  # Set manually in dashboard
      - key: SECRET_KEY
        sync: false  # Set manually in dashboard
      - key: FRONTEND_URL
        value: https://nutrivize-frontend.onrender.com
```

#### **Frontend Service Configuration**
```yaml
# render.yaml (Frontend)
services:
  - type: static
    name: nutrivize-frontend
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    pullRequestPreviewsEnabled: false
    branch: main
    rootDir: frontend
    envVars:
      - key: VITE_API_BASE_URL
        value: https://nutrivize-backend.onrender.com
      - key: VITE_ENVIRONMENT
        value: production
      - key: VITE_FIREBASE_API_KEY
        sync: false  # Set manually in dashboard
      - key: VITE_FIREBASE_AUTH_DOMAIN
        value: food-tracker-6096d.firebaseapp.com
      - key: VITE_FIREBASE_PROJECT_ID
        value: food-tracker-6096d
```

### **Deployment Scripts**
```bash
#!/bin/bash
# scripts/deployment/deploy-production.sh

echo "🚀 Deploying Nutrivize V2 to Production..."

# Validate environment
if [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ ENVIRONMENT must be set to 'production'"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "MONGODB_URL"
    "ANTHROPIC_API_KEY" 
    "FIREBASE_SERVICE_ACCOUNT_BASE64"
    "SECRET_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment validation passed"

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm ci --production
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build successful"

# Test backend
echo "🧪 Testing backend..."
cd ../backend
pip install -r requirements.txt
python -m pytest tests/ -v

if [ $? -ne 0 ]; then
    echo "❌ Backend tests failed"
    exit 1
fi

echo "✅ Backend tests passed"

# Deploy via Git push
echo "📤 Deploying to Render..."
git add .
git commit -m "Production deployment $(date)"
git push origin main

echo "🎉 Deployment initiated! Check Render dashboard for status."
```

---

## 🔧 **Environment Variables**

### **Backend Environment Variables**
```bash
# Required for all environments
MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/nutrivize_v2"
ANTHROPIC_API_KEY="sk-ant-api03-..."
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoi..."
SECRET_KEY="your-secret-key-here"

# Optional with defaults
ENVIRONMENT="development"  # "development" | "production"
DEBUG="false"              # "true" | "false"
DATABASE_NAME="nutrivize_v2"
FRONTEND_URL="http://localhost:5173"

# Production only
GOOGLE_CLOUD_VISION_CREDENTIALS_BASE64="eyJ0eXBlIjoi..."
LOG_LEVEL="INFO"           # "DEBUG" | "INFO" | "WARNING" | "ERROR"

# Development only
RELOAD="true"              # Enable auto-reload
DOCS_URL="/docs"           # API documentation URL
```

### **Frontend Environment Variables**
```bash
# Required for all environments
VITE_API_BASE_URL="http://localhost:8000"           # Development
VITE_API_BASE_URL="https://nutrivize-backend.onrender.com"  # Production

VITE_FIREBASE_API_KEY="AIzaSyC..."
VITE_FIREBASE_AUTH_DOMAIN="food-tracker-6096d.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="food-tracker-6096d"

# Optional with defaults
VITE_ENVIRONMENT="development"  # "development" | "production"
VITE_APP_NAME="Nutrivize V2"
VITE_APP_VERSION="2.0.0"

# Production only
VITE_GOOGLE_ANALYTICS_ID="G-..."  # If analytics enabled
```

### **Environment File Structure**
```
backend/
├── .env.example          # Example environment file
├── .env.development      # Development environment
├── .env.local           # Local overrides (gitignored)
└── .env.production      # Production environment (gitignored)

frontend/
├── .env.example          # Example environment file
├── .env.development      # Development environment
├── .env.local           # Local overrides (gitignored)
└── .env.production      # Production environment (gitignored)
```

---

## ⚡ **Performance Optimization**

### **Backend Performance**
```python
# FastAPI performance optimizations
from fastapi import FastAPI
import uvicorn

app = FastAPI(
    title="Nutrivize V2 API",
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url=None if not settings.DEBUG else "/redoc",
)

# Enable compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Database connection pooling
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    
    async def connect_db():
        Database.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=50,        # Maximum connections
            minPoolSize=5,         # Minimum connections
            maxIdleTimeMS=30000,   # Close connections after 30s idle
            serverSelectionTimeoutMS=5000,
        )
    
    async def close_db():
        Database.client.close()

# Startup/shutdown events
@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db()

@app.on_event("shutdown") 
async def shutdown_db_client():
    await Database.close_db()
```

### **Frontend Performance**
```typescript
// Vite build optimization
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'chakra-vendor': ['@chakra-ui/react', '@emotion/react'],
          'router-vendor': ['react-router-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable in production
  },
  server: {
    port: 5173,
    host: true,
  },
})

// Code splitting for routes
import { lazy, Suspense } from 'react'

const AIDashboard = lazy(() => import('./pages/AIDashboard'))
const FoodLog = lazy(() => import('./pages/FoodLog'))
const MealPlans = lazy(() => import('./pages/MealPlans'))

// Usage with suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<AIDashboard />} />
    <Route path="/food-log" element={<FoodLog />} />
    <Route path="/meal-plans" element={<MealPlans />} />
  </Routes>
</Suspense>
```

### **Caching Strategy**
```python
# Backend caching
from functools import lru_cache
import asyncio

# Cache frequently accessed data
@lru_cache(maxsize=1000)
def get_food_item(food_id: str):
    # Cache food items that don't change often
    pass

# Async caching for database queries
class AsyncLRUCache:
    def __init__(self, maxsize=100):
        self.cache = {}
        self.maxsize = maxsize
    
    async def get_or_set(self, key: str, coro):
        if key in self.cache:
            return self.cache[key]
        
        result = await coro
        
        if len(self.cache) >= self.maxsize:
            # Remove oldest item
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        self.cache[key] = result
        return result

# Usage
food_cache = AsyncLRUCache(maxsize=500)

async def get_cached_food(food_id: str):
    return await food_cache.get_or_set(
        f"food:{food_id}",
        db.foods.find_one({"_id": ObjectId(food_id)})
    )
```

---

## 📊 **Monitoring & Logging**

### **Application Logging**
```python
# Structured logging configuration
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
            
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
            
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_entry)

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Application logger
logger = logging.getLogger("nutrivize")
if settings.ENVIRONMENT == "production":
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
```

### **Request Logging Middleware**
```python
import time
import uuid
from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Generate request ID
    request_id = str(uuid.uuid4())
    
    # Log request
    start_time = time.time()
    
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "user_agent": request.headers.get("user-agent"),
            "client_ip": request.client.host,
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    
    logger.info(
        f"Request completed: {response.status_code}",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "process_time": process_time,
        }
    )
    
    response.headers["X-Request-ID"] = request_id
    return response
```

### **Health Check Endpoints**
```python
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }

@app.get("/health/detailed")
async def detailed_health_check(db: Database = Depends(get_database)):
    """Detailed health check including dependencies"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Database check
    try:
        await db.admin.command('ping')
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Firebase check
    try:
        # Try to verify a dummy token (will fail but connection works)
        auth.verify_id_token("dummy", check_revoked=False)
    except Exception:
        # Expected to fail, but connection is working
        health_status["checks"]["firebase"] = "healthy"
    
    return health_status
```

---

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **Port Conflicts**
```bash
# Kill processes on development ports
./scripts/development/kill-ports.sh

#!/bin/bash
echo "🔍 Checking for processes on ports 8000 and 5173..."
lsof -ti:8000,5173 | xargs -r kill -9
echo "✅ Ports cleared"
```

#### **Environment Variable Issues**
```bash
# Validate environment variables
./scripts/development/validate-env.sh

#!/bin/bash
echo "🔍 Validating environment variables..."

# Check backend variables
if [ -z "$MONGODB_URL" ]; then
    echo "❌ MONGODB_URL not set"
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set"
    exit 1
fi

# Check frontend variables  
if [ -z "$VITE_API_BASE_URL" ]; then
    echo "❌ VITE_API_BASE_URL not set"
    exit 1
fi

echo "✅ All required environment variables are set"
```

#### **Database Connection Issues**
```python
# Database connectivity test
async def test_database_connection():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        await client.close()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Run test
if __name__ == "__main__":
    import asyncio
    asyncio.run(test_database_connection())
```

#### **Authentication Issues**
```typescript
// Token debugging utility
export const debugAuthToken = () => {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    console.log('❌ No auth token found')
    return
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Date.now() / 1000
    
    console.log('🔍 Token Debug Info:')
    console.log('User ID:', payload.user_id)
    console.log('Email:', payload.email)
    console.log('Issued At:', new Date(payload.iat * 1000))
    console.log('Expires At:', new Date(payload.exp * 1000))
    console.log('Is Expired:', payload.exp < now)
    console.log('Time Until Expiry:', Math.max(0, payload.exp - now), 'seconds')
  } catch (error) {
    console.error('❌ Invalid token format:', error)
  }
}
```

### **Performance Monitoring**
```python
# Performance monitoring decorator
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            logger.info(
                f"Function {func.__name__} executed successfully",
                extra={
                    "function": func.__name__,
                    "execution_time": execution_time,
                    "status": "success"
                }
            )
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            logger.error(
                f"Function {func.__name__} failed",
                extra={
                    "function": func.__name__,
                    "execution_time": execution_time,
                    "status": "error",
                    "error": str(e)
                }
            )
            
            raise
    
    return wrapper

# Usage
@monitor_performance
async def get_food_logs(user_id: str):
    # Function implementation
    pass
```

---

This deployment documentation provides comprehensive guidance for setting up, deploying, and maintaining Nutrivize V2 in both development and production environments.
