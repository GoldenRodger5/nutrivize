# Nutrivize API Testing Guide

This document provides instructions for testing the Nutrivize API endpoints.

## Prerequisites

- Make sure the API server is running at http://localhost:5001
- `jq` command-line JSON processor is required (install with `brew install jq` on macOS)
- Valid test user credentials (provided below)

## Test Scripts

The following test scripts are available:

1. **Basic Tests** (No authentication required)
   ```
   ./test_basic.sh
   ```
   Tests basic endpoints like the root endpoint, database status, ping, and debug endpoints.

2. **Authentication Tests**
   ```
   ./test_auth_with_credentials.sh test@example.com testpassword123
   ```
   Tests authentication and basic user-related endpoints.

3. **Foods and Goals Tests**
   ```
   ./test_foods_goals_with_auth.sh test@example.com testpassword123
   ```
   Tests food items and goal management endpoints.

## Test Credentials

- Email: `test@example.com`
- Password: `testpassword123`

## Running Tests

1. Make scripts executable:
   ```
   chmod +x test_basic.sh test_auth_with_credentials.sh test_foods_goals_with_auth.sh
   ```

2. Run in sequence:
   ```
   ./test_basic.sh
   ./test_auth_with_credentials.sh test@example.com testpassword123
   ./test_foods_goals_with_auth.sh test@example.com testpassword123
   ```

## Troubleshooting

- If you get authentication errors, make sure the test user exists in Firebase
- If endpoints return 404, make sure the API server is running and available at http://localhost:5001
- For API errors, check the server logs for more detailed information 