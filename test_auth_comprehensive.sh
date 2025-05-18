#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set the API base URL
API_URL="http://localhost:5001"

# Test user credentials
VALID_EMAIL="testuser@example.com"
VALID_PASSWORD="password123"
INVALID_EMAIL="nonexistent@example.com"
INVALID_PASSWORD="wrongpassword"
NEW_USER_EMAIL="newuser$(date +%s)@example.com"
NEW_USER_PASSWORD="newuserpassword123"
NEW_USER_NAME="New Test User"

# Token storage
TOKEN=""
INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

# Function to check if a test passed
test_passed() {
  echo -e "${GREEN}✓ PASSED${NC}"
}

# Function to indicate a test failed
test_failed() {
  echo -e "${RED}✗ FAILED: $1${NC}"
}

# Function to run a test and report results
run_test() {
  TEST_NAME="$1"
  TEST_CMD="$2"
  EXPECTED_STATUS="$3"
  VALIDATION_CMD="$4"
  
  echo -e "\n${YELLOW}TEST: $TEST_NAME${NC}"
  
  # Create a temporary file for response headers
  HEADERS_TEMP=$(mktemp)
  RESPONSE_TEMP=$(mktemp)
  
  # Run the command and capture output and status code
  eval "$TEST_CMD -w \"%{http_code}\" -D \"$HEADERS_TEMP\" -o \"$RESPONSE_TEMP\"" 2>&1
  STATUS_CODE=$(cat "$RESPONSE_TEMP" | tail -n1)
  RESPONSE_BODY=$(cat "$RESPONSE_TEMP" | head -n -1)
  
  # Display output in a compact form
  echo "Status code: $STATUS_CODE"
  echo "Response: $(cat "$RESPONSE_TEMP" | head -n -1 | head -50)"
  
  # Check if status code matches expected
  if [ "$STATUS_CODE" == "$EXPECTED_STATUS" ]; then
    # If validation command provided, run it
    if [ ! -z "$VALIDATION_CMD" ]; then
      # Export the response body for use in the validation command
      export RESPONSE_BODY="$RESPONSE_TEMP"
      if eval "$VALIDATION_CMD"; then
        test_passed
      else
        test_failed "Validation failed"
      fi
    else
      test_passed
    fi
  else
    test_failed "Expected status $EXPECTED_STATUS, got $STATUS_CODE"
  fi
  
  # Clean up temporary files
  rm -f "$HEADERS_TEMP" "$RESPONSE_TEMP"
}

# Helper function to check if token was extracted
check_token() {
  # Debug check
  echo "Checking token: ${TOKEN:0:30}..."
  
  if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    return 0
  else
    return 1
  fi
}

# Start testing
echo -e "${BLUE}=== Comprehensive Authentication Testing ====${NC}"

# Test 1: API Health Check
run_test "API Health Check" \
  "curl -s $API_URL/" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q 'Nutrivize API is running'"

# Test 2: Login with valid credentials
run_test "Login with valid credentials" \
  "curl -s -X POST \"$API_URL/auth/login\" \
   -H \"Content-Type: application/json\" \
   -d '{\"email\":\"$VALID_EMAIL\",\"password\":\"$VALID_PASSWORD\"}'" \
  "200" \
  "TOKEN=\$(cat \$RESPONSE_BODY | grep -o '\"token\":\"[^\"]*\"' | sed 's/\"token\":\"//;s/\"//'); check_token"

echo "Obtained token: ${TOKEN:0:30}..."

# Test 3: Login with invalid email
run_test "Login with invalid email" \
  "curl -s -X POST \"$API_URL/auth/login\" \
   -H \"Content-Type: application/json\" \
   -d '{\"email\":\"$INVALID_EMAIL\",\"password\":\"$VALID_PASSWORD\"}'" \
  "401" \
  "cat \$RESPONSE_BODY | grep -q 'INVALID_LOGIN_CREDENTIALS'"

# Test 4: Login with invalid password
run_test "Login with invalid password" \
  "curl -s -X POST \"$API_URL/auth/login\" \
   -H \"Content-Type: application/json\" \
   -d '{\"email\":\"$VALID_EMAIL\",\"password\":\"$INVALID_PASSWORD\"}'" \
  "401" \
  "cat \$RESPONSE_BODY | grep -q 'INVALID_LOGIN_CREDENTIALS'"

# Test 5: Register new user (might fail if email is already registered)
run_test "Register new user" \
  "curl -s -X POST \"$API_URL/auth/register\" \
   -H \"Content-Type: application/json\" \
   -d '{\"email\":\"$NEW_USER_EMAIL\",\"password\":\"$NEW_USER_PASSWORD\",\"name\":\"$NEW_USER_NAME\"}'" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q '\"token\":\"' || cat \$RESPONSE_BODY | grep -q 'EMAIL_EXISTS'"

# Test 6: Access /auth/me with valid token
run_test "Access /auth/me with valid token" \
  "curl -s -X GET \"$API_URL/auth/me\" \
   -H \"Authorization: Bearer $TOKEN\"" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q '\"uid\":\"'"

# Test 7: Access /auth/me with invalid token
run_test "Access /auth/me with invalid token" \
  "curl -s -X GET \"$API_URL/auth/me\" \
   -H \"Authorization: Bearer $INVALID_TOKEN\"" \
  "401" \
  "cat \$RESPONSE_BODY | grep -q 'Invalid authentication credentials'"

# Test 8: Access /auth/me with no token
run_test "Access /auth/me with no token" \
  "curl -s -X GET \"$API_URL/auth/me\"" \
  "403" \
  "cat \$RESPONSE_BODY | grep -q 'Not authenticated'"

# Test 9: Access /user/profile with valid token
run_test "Access /user/profile with valid token" \
  "curl -s -X GET \"$API_URL/user/profile\" \
   -H \"Authorization: Bearer $TOKEN\"" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q '\"user_id\":\"' || cat \$RESPONSE_BODY | grep -q '\"id\":\"'"

# Test 10: Access /user/profile with invalid token
run_test "Access /user/profile with invalid token" \
  "curl -s -X GET \"$API_URL/user/profile\" \
   -H \"Authorization: Bearer $INVALID_TOKEN\"" \
  "401" \
  "cat \$RESPONSE_BODY | grep -q 'Invalid authentication credentials'"

# Test 11: Access /user/profile with no token
run_test "Access /user/profile with no token" \
  "curl -s -X GET \"$API_URL/user/profile\"" \
  "403" \
  "cat \$RESPONSE_BODY | grep -q 'Not authenticated'"

# Test 12: Access foods endpoint (may not require auth)
run_test "Access foods endpoint" \
  "curl -s -X GET \"$API_URL/foods/\"" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q '\"name\":\"'"

# Test 13: Access logs endpoint with valid token
USER_ID=$(echo "$TOKEN" | grep -o '"uid":"[^"]*"' | sed 's/"uid":"//;s/"//' 2>/dev/null || echo "myjWbS4ZVlXXM6iryS66gPqYhtz1")
CURRENT_DATE=$(date +%Y-%m-%d)
run_test "Access logs endpoint with valid token" \
  "curl -s -X GET \"$API_URL/logs?user_id=$USER_ID&date=$CURRENT_DATE\" \
   -H \"Authorization: Bearer $TOKEN\"" \
  "200" \
  "cat \$RESPONSE_BODY | grep -q '\"logs\":'"

echo -e "\n${BLUE}=== Authentication Testing Complete ====${NC}"
echo -e "\n${GREEN}All tests that PASSED indicate our authentication is working correctly.${NC}" 