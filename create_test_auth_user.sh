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

echo -e "${BLUE}Creating authenticated test user directly in the database${NC}"

# Create an authenticated test user directly in MongoDB and seed data for it
cd "$BACKEND_DIR" || exit

# Define the Python code to create a test user
PYTHON_CODE=$(cat <<'EOF'
import os
import sys
from datetime import datetime
from firebase_admin import auth
from app.database import get_database
from app.seed_mock_data import seed_for_user

# The test user details
test_email = "test@example.com"
test_password = "testpassword123"
test_name = "Test User"

try:
    # Create user in Firebase (or get existing)
    try:
        # Check if user already exists
        user = auth.get_user_by_email(test_email)
        print(f"User already exists in Firebase with UID: {user.uid}")
    except:
        # Create new user
        user = auth.create_user(
            email=test_email,
            password=test_password,
            display_name=test_name
        )
        print(f"Created new user in Firebase with UID: {user.uid}")
    
    # Ensure user exists in our MongoDB database
    db = get_database()
    existing_user = db.users.find_one({"uid": user.uid})
    
    if not existing_user:
        # Create user in our database
        new_user = {
            "uid": user.uid,
            "email": test_email,
            "name": test_name,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "preferences": {
                "units": "metric",
                "theme": "light"
            }
        }
        db.users.insert_one(new_user)
        print(f"Created new user in MongoDB with UID: {user.uid}")
    else:
        print(f"User already exists in MongoDB with UID: {user.uid}")
    
    # Seed data for this user
    seed_for_user(user.uid)
    
    print(f"\nTest user created and data seeded successfully!")
    print(f"Email: {test_email}")
    print(f"Password: {test_password}")
    print(f"User ID: {user.uid}")
    
except Exception as e:
    print(f"Error creating test user: {str(e)}")
    sys.exit(1)
EOF
)

# Execute the Python code
PYTHONPATH=$BACKEND_DIR python -c "$PYTHON_CODE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test user created and data seeded successfully!${NC}"
  echo -e "${GREEN}You can now log in using the test user credentials.${NC}"
else
  echo -e "${RED}Failed to create test user.${NC}"
  exit 1
fi 