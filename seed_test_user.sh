#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"

echo -e "${BLUE}Seeding database with mock data for test user${NC}"

# Seed the database with the test user ID from constants
cd "$BACKEND_DIR" || exit
PYTHONPATH=$BACKEND_DIR python -c "from app.seed_mock_data import seed_for_user; seed_for_user()"

if [ $? -eq 0 ]; then
  # Get the test user ID from constants to display it
  TEST_USER_ID=$(PYTHONPATH=$BACKEND_DIR python -c "from app.constants import TEST_USER_ID; print(TEST_USER_ID)")
  echo -e "${GREEN}Database seeded successfully for test user: $TEST_USER_ID${NC}"
  echo -e "${YELLOW}Note: This is for testing only. In production, use seed_with_credentials.sh to seed for an authenticated user.${NC}"
else
  echo -e "${RED}Failed to seed database.${NC}"
  exit 1
fi 