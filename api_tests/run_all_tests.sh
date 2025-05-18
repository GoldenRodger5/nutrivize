#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}   $1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to run a test script
run_test() {
    TEST_NAME=$1
    TEST_SCRIPT=$2
    
    echo -e "${YELLOW}Running test: ${TEST_NAME}${NC}"
    
    # Run the test script
    ./$TEST_SCRIPT
    
    # Check return status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${TEST_NAME} tests completed successfully${NC}\n"
    else
        echo -e "${RED}✗ ${TEST_NAME} tests failed${NC}\n"
    fi
}

# Main testing sequence
print_header "NUTRIVIZE API TESTING SUITE"

echo "This script will run all API tests for the Nutrivize application."
echo "Make sure the backend server is running before proceeding."
echo

# Confirm server is running
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)

if [ "$SERVER_STATUS" != "200" ]; then
    echo -e "${RED}ERROR: Cannot reach the server. Please make sure it's running at http://localhost:5001${NC}"
    echo "You can start the server with: cd ../backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 5001"
    exit 1
fi

echo -e "${GREEN}Server is running and reachable.${NC}"

# Run all tests in sequence
print_header "RUNNING ALL TESTS"

run_test "Main API" "test_api.sh"
run_test "Authentication API" "test_auth_api.sh"
run_test "Food Logs API" "test_food_logs_api.sh"
run_test "Goal Functionality" "test_goal_functions.sh"

print_header "ALL TESTS COMPLETED"

# Summary (in a real system this would count failures)
echo -e "${GREEN}All tests have been executed.${NC}"
echo -e "Please check the output above for any failures."
echo -e "For detailed test results, you can check the individual test logs." 