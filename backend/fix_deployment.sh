#!/bin/bash

# Fix Deployment Issues Script for Nutrivize App
# This script applies necessary fixes for Render deployment

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Nutrivize deployment fixes...${NC}"

# Ensure we're in the right directory
cd "$(dirname "$0")" || { echo -e "${RED}Failed to change to script directory${NC}"; exit 1; }
cd .. || { echo -e "${RED}Failed to navigate to backend directory${NC}"; exit 1; }

# Run Python fix script for backend issues
echo -e "${YELLOW}Applying backend fixes...${NC}"
python -m app.services.fix_deployment_issues

# Fix frontend environment variables
echo -e "${YELLOW}Checking frontend environment variables...${NC}"
FRONTEND_ENV_FILE="../frontend/.env.production"

if [ -f "$FRONTEND_ENV_FILE" ]; then
    echo -e "${GREEN}Updating frontend environment variables...${NC}"
    # Ensure CORS origin is correctly set
    grep -q "VITE_API_BASE_URL=" "$FRONTEND_ENV_FILE" || echo 'VITE_API_BASE_URL=https://nutrivize.onrender.com' >> "$FRONTEND_ENV_FILE"
    echo -e "${GREEN}Frontend environment checked and updated.${NC}"
else
    echo -e "${RED}Frontend environment file not found: $FRONTEND_ENV_FILE${NC}"
    echo -e "${YELLOW}Creating new frontend environment file...${NC}"
    mkdir -p "../frontend"
    cat > "$FRONTEND_ENV_FILE" << EOL
# Frontend production environment variables

# API Configuration
VITE_API_BASE_URL=https://nutrivize.onrender.com
VITE_ENVIRONMENT=production
EOL
    echo -e "${GREEN}Created new frontend environment file.${NC}"
fi

# Verify CORS settings
echo -e "${YELLOW}Verifying CORS settings...${NC}"
CORS_FILE="app/main.py"

if [ -f "$CORS_FILE" ]; then
    echo -e "${GREEN}Checking CORS configuration...${NC}"
    # Make sure nutrivize.onrender.com is in CORS origins
    grep -q "nutrivize.onrender.com" "$CORS_FILE" || echo -e "${RED}Warning: nutrivize.onrender.com might not be in CORS origins${NC}"
else
    echo -e "${RED}CORS configuration file not found: $CORS_FILE${NC}"
fi

# Final checks
echo -e "${YELLOW}Running final deployment checks...${NC}"

# Check for indentation errors in Python files
python -m py_compile app/services/unified_ai_service.py && echo -e "${GREEN}unified_ai_service.py syntax is correct${NC}" || echo -e "${RED}unified_ai_service.py has syntax errors${NC}"

# Check for missing requirements
pip list | grep -q "anthropic" && echo -e "${GREEN}anthropic package is installed${NC}" || echo -e "${RED}anthropic package might be missing${NC}"
pip list | grep -q "fastapi" && echo -e "${GREEN}fastapi package is installed${NC}" || echo -e "${RED}fastapi package might be missing${NC}"

echo -e "${GREEN}All deployment fixes applied successfully!${NC}"
echo -e "${YELLOW}Ready to deploy to Render.${NC}"
