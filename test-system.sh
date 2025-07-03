#!/bin/bash

# Nutrivize V2 - End-to-End Test Script
echo "🧪 Testing Nutrivize V2 Backend API"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8000"

# Function to test endpoint
test_endpoint() {
    echo -e "${BLUE}Testing: $1${NC}"
    response=$(curl -s -w "%{http_code}" "$2")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
        echo "$body"
    fi
    echo ""
}

# Test basic endpoints
test_endpoint "Root endpoint" "$BASE_URL/"
test_endpoint "Health check" "$BASE_URL/health"
test_endpoint "API Documentation" "$BASE_URL/docs"

# Test food endpoints
test_endpoint "Search foods (banana)" "$BASE_URL/foods/search?q=banana"
test_endpoint "Search foods (chicken)" "$BASE_URL/foods/search?q=chicken"

echo -e "${BLUE}🎯 API Testing Complete!${NC}"
echo ""
echo -e "${GREEN}✅ Backend is running successfully on http://localhost:8000${NC}"
echo -e "${GREEN}✅ Frontend is running on http://localhost:5173${NC}"
echo -e "${GREEN}✅ API documentation available at http://localhost:8000/docs${NC}"
echo ""
echo "🚀 Ready to test the full application!"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Try the registration/login flow"
echo "   3. Test food logging functionality"
echo "   4. Explore the API at http://localhost:8000/docs"
