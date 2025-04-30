#!/bin/bash

# Set API URL
API_URL="http://localhost:5001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Nutrivize Chat Authentication and Data Isolation ===${NC}"

# Test user data with unique emails
USER1_NAME="Chat Test User 1"
USER1_EMAIL="chatuser1_$(date +%s)@example.com"
USER1_PASSWORD="password123"

USER2_NAME="Chat Test User 2"
USER2_EMAIL="chatuser2_$(date +%s)@example.com"
USER2_PASSWORD="password123"

# Variables to store tokens
USER1_TOKEN=""
USER2_TOKEN=""

# Register User 1
echo -e "\n${BLUE}=== Registering User 1 ===${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"$USER1_NAME"'",
    "email": "'"$USER1_EMAIL"'",
    "password": "'"$USER1_PASSWORD"'"
  }')

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}User 1 registered successfully${NC}"
  USER1_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  USER1_UID=$(echo "$REGISTER_RESPONSE" | grep -o '"uid":"[^"]*' | sed 's/"uid":"//')
  echo "User 1 UID: $USER1_UID"
else
  echo -e "${RED}Failed to register User 1${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# Register User 2
echo -e "\n${BLUE}=== Registering User 2 ===${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"$USER2_NAME"'",
    "email": "'"$USER2_EMAIL"'",
    "password": "'"$USER2_PASSWORD"'"
  }')

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}User 2 registered successfully${NC}"
  USER2_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  USER2_UID=$(echo "$REGISTER_RESPONSE" | grep -o '"uid":"[^"]*' | sed 's/"uid":"//')
  echo "User 2 UID: $USER2_UID"
else
  echo -e "${RED}Failed to register User 2${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# Create a food for User 1
echo -e "\n${BLUE}=== Creating food for User 1 ===${NC}"
FOOD_RESPONSE=$(curl -s -X POST "$API_URL/foods/" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User 1 Special Apple",
    "serving_size": 100,
    "serving_unit": "g",
    "calories": 52,
    "proteins": 0.3,
    "carbs": 14,
    "fats": 0.2,
    "fiber": 2.4
  }')

if echo "$FOOD_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}User 1 food created successfully${NC}"
else
  echo -e "${RED}Failed to create food for User 1${NC}"
  echo "$FOOD_RESPONSE"
fi

# Create a food for User 2
echo -e "\n${BLUE}=== Creating food for User 2 ===${NC}"
FOOD_RESPONSE=$(curl -s -X POST "$API_URL/foods/" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User 2 Special Banana",
    "serving_size": 120,
    "serving_unit": "g",
    "calories": 105,
    "proteins": 1.3,
    "carbs": 27,
    "fats": 0.4,
    "fiber": 3.1
  }')

if echo "$FOOD_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}User 2 food created successfully${NC}"
else
  echo -e "${RED}Failed to create food for User 2${NC}"
  echo "$FOOD_RESPONSE"
fi

# Test chat for User 1 asking about food database
echo -e "\n${BLUE}=== Testing chat for User 1 about food database ===${NC}"
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/chat" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What foods do I have in my database?"}
    ],
    "fetch_context": true
  }')

if echo "$CHAT_RESPONSE" | grep -q "User 1 Special Apple"; then
  echo -e "${GREEN}User 1 can see their own food database${NC}"
else
  echo -e "${RED}User 1 cannot see their own food database${NC}"
  echo "$CHAT_RESPONSE"
fi

# Check if User 1 can see User 2's food
if echo "$CHAT_RESPONSE" | grep -q "User 2 Special Banana"; then
  echo -e "${RED}Data isolation issue: User 1 can see User 2's food${NC}"
else
  echo -e "${GREEN}Data isolation working: User 1 cannot see User 2's food${NC}"
fi

# Test chat for User 2 asking about food database
echo -e "\n${BLUE}=== Testing chat for User 2 about food database ===${NC}"
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/chat" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What foods do I have in my database?"}
    ],
    "fetch_context": true
  }')

if echo "$CHAT_RESPONSE" | grep -q "User 2 Special Banana"; then
  echo -e "${GREEN}User 2 can see their own food database${NC}"
else
  echo -e "${RED}User 2 cannot see their own food database${NC}"
  echo "$CHAT_RESPONSE"
fi

# Check if User 2 can see User 1's food
if echo "$CHAT_RESPONSE" | grep -q "User 1 Special Apple"; then
  echo -e "${RED}Data isolation issue: User 2 can see User 1's food${NC}"
else
  echo -e "${GREEN}Data isolation working: User 2 cannot see User 1's food${NC}"
fi

echo -e "\n${BLUE}=== Chat Authentication and Data Isolation Testing Complete ===${NC}" 