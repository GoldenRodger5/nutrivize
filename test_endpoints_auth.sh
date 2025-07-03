#!/bin/bash

# Comprehensive API Endpoint Tests - Authentication & User Management
# Test file 1 of 3: Authentication and User Profile endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8000"
TEST_EMAIL="isaacmineo@gmail.com"
TEST_PASSWORD="Buddydog41"
TOKEN=""

echo -e "${BLUE}=== Nutrivize V2 API Endpoint Tests - Authentication & User Management ===${NC}"
echo "API URL: $API_URL"
echo "Test User: $TEST_EMAIL"
echo ""

# Function to run test with proper error handling
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    # Run the command and capture both stdout and stderr
    if response=$(eval "$command" 2>&1); then
        # Check if response contains error indicators
        if echo "$response" | grep -q "error\|Error\|ERROR\|failed\|Failed\|FAILED"; then
            echo -e "${RED}❌ FAILED: $test_name${NC}"
            echo "Response: $response"
            echo ""
            return 1
        else
            echo -e "${GREEN}✅ PASSED: $test_name${NC}"
            echo "Response: $response" | head -5
            echo ""
            return 0
        fi
    else
        echo -e "${RED}❌ FAILED: $test_name (Command execution failed)${NC}"
        echo "Error: $response"
        echo ""
        return 1
    fi
}

# Function to extract token from login response
extract_token() {
    local response="$1"
    echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

echo -e "${BLUE}=== Authentication Tests ===${NC}"

# Test 1: Health Check
run_test "Health Check" \
    "curl -s -X GET \"$API_URL/health\"" \
    "200"

# Test 2: Login with valid credentials
echo -e "${YELLOW}Testing: User Login${NC}"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✅ PASSED: User Login${NC}"
    TOKEN=$(extract_token "$login_response")
    echo "Token extracted: ${TOKEN:0:20}..."
    echo ""
else
    echo -e "${RED}❌ FAILED: User Login${NC}"
    echo "Response: $login_response"
    echo ""
    exit 1
fi

# Test 3: Verify token
run_test "Token Verification" \
    "curl -s -X GET \"$API_URL/auth/verify\" \
        -H \"Authorization: Bearer $TOKEN\"" \
    "200"

# Test 4: Get current user info
run_test "Get Current User (/auth/me)" \
    "curl -s -X GET \"$API_URL/auth/me\" \
        -H \"Authorization: Bearer $TOKEN\"" \
    "200"

echo -e "${BLUE}=== User Profile Tests ===${NC}"

# Test 5: Get user profile
run_test "Get User Profile" \
    "curl -s -X GET \"$API_URL/auth/profile\" \
        -H \"Authorization: Bearer $TOKEN\"" \
    "200"

# Test 6: Update user profile
run_test "Update User Profile" \
    "curl -s -X PUT \"$API_URL/auth/profile\" \
        -H \"Authorization: Bearer $TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"name\": \"Isaac Mineo\",
            \"about_me\": \"Nutrition enthusiast focused on healthy eating and fitness goals. Prefer Mediterranean and Asian cuisines.\"
        }'" \
    "200"

# Test 7: Verify profile update
echo -e "${YELLOW}Testing: Verify Profile Update${NC}"
profile_response=$(curl -s -X GET "$API_URL/auth/profile" \
    -H "Authorization: Bearer $TOKEN")

if echo "$profile_response" | grep -q "Isaac Mineo"; then
    echo -e "${GREEN}✅ PASSED: Profile Update Verification${NC}"
    echo "Profile contains updated name"
    echo ""
else
    echo -e "${RED}❌ FAILED: Profile Update Verification${NC}"
    echo "Response: $profile_response"
    echo ""
fi

echo -e "${BLUE}=== Authentication Error Tests ===${NC}"

# Test 8: Access protected endpoint without token
run_test "Protected Endpoint Without Token (Should Fail)" \
    "curl -s -X GET \"$API_URL/auth/me\"" \
    "401"

# Test 9: Access protected endpoint with invalid token
run_test "Protected Endpoint With Invalid Token (Should Fail)" \
    "curl -s -X GET \"$API_URL/auth/me\" \
        -H \"Authorization: Bearer invalid_token_here\"" \
    "401"

# Test 10: Login with invalid credentials
run_test "Login With Invalid Credentials (Should Fail)" \
    "curl -s -X POST \"$API_URL/auth/login\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"email\": \"invalid@email.com\",
            \"password\": \"wrongpassword\"
        }'" \
    "401"

echo -e "${BLUE}=== Summary ===${NC}"
echo "Authentication and User Profile endpoint tests completed."
echo "Token for subsequent tests: ${TOKEN:0:20}..."
echo ""
echo "Next: Run test_endpoints_core.sh with this token"
echo "export API_TOKEN=\"$TOKEN\""
