#!/bin/bash

# Deploy fixed version of the app with correct indentation fix
# This script replaces the problematic files with hotfixed versions

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting hotfix deployment...${NC}"

# Create backup directory
BACKUP_DIR="/tmp/nutrivize_backup_$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Created backup directory: $BACKUP_DIR${NC}"

# Backup and replace analytics.py with analytics_hotfix.py
if [ -f "app/routes/analytics.py" ] && [ -f "app/routes/analytics_hotfix.py" ]; then
    echo -e "${YELLOW}Backing up and replacing analytics.py...${NC}"
    cp "app/routes/analytics.py" "$BACKUP_DIR/analytics.py.bak"
    cp "app/routes/analytics_hotfix.py" "app/routes/analytics.py"
    echo -e "${GREEN}Replaced analytics.py with hotfix version${NC}"
else
    echo -e "${RED}Analytics files not found${NC}"
fi

# Fix indentation issues in unified_ai_service.py
if [ -f "app/services/unified_ai_service.py" ]; then
    echo -e "${YELLOW}Fixing unified_ai_service.py...${NC}"
    cp "app/services/unified_ai_service.py" "$BACKUP_DIR/unified_ai_service.py.bak"
    
    # Fix the indentation by replacing the problematic lines
    # Using awk for more reliable text processing
    awk '{
        if ($0 ~ /^ +user_context = await self\._get_comprehensive_user_context/) {
            print "            user_context = await self._get_comprehensive_user_context(user_id)"
        } else {
            print $0
        }
    }' "app/services/unified_ai_service.py" > "app/services/unified_ai_service.py.new"
    
    # Replace the original file with the fixed version
    mv "app/services/unified_ai_service.py.new" "app/services/unified_ai_service.py"
    echo -e "${GREEN}Fixed indentation in unified_ai_service.py${NC}"
else
    echo -e "${RED}unified_ai_service.py not found${NC}"
fi

# Update main.py to use try-except when importing routes
if [ -f "app/main.py" ]; then
    echo -e "${YELLOW}Updating main.py with safer imports...${NC}"
    cp "app/main.py" "$BACKUP_DIR/main.py.bak"
    
    # Create a new version of main.py with safer imports
    cat > "app/main.py.new" << 'EOL'
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nutrivize")

# Import routes safely
from .routes import auth, foods, food_logs, ai, meal_planning, preferences, goals, weight_logs, water_logs, nutrition_labels, dietary, ai_dashboard, restaurant_ai, ai_health, food_stats

# Try to import analytics routes, but use the hotfix if there's an error
try:
    from .routes import analytics
    logger.info("Successfully imported analytics routes")
except Exception as e:
    logger.error(f"Error importing analytics routes: {str(e)}")
    try:
        # Try to import the hotfix version
        from .routes import analytics_hotfix as analytics
        logger.info("Using analytics hotfix routes")
    except Exception as e2:
        logger.error(f"Error importing analytics hotfix: {str(e2)}")
        # Create a minimal version in memory
        from fastapi import APIRouter
        analytics = type('Module', (), {})
        analytics.router = APIRouter(prefix="/analytics", tags=["analytics"])
        logger.warning("Using minimal analytics routes")

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
        
        # Shutdown
        db_manager.disconnect()
        print("🔌 Database disconnected")
    except Exception as e:
        print(f"❌ Error during app lifecycle: {str(e)}")
        raise e


# Create FastAPI app
app = FastAPI(lifespan=lifespan)

# Configure CORS
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
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"✅ CORS configured with origins: {origins}")

# Add routes
app.include_router(auth.router)
app.include_router(foods.router)
app.include_router(food_logs.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(meal_planning.router)
app.include_router(preferences.router)
app.include_router(goals.router)
app.include_router(weight_logs.router)
app.include_router(water_logs.router)
app.include_router(nutrition_labels.router)
app.include_router(dietary.router)
app.include_router(ai_dashboard.router)
app.include_router(restaurant_ai.router)
app.include_router(ai_health.router)
app.include_router(food_stats.router)

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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
EOL
    
    # Replace the main.py file with the new version
    mv "app/main.py.new" "app/main.py"
    echo -e "${GREEN}Updated main.py with safer imports${NC}"
else
    echo -e "${RED}main.py not found${NC}"
fi

echo -e "${GREEN}Hotfix deployment completed!${NC}"
echo -e "${YELLOW}Backup files are in: $BACKUP_DIR${NC}"
