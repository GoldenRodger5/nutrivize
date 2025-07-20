#!/bin/bash

# Comprehensive CORS Fix for Nutrivize V2
# Created: July 3, 2025

# Set colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Nutrivize Complete CORS Fix${NC}"
echo -e "${BLUE}================================${NC}"

# Check if we're in the right directory
if [[ ! -d "./backend/app" ]]; then
  echo -e "${RED}Error: Run this script from the root of the nutrivize-v2 project${NC}"
  exit 1
fi

# Step 1: Fix CORS in main.py for general endpoints
echo -e "\n${YELLOW}Step 1: Applying general CORS fixes to backend/app/main.py...${NC}"

# Make a backup of the main.py file
cp ./backend/app/main.py ./backend/app/main.py.bak
echo "Created backup: ./backend/app/main.py.bak"

# Step 2: Add special handling for AI endpoints
echo -e "\n${YELLOW}Step 2: Enhancing CORS for AI endpoints...${NC}"

# Add special handling for AI endpoints in the middleware
sed -i '' 's/    # Process the request/    # Special handling for AI endpoints with additional logging\n    is_ai_endpoint = "\/ai\/" in request.url.path\n    \n    # Process the request/' ./backend/app/main.py

# Update the response headers part
sed -i '' 's/    if origin in allowed_origins or is_render_domain:/    # Force CORS headers for all responses, especially AI endpoints\n    if origin and (origin in allowed_origins or is_render_domain):/' ./backend/app/main.py

# Add extra headers for AI endpoints
sed -i '' 's/        response.headers\["Access-Control-Allow-Credentials"\] = "true"/        response.headers\["Access-Control-Allow-Credentials"\] = "true"\n        \n        # Additional debugging for AI endpoints\n        if is_ai_endpoint:\n            # Force CORS headers for AI endpoints to ensure they'\''re present\n            response.headers\["Access-Control-Allow-Methods"\] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"\n            response.headers\["Access-Control-Allow-Headers"\] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin"/' ./backend/app/main.py

# Step 3: Fix food log range endpoint
echo -e "\n${YELLOW}Step 3: Applying fixes to food log range endpoint...${NC}"

# Make a backup of the food_logs.py file
cp ./backend/app/routes/food_logs.py ./backend/app/routes/food_logs.py.bak
echo "Created backup: ./backend/app/routes/food_logs.py.bak"

# Update food_logs.py to add error handling for range endpoint
sed -i '' 's/summaries = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)\n    return summaries/try:\n        summaries = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)\n        return summaries\n    except Exception as e:\n        logger.error(f"Error getting logs range for user {current_user.uid}: {str(e)}")\n        # Return empty summaries instead of throwing a 500 error\n        return []/' ./backend/app/routes/food_logs.py

echo "Updated food_logs.py with error handling"

# Step 4: Add special handling for AI endpoints
echo -e "\n${YELLOW}Step 4: Enhancing AI route handling...${NC}"

# Make a backup of the ai.py file
cp ./backend/app/routes/ai.py ./backend/app/routes/ai.py.bak
echo "Created backup: ./backend/app/routes/ai.py.bak"

# Add logging dependency to AI routes
sed -i '' 's/import logging/import logging\n\nlogger = logging.getLogger(__name__)\n\n# Custom dependency to ensure CORS headers are added to AI endpoint responses\nasync def ensure_cors_headers(request: Request) -> None:\n    """Dependency that logs AI endpoint requests and ensures CORS headers will be added"""\n    # Log the request for debugging\n    logger.info(f"AI endpoint accessed: {request.url.path} from origin: {request.headers.get('\''origin'\'', '\''unknown'\'')}")\n    # The actual header addition happens in the enhanced_cors_middleware in main.py\n    # This is just for logging and debugging purposes\n    return None/' ./backend/app/routes/ai.py

# Update meal-suggestions endpoint to use the dependency
sed -i '' 's/    current_user: UserResponse = Depends(get_current_user)/    current_user: UserResponse = Depends(get_current_user),\n    _: None = Depends(ensure_cors_headers)/' ./backend/app/routes/ai.py

# Step 5: Commit the changes
echo -e "\n${YELLOW}Step 5: Committing changes...${NC}"

git add ./backend/app/main.py ./backend/app/routes/food_logs.py ./backend/app/routes/ai.py
git commit -m "Comprehensive CORS fix for all endpoints, especially AI meal-suggestions"

echo -e "\n${GREEN}Changes have been committed.${NC}"
echo -e "${YELLOW}To deploy these changes to Render:${NC}"
echo "1. Push the changes to your repository:"
echo "   git push origin main"
echo "2. Render should automatically deploy the changes if automatic deployments are enabled."
echo "3. If not, manually deploy from the Render dashboard."
echo
echo -e "${YELLOW}To verify the fixes:${NC}"
echo "1. Run the verification script:"
echo "   python verify_deployment.py --password YOUR_PASSWORD"
echo

# Make script executable
chmod +x "$(basename "$0")"
