from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

# Mount static files for PWA support (if running in development or serving frontend)
# This allows the backend to serve PWA assets if needed
try:
    # Check if we're serving the frontend from the backend
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")
    if os.path.exists(frontend_path):
        app.mount("/static", StaticFiles(directory=frontend_path), name="static")
        print(f"✅ Serving static files from {frontend_path}")
except Exception as e:
    print(f"ℹ️  Static files not mounted: {e}")

# CORS middleware - Enhanced configuration for production
# Get CORS origins from environment variable or use defaults
cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
if not cors_origins or cors_origins == [""]:
    cors_origins = [
        # Local development
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
        "https://nutrivize.onrender.com"
    ]

# Add frontend URL from environment if available
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

print(f"✅ CORS configured with origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://.*\.?onrender\.com(:[0-9]+)?$",  # Allow all onrender.com subdomains with optional port
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
        "Cache-Control",
        "Pragma"
    ],
    expose_headers=["*"],
    max_age=3600
)

# Enhanced middleware for CORS debugging and PWA headers
@app.middleware("http")
async def enhanced_cors_middleware(request: Request, call_next):
    """Enhanced CORS and PWA headers middleware"""
    origin = request.headers.get("origin")
    method = request.method
    
    # List of allowed origins
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
        "https://nutrivize.onrender.com",
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ]
    
    # Check if origin is from onrender.com domain
    is_render_domain = origin and "onrender.com" in origin.lower()
    
    # Handle OPTIONS preflight requests
    if method == "OPTIONS":
        response = Response()
        if origin in allowed_origins or is_render_domain:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Cache-Control, Pragma"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
        return response
    
    # Process the request
    response = await call_next(request)
    
    # Add CORS headers to all responses
    # Check if origin is from onrender.com domain
    is_render_domain = origin and "onrender.com" in origin.lower()
    
    if origin in allowed_origins or is_render_domain:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Add PWA-specific headers
    if request.url.path.endswith('/manifest.json'):
        response.headers["Content-Type"] = "application/manifest+json"
        response.headers["Cache-Control"] = "public, max-age=3600"
    
    if request.url.path.endswith('/sw.js'):
        response.headers["Content-Type"] = "application/javascript"
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Service-Worker-Allowed"] = "/"
    
    # Add security headers for PWA
    if request.url.path.startswith('/icons/') or request.url.path.endswith('.png'):
        response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year
    
    # Add CSP headers for PWA security
    if request.url.path.endswith('.html') or request.url.path == '/':
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://*.onrender.com https://api.anthropic.com; "
            "manifest-src 'self'"
        )
    
    return response

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
