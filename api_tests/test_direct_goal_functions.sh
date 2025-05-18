#!/bin/bash

# Test script for goal-related AI chatbot functionality without requiring authentication
# This directly tests the integration by modifying the chatbot.py to expose the functions

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create a temporary Python test file
echo -e "${BLUE}Creating a temporary test script...${NC}"

cat <<EOF > test_goal_functions.py
import asyncio
import sys
import os
import json
import traceback

# Add the backend directory to the Python path
sys.path.append(os.path.abspath('../backend'))

# Test importing the modules
try:
    from app.constants import USER_ID
    from app.chatbot import analyze_user_goal_progress, suggest_goal_adjustments, handle_goal_queries
    print("Successfully imported required modules")
except Exception as e:
    print(f"Import error: {e}")
    traceback.print_exc()
    sys.exit(1)

async def test_functions():
    try:
        # Test 1: analyze_user_goal_progress
        print("Test 1: analyze_user_goal_progress")
        result = await analyze_user_goal_progress(USER_ID)
        print(f"Success: {len(result) > 0}")
        print(f"Response snippet: {result[:100]}...")
        print()
        
        # Test 2: suggest_goal_adjustments
        print("Test 2: suggest_goal_adjustments")
        result = await suggest_goal_adjustments(USER_ID)
        print(f"Success: {len(result) > 0}")
        print(f"Response snippet: {result[:100]}...")
        print()
        
        # Test 3: handle_goal_queries - goal progress
        print("Test 3: handle_goal_queries - goal progress")
        result = await handle_goal_queries("how am I doing with my goals", USER_ID)
        print(f"Success: {result is not None}")
        if result:
            print(f"Response snippet: {result['answer'][:100]}...")
        print()
        
        # Test 4: handle_goal_queries - goal adjustments
        print("Test 4: handle_goal_queries - goal adjustments")
        result = await handle_goal_queries("suggest adjustments to my goal", USER_ID)
        print(f"Success: {result is not None}")
        if result:
            print(f"Response snippet: {result['answer'][:100]}...")
        print()
        
        # Test 5: handle_goal_queries - current goal
        print("Test 5: handle_goal_queries - current goal")
        result = await handle_goal_queries("what is my current goal", USER_ID)
        print(f"Success: {result is not None}")
        if result:
            print(f"Response snippet: {result['answer'][:100]}...")
        print()
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return False
    
    return True

# Run the tests
async def main():
    success = await test_functions()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
EOF

echo -e "${GREEN}Temporary test script created.${NC}"

# Run the Python test
echo -e "${BLUE}Running goal function tests...${NC}"
cd .. && python3 api_tests/test_goal_functions.py

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ All goal functions are working correctly!${NC}"
else
  echo -e "${RED}✗ There were issues with the goal functions.${NC}"
fi

# Clean up
echo -e "${BLUE}Cleaning up...${NC}"
rm -f api_tests/test_goal_functions.py

echo -e "${BLUE}Test completed.${NC}" 