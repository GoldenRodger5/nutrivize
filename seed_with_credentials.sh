#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get user email and credentials from command line or use defaults
EMAIL=${1:-"IsaacMineo@gmail.com"}
PASSWORD=${2:-"Buddydog41"}

# Project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"

echo -e "${BLUE}Seeding database with mock data for user: ${EMAIL}${NC}"

# First, register the user through the API to ensure they exist
echo -e "${BLUE}Registering user if not exists...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:5001/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Isaac Mineo",
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')

# Get the UID from the response - either registration or login
if echo "$REGISTER_RESPONSE" | grep -q "uid"; then
  USER_UID=$(echo "$REGISTER_RESPONSE" | grep -o '"uid":"[^"]*' | sed 's/"uid":"//')
  echo -e "${GREEN}User registered successfully. UID: $USER_UID${NC}"
else
  echo -e "${YELLOW}User might already exist, attempting login...${NC}"
  # If registration failed, try logging in
  LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5001/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'"$EMAIL"'",
      "password": "'"$PASSWORD"'"
    }')

  if echo "$LOGIN_RESPONSE" | grep -q "uid"; then
    USER_UID=$(echo "$LOGIN_RESPONSE" | grep -o '"uid":"[^"]*' | sed 's/"uid":"//')
    echo -e "${GREEN}User logged in successfully. UID: $USER_UID${NC}"
  else
    echo -e "${RED}Failed to authenticate user. Response: $LOGIN_RESPONSE${NC}"
    exit 1
  fi
fi

# Seed the database directly with the user's ID
echo -e "${BLUE}Seeding database with mock data for authenticated user: $USER_UID...${NC}"
cd "$BACKEND_DIR" || exit
PYTHONPATH=$BACKEND_DIR python -c "from app.seed_mock_data import seed_for_user; seed_for_user('$USER_UID')"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Database seeded successfully for user: $EMAIL (UID: $USER_UID)${NC}"
  echo -e "${GREEN}You can now log in with these credentials to see the mock data.${NC}"
else
  echo -e "${RED}Failed to seed database.${NC}"
  exit 1
fi 