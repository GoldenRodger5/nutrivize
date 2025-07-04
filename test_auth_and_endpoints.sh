#!/bin/bash

# Script to test authentication and endpoints
echo "Testing authentication and endpoints..."

# Step 1: Get authentication token
echo "Getting authentication token..."
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "isaacmineo@gmail.com",
    "password": "Buddydog41"
  }')

# Extract token from response
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $AUTH_RESPONSE"
  exit 1
else
  echo "✅ Successfully obtained authentication token"
fi

# Step 2: Test the endpoints with token
echo ""
echo "Testing health endpoint..."
curl -s "http://localhost:8000/health" | jq .

echo ""
echo "Testing the new health score endpoint..."
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/ai-health/user-health-score" | jq .

echo ""
echo "Testing the old health score endpoint (for backward compatibility)..."
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/ai-health/health-score" | jq .

echo ""
echo "Testing meal planning endpoints..."
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/meal-planning/plans?limit=1" | jq .

echo ""
echo "Tests completed!"
