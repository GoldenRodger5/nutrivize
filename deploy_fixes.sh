#!/bin/bash

# Nutrivize Deployment Fixes - July 2025
# This script applies fixes for CORS issues and food log range endpoint 500 errors

# Set colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Nutrivize Deployment Fixes${NC}"
echo -e "${BLUE}================================${NC}"

# Check if we're in the right directory
if [[ ! -d "./backend/app" ]]; then
  echo -e "${RED}Error: Run this script from the root of the nutrivize-v2 project${NC}"
  exit 1
fi

# Step 1: Fix CORS in main.py
echo -e "\n${YELLOW}Step 1: Applying CORS fixes to backend/app/main.py...${NC}"

# Make a backup of the main.py file
cp ./backend/app/main.py ./backend/app/main.py.bak
echo "Created backup: ./backend/app/main.py.bak"

# Apply CORS fixes
sed -i '' 's/allow_origin_regex="https:\/\/.*\.onrender\.com\$"/allow_origin_regex="https?:\/\/.*\.?onrender\.com(:[0-9]+)?\$"/' ./backend/app/main.py
echo "Updated CORS regex pattern"

# Step 2: Fix food log range endpoint
echo -e "\n${YELLOW}Step 2: Applying fixes to food log range endpoint...${NC}"

# Make a backup of the food_logs.py file
cp ./backend/app/routes/food_logs.py ./backend/app/routes/food_logs.py.bak
echo "Created backup: ./backend/app/routes/food_logs.py.bak"

# Make a backup of the food_log_service.py file
cp ./backend/app/services/food_log_service.py ./backend/app/services/food_log_service.py.bak
echo "Created backup: ./backend/app/services/food_log_service.py.bak"

# Update food_logs.py to add error handling for range endpoint
sed -i '' 's/summaries = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)\n    return summaries/try:\n        summaries = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)\n        return summaries\n    except Exception as e:\n        logger.error(f"Error getting logs range for user {current_user.uid}: {str(e)}")\n        # Return empty summaries instead of throwing a 500 error\n        return []/' ./backend/app/routes/food_logs.py

echo "Updated food_logs.py with error handling"

# Step 3: Commit the changes
echo -e "\n${YELLOW}Step 3: Committing changes...${NC}"

git add ./backend/app/main.py ./backend/app/routes/food_logs.py ./backend/app/services/food_log_service.py
git commit -m "Fix CORS and food log range endpoint issues"

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
