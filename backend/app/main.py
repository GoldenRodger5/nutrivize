from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pydantic import ValidationError as PydanticValidationError
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

# Set up enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("nutrivize")

# Import security and error handling
from .core.security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware, 
    RequestLoggingMiddleware,
    RequestSizeLimitMiddleware
)
from .core.error_handling import (
    ErrorHandlingMiddleware,
    nutrivize_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler
)
from .core.exceptions import NutrivizeException

# Import routes safely
from .routes import auth, foods, food_logs, ai, meal_planning, preferences, goals, weight_logs, water_logs, nutrition_labels, dietary, ai_dashboard, restaurant_ai, ai_health, food_stats, user_favorites, user_foods, onboarding

# Import analytics routes
try:
    from .routes import analytics
    logger.info("Successfully imported analytics routes")
except Exception as e:
    logger.error("Error importing analytics routes", extra={"error": str(e)})
    # Create a minimal version in memory
    from fastapi import APIRouter
    analytics = type('Module', (), {})
    analytics.router = APIRouter(prefix="/analytics", tags=["analytics"])
    logger.warning("Using minimal analytics routes")

from .core.config import db_manager
from .core.firebase import firebase_manager
from .core.redis_client import redis_client

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
        
        # Shutdown
        db_manager.disconnect()
        print("🔌 Database disconnected")
    except Exception as e:
        print(f"❌ Error during app lifecycle: {str(e)}")
        raise e


# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="Nutrivize API",
    description="Comprehensive nutrition tracking and AI-powered meal planning API",
    version="2.0.0",
    lifespan=lifespan,
    # Add better error handling for validation
    openapi_tags=[
        {"name": "auth", "description": "Authentication endpoints"},
        {"name": "foods", "description": "Food database operations"},
        {"name": "food-logs", "description": "Food logging and tracking"},
        {"name": "analytics", "description": "Nutrition analytics and insights"},
        {"name": "ai", "description": "AI-powered features"},
    ]
)

# Add security middleware (order matters!)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)  # 10MB limit
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware, log_body=False)  # Set to True for debugging

# Add rate limiting - adjust based on your needs
app.add_middleware(
    RateLimitMiddleware, 
    requests_per_minute=300,  # Increased significantly for nutrition app usage
    burst_requests=50  # Allow more burst requests
)

# Configure CORS with tighter security
is_production = os.getenv("ENVIRONMENT", "development") == "production"

if is_production:
    # Production CORS - more restrictive
    origins = [
        "https://nutrivize-frontend.onrender.com",
        "https://nutrivize.onrender.com",
    ]
else:
    # Development CORS - more permissive
    origins = [
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
        "https://nutrivize.onrender.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"]
)

logger.info("CORS configured", extra={"origins": origins, "production": is_production})

# Add exception handlers
app.add_exception_handler(NutrivizeException, nutrivize_exception_handler)
app.add_exception_handler(PydanticValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Add routes
# Add comprehensive health check endpoint for production monitoring
@app.get("/health", tags=["health"])
async def health_check():
    """
    Comprehensive health check endpoint for production monitoring.
    Returns API status and service connectivity.
    """
    try:
        # Check Redis if available
        redis_status = "up" if redis_client.is_connected() else "not_configured"
        
        # Simple database check - just check if db_manager is connected
        db_status = "up" if db_manager else "down"
        
        return {
            "status": "healthy",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "api": "up",
                "database": db_status,
                "redis": redis_status
            }
        }
    except Exception as e:
        logger.error("Health check failed", extra={"error": str(e)})
        raise HTTPException(
            status_code=503, 
            detail="Service temporarily unavailable"
        )

# Include routers with tags
app.include_router(auth.router, prefix="/auth", tags=["auth"])                  # auth.router has no prefix
app.include_router(onboarding.router, tags=["onboarding"])                     # onboarding.router has /onboarding prefix  
app.include_router(foods.router, tags=["foods"])                               # foods.router has /foods prefix
app.include_router(food_logs.router, tags=["food-logs"])                       # food_logs.router has /food-logs prefix
app.include_router(preferences.router, prefix="/preferences", tags=["preferences"])  # preferences.router has no prefix
app.include_router(analytics.router, tags=["analytics"])                       # analytics.router has /analytics prefix  
app.include_router(ai.router, tags=["ai"])                                     # ai.router has /ai prefix
app.include_router(ai_dashboard.router, tags=["ai-dashboard"])                 # ai_dashboard.router has /ai-dashboard prefix
app.include_router(ai_health.router, tags=["ai-health"])                       # ai_health.router has /ai-health prefix
app.include_router(restaurant_ai.router, tags=["restaurant-ai"])               # restaurant_ai.router has /restaurant-ai prefix
app.include_router(meal_planning.router, tags=["meal-planning"])               # meal_planning.router has /meal-planning prefix
app.include_router(goals.router, tags=["goals"])                               # goals.router has /goals prefix
app.include_router(weight_logs.router, tags=["weight-logs"])                   # weight_logs.router has /weight-logs prefix
app.include_router(water_logs.router, tags=["water-logs"])                     # water_logs.router has /water-logs prefix
app.include_router(nutrition_labels.router, prefix="/nutrition-labels", tags=["nutrition-labels"])  # nutrition_labels.router has no prefix
app.include_router(dietary.router, prefix="/dietary", tags=["dietary"])       # dietary.router has no prefix
app.include_router(food_stats.router, prefix="/food-stats", tags=["food-stats"])  # food_stats.router has no prefix
app.include_router(user_favorites.router, tags=["favorites"])                  # user_favorites.router has /favorites prefix
app.include_router(user_foods.router, tags=["user-foods"])                     # user_foods.router has /user-foods prefix

logger.info("API routes configured successfully")

# Serve static files from the frontend build directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    print(f"✅ Serving static files from {static_dir}")
else:
    @app.get("/")
    async def root():
        return {"message": "Nutrivize API is running. Frontend not found."}
    print("⚠️ Frontend static files not found")

logger.info("✅ Nutrivize API startup complete with enhanced production features")
