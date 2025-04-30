#!/bin/bash

# Setup script for test user and test data

echo "=== Creating and seeding test user ==="
echo "This script will create a test user and add test data to your database"

# Make sure we're in the backend directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d "env" ]; then
    echo "Activating virtual environment..."
    source env/bin/activate
fi

# Run the create test user script
echo -e "\n=== Creating test user ==="
python -m create_test_user

# Check if the command was successful
if [ $? -ne 0 ]; then
    echo "Error creating test user. Check if MongoDB and Firebase are properly configured."
    echo "You can still use the test login credentials on the frontend:"
    echo "Email: test@example.com"
    echo "Password: testpassword123"
    exit 0
fi

# Run the data seeding script
echo -e "\n=== Seeding test data ==="
python -m seed_test_user_data

# Check if the command was successful
if [ $? -ne 0 ]; then
    echo "Error seeding test data. Check if MongoDB is properly configured."
else
    echo -e "\n=== Setup complete ==="
    echo "You can now log in with the test user on the frontend:"
    echo "Email: test@example.com"
    echo "Password: testpassword123"
fi 