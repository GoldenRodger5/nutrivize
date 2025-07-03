from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Import routes
from .routes import auth, foods, food_logs, ai, analytics, meal_planning, preferences, goals, weight_logs, water_logs, nutrition_labels, dietary, ai_dashboard, restaurant_ai, ai_health, food_stats
from .core.config import db_manager
from .core.firebase import firebase_manager

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        # Initialize database connection
        db_manager.connect()
        print("✅ Database connected successfully")
        
        # Initialize Firebase
        # Firebase is initialized in firebase.py
        print("✅ Firebase initialized successfully")
        
        yield
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise
    finally:
        # Shutdown
        db_manager.disconnect()
        print("🔌 Database disconnected")


# Create FastAPI app
app = FastAPI(
    title="Nutrivize V2 API",
    description="A clean, modern nutrition tracking API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware - Enhanced configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174", 
        "http://127.0.0.1:5175",
        "https://localhost:3000",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://localhost:5175",
        # Production URLs
        "https://nutrivize-frontend.onrender.com",
        "https://nutrivize-backend.onrender.com",
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=3600
)

# Manual OPTIONS handler for all routes
@app.options("/{full_path:path}")
async def options_handler(request: Request, response: Response):
    """Handle CORS preflight requests"""
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174", 
        "http://127.0.0.1:5175",
        "https://localhost:3000",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://localhost:5175",
        "https://nutrivize-frontend.onrender.com",
        "https://nutrivize-backend.onrender.com",
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ]
    
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return {"message": "OK"}

# Include routers
app.include_router(auth.router)
app.include_router(food_stats.router)
app.include_router(foods.router)
app.include_router(food_logs.router)
app.include_router(weight_logs.router)
app.include_router(water_logs.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(meal_planning.router)
app.include_router(preferences.router)
app.include_router(goals.router)
app.include_router(nutrition_labels.router, prefix="/nutrition-labels", tags=["nutrition-labels"])
app.include_router(dietary.router, prefix="/dietary", tags=["dietary"])
app.include_router(ai_dashboard.router)
app.include_router(restaurant_ai.router)
app.include_router(ai_health.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Nutrivize V2 API",
        "status": "healthy",
        "version": "2.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        db = db_manager.connect()
        db.client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "environment": os.getenv("ENVIRONMENT", "development")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
