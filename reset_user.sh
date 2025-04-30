#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Resetting User Authentication State ===${NC}"

# Clear browser localStorage
echo -e "${YELLOW}Please follow these steps to reset your authentication:${NC}"
echo ""
echo -e "1. ${GREEN}Open Chrome DevTools${NC} (press F12 or right-click and select 'Inspect')"
echo -e "2. ${GREEN}Go to the Application tab${NC}"
echo -e "3. ${GREEN}Select 'Local Storage'${NC}"
echo -e "4. ${GREEN}Select 'http://localhost:3000'${NC}"
echo -e "5. ${GREEN}Right-click and select 'Clear'${NC} to remove all items"
echo -e "6. ${GREEN}Refresh the page${NC}"
echo ""
echo -e "${YELLOW}For a more thorough reset:${NC}"
echo ""
echo -e "7. ${GREEN}In Chrome, clear your cookies and site data:${NC}"
echo -e "   - Open Chrome settings"
echo -e "   - Go to Privacy and Security > Clear browsing data"
echo -e "   - Select 'Cookies and site data'"
echo -e "   - Set time range to 'All time'"
echo -e "   - Click 'Clear data'"
echo ""
echo -e "${BLUE}If you continue having issues, try registering with a completely new email${NC}"
echo -e "${BLUE}Example:${NC} user_$(date +%s)@example.com"
echo ""
echo -e "${GREEN}=== Reset instructions complete ===${NC}" 