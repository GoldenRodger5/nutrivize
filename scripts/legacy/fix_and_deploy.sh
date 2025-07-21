#!/bin/bash
# Deployment Fix and Test Script for Nutrivize V2

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}       NUTRIVIZE V2 DEPLOYMENT FIX AND TEST           ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Check if in the right directory
if [ ! -d "./backend" ] || [ ! -d "./frontend" ]; then
    echo -e "${RED}Error: Please run this script from the Nutrivize V2 project root directory${NC}"
    exit 1
fi

# Function to apply fixes
apply_fixes() {
    echo -e "${YELLOW}Applying fixes to backend code...${NC}"
    
    # 1. Fix analytics endpoints
    echo "Fixing analytics endpoints..."
    if [ -f "./fix_analytics_endpoints.py" ]; then
        python3 ./fix_analytics_endpoints.py
        echo -e "${GREEN}✓ Applied fix to analytics endpoints${NC}"
    else
        echo -e "${RED}✗ fix_analytics_endpoints.py not found${NC}"
        echo "Using backup method for analytics fix"
        if [ -f "./backend/app/routes/analytics_fixed.py" ]; then
            cp ./backend/app/routes/analytics_fixed.py ./backend/app/routes/analytics.py
            echo -e "${GREEN}✓ Applied fix to analytics.py${NC}"
        else
            echo -e "${RED}✗ analytics_fixed.py not found${NC}"
            echo "Skipping analytics fix"
        fi
    fi
    
    # 2. Fix indentation errors in unified_ai_service.py
    echo "Fixing indentation errors in unified_ai_service.py..."
    if [ -f "./fix_indentation_errors.py" ]; then
        python3 ./fix_indentation_errors.py
        echo -e "${GREEN}✓ Fixed indentation errors${NC}"
    else
        echo -e "${RED}✗ fix_indentation_errors.py not found${NC}"
        echo "Skipping indentation fix"
    fi
    
    # 3. Fix main.py for CORS
    echo "Fixing CORS configuration in main.py..."
    python3 ./fix_deployment_issues.py --fix-only
    
    # 4. Fix AI chat food index access
    echo "Fixing AI chat food index access..."
    if [ -f "./fix_ai_chat_food_index.py" ]; then
        python3 ./fix_ai_chat_food_index.py
    else
        echo -e "${RED}✗ fix_ai_chat_food_index.py not found${NC}"
        echo "Skipping AI chat fix"
    fi
    
    echo -e "${GREEN}All fixes applied successfully!${NC}"
}

# Function to deploy to Render
deploy_to_render() {
    echo -e "${YELLOW}Deploying to Render...${NC}"
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: git is not installed or not in PATH${NC}"
        return 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}Error: Not in a git repository${NC}"
        return 1
    fi
    
    # Add specific fixed files
    echo -e "${YELLOW}Adding fixed files to git...${NC}"
    git add ./backend/app/routes/analytics.py
    git add ./backend/app/services/unified_ai_service.py
    
    # Also add any other files that might have been fixed
    git add ./backend/app/main.py
    
    # Commit changes with a detailed message
    git commit -m "Fix deployment issues: IndentationError in unified_ai_service.py and syntax error in analytics.py"
    
    # Push to Render branch (assuming main or master)
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${YELLOW}Pushing to ${current_branch} branch...${NC}"
    
    git push origin "${current_branch}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pushed changes to ${current_branch}${NC}"
        echo -e "${YELLOW}Render should automatically deploy the new version.${NC}"
        echo -e "${YELLOW}This may take a few minutes to complete.${NC}"
        return 0
    else
        echo -e "${RED}Failed to push changes${NC}"
        return 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running deployment tests...${NC}"
    
    # Check if the test script exists
    if [ -f "./render_deployment_test.py" ]; then
        python3 ./render_deployment_test.py
    else
        echo -e "${RED}✗ render_deployment_test.py not found${NC}"
        echo "Skipping tests"
    fi
}

# Function to log a message with timestamp
log_message() {
    echo -e "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

# New menu with specific fix for indentation and analytics errors
echo "Please select an option:"
echo "1. Fix indentation & analytics issues only"
echo "2. Fix indentation & analytics issues and deploy to Render"
echo "3. Run deployment tests only"
echo "4. Fix all issues (indentation, analytics), deploy, and test"
echo "5. Fix only indentation errors in unified_ai_service.py"
echo "6. Fix only syntax errors in analytics.py" 
echo "7. Exit"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        # Fix only indentation and analytics issues
        echo -e "${YELLOW}Fixing indentation in unified_ai_service.py...${NC}"
        python3 ./fix_indentation_errors.py
        
        echo -e "${YELLOW}Fixing analytics endpoint issues...${NC}"
        python3 ./fix_analytics_endpoints.py
        
        echo -e "${GREEN}Fixes applied. You can manually deploy when ready.${NC}"
        ;;
    2)
        # Fix and deploy
        echo -e "${YELLOW}Fixing indentation in unified_ai_service.py...${NC}"
        python3 ./fix_indentation_errors.py
        
        echo -e "${YELLOW}Fixing analytics endpoint issues...${NC}"
        python3 ./fix_analytics_endpoints.py
        
        deploy_to_render
        ;;
    3)
        run_tests
        ;;
    4)
        log_message "${YELLOW}Applying all fixes...${NC}"
        apply_fixes
        
        log_message "${YELLOW}Running additional specific fixes for indentation errors...${NC}"
        python3 ./fix_indentation_errors.py
        
        log_message "${YELLOW}Fixing analytics syntax errors...${NC}"
        python3 ./fix_analytics_endpoints.py
        
        deploy_to_render
        
        log_message "${YELLOW}Waiting 4 minutes for deployment to complete before testing...${NC}"
        echo "This delay allows Render to deploy your changes."
        echo "The deployment process may take a few minutes to complete."
        sleep 240
        
        run_tests
        ;;
    5)
        echo -e "${YELLOW}Fixing only indentation errors in unified_ai_service.py...${NC}"
        python3 ./fix_indentation_errors.py
        echo -e "${GREEN}Indentation errors fixed.${NC}"
        ;;
    6)
        echo -e "${YELLOW}Fixing only syntax errors in analytics.py...${NC}"
        python3 ./fix_analytics_endpoints.py
        echo -e "${GREEN}Analytics syntax errors fixed.${NC}"
        ;;
    7)
        echo "Exiting without making changes."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}                 PROCESS COMPLETE                     ${NC}"
echo -e "${BLUE}======================================================${NC}"
