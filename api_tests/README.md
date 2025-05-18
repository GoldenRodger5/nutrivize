# Nutrivize API Testing Scripts

This directory contains scripts for testing the Nutrivize backend API endpoints using curl commands.

## Prerequisites

Before running these tests, ensure you have:

1. The FastAPI backend server running on port 5001
2. `jq` installed for JSON processing (install with `brew install jq` on macOS)
3. A test user available in the system (default: test@example.com/testpassword123)

## Test Scripts

### 1. General API Test (`test_api.sh`)

This script tests all major API endpoints in sequence:

```bash
./test_api.sh
```

It covers authentication, food management, logs, goals, meal planning, health data, and user preferences.

### 2. Authentication Test (`test_auth_api.sh`)

This script specifically tests the authentication endpoints:

```bash
./test_auth_api.sh
```

It tests login, token verification, invalid credentials, missing fields, and expired tokens.

### 3. Food & Logs Test (`test_food_logs_api.sh`)

This script focuses on food and food log endpoints:

```bash
./test_food_logs_api.sh
```

It tests creating, reading, updating, and deleting food items and log entries.

## Customizing Tests

You can modify the following variables in the scripts to suit your testing environment:

- `BASE_URL`: The base URL of your API (default: http://127.0.0.1:5001)
- Test user credentials in the login function

## Creating Additional Tests

To create tests for additional endpoints, follow this pattern:

1. Define a test function for each endpoint
2. Use curl to make the request
3. Parse the response with jq
4. Validate the response and return success/failure

Example test function:

```bash
test_endpoint() {
  echo -e "\n${YELLOW}Testing Endpoint${NC}"
  echo "----------------------------------------"
  
  local response=$(curl -s -X GET "${BASE_URL}/endpoint" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  
  # Validate the response
  local success=$(echo "$response" | jq -r '.success')
  
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ Success${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed${NC}"
    return 1
  fi
}
```

## Test Results

See the `api_testing_summary.md` file in the parent directory for a summary of test results. 