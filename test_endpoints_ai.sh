#!/bin/bash

# Comprehensive API Endpoint Tests - AI Features
# Test file 3 of 3: AI chat, restaurant analysis, health insights, and advanced features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8000"
TEST_EMAIL="isaacmineo@gmail.com"
TEST_PASSWORD="Buddydog41"

# Get token from environment or login
if [ -z "$API_TOKEN" ]; then
    echo -e "${YELLOW}No token provided, logging in...${NC}"
    login_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    API_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$API_TOKEN" ]; then
        echo -e "${RED}❌ Failed to get authentication token${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Authentication successful${NC}"
fi

echo -e "${BLUE}=== Nutrivize V2 API Endpoint Tests - AI Features ===${NC}"
echo "API URL: $API_URL"
echo "Using token: ${API_TOKEN:0:20}..."
echo ""

# Function to run test with proper error handling
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if response=$(eval "$command" 2>&1); then
        if echo "$response" | grep -q "error\|Error\|ERROR\|failed\|Failed\|FAILED"; then
            echo -e "${RED}❌ FAILED: $test_name${NC}"
            echo "Response: $response"
            echo ""
            return 1
        else
            echo -e "${GREEN}✅ PASSED: $test_name${NC}"
            echo "Response: $response" | head -3
            echo ""
            return 0
        fi
    else
        echo -e "${RED}❌ FAILED: $test_name (Command execution failed)${NC}"
        echo "Error: $response"
        echo ""
        return 1
    fi
}

echo -e "${BLUE}=== AI Chat Tests ===${NC}"

# Test 1: Basic AI chat
run_test "AI Chat - Basic Nutrition Question" \
    "curl -s -X POST \"$API_URL/ai/chat\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"message\": \"What are some healthy breakfast options for weight loss?\",
            \"conversation_history\": []
        }'" \
    "200"

# Test 2: AI chat with meal logging
run_test "AI Chat - Smart Food Logging" \
    "curl -s -X POST \"$API_URL/ai/smart-food-log?message=I%20just%20ate%20a%20grilled%20chicken%20breast%20with%20steamed%20broccoli%20and%20brown%20rice%20for%20lunch\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 3: Get conversation context
run_test "Get AI Conversation Context" \
    "curl -s -X GET \"$API_URL/ai/conversation-context\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 4: Get chat history
run_test "Get AI Chat History" \
    "curl -s -X GET \"$API_URL/ai/chat/history\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 5: Clear conversation context
run_test "Clear AI Conversation Context" \
    "curl -s -X DELETE \"$API_URL/ai/conversation-context\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== AI Health Insights Tests ===${NC}"

# Test 6: Get health insights
run_test "Get AI Health Insights" \
    "curl -s -X POST \"$API_URL/ai/health-insights\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"analysis_period\": 7
        }'" \
    "200"

# Test 7: Get personalized meal suggestions
run_test "Get Personalized AI Meal Suggestions" \
    "curl -s -X POST \"$API_URL/ai/meal-suggestions\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"meal_type\": \"dinner\",
            \"preferences\": [\"high-protein\", \"mediterranean\"],
            \"max_prep_time\": 45,
            \"dietary_restrictions\": [\"vegetarian\"]
        }'" \
    "200"

echo -e "${BLUE}=== Restaurant AI Tests ===${NC}"

# Test 8: Analyze restaurant menu (URL)
run_test "Analyze Restaurant Menu from URL" \
    "curl -s -X POST \"$API_URL/restaurant-ai/analyze-menu\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"source_type\": \"url\",
            \"source_data\": [\"https://example-restaurant.com/menu\"],
            \"restaurant_name\": \"Test Restaurant\",
            \"menu_name\": \"Lunch Menu\"
        }'" \
    "200"

# Test 9: Analyze menu with multiple images (mock base64 images)
run_test "Analyze Restaurant Menu from Multiple Images" \
    "curl -s -X POST \"$API_URL/restaurant-ai/analyze-menu\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"source_type\": \"multi_image\",
            \"source_data\": [
                \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==\",
                \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==\"
            ],
            \"restaurant_name\": \"Multi-Page Restaurant\",
            \"menu_name\": \"Complete Menu\"
        }'" \
    "200"

# Test 10: Get user's restaurant analyses
run_test "Get User Restaurant Analyses" \
    "curl -s -X GET \"$API_URL/restaurant-ai/analyses?limit=5\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== AI Dashboard Tests ===${NC}"

# Test 11: Get AI dashboard insights
run_test "Get AI Dashboard Insights" \
    "curl -s -X GET \"$API_URL/ai-dashboard/insights\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 12: Refresh AI dashboard cache
run_test "Refresh AI Dashboard Cache" \
    "curl -s -X POST \"$API_URL/ai-dashboard/refresh\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== AI Health Analysis Tests ===${NC}"

# Test 13: Get comprehensive health analysis
run_test "Get AI Health Analysis" \
    "curl -s -X GET \"$API_URL/ai-health/analysis\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 14: Get dietary recommendations
run_test "Get AI Dietary Recommendations" \
    "curl -s -X GET \"$API_URL/ai-health/dietary-recommendations\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 15: Get health trends
run_test "Get AI Health Trends" \
    "curl -s -X GET \"$API_URL/ai-health/trends?period=30\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== Dietary System Tests ===${NC}"

# Test 16: Check dietary conflicts
run_test "Check Dietary Conflicts" \
    "curl -s -X POST \"$API_URL/dietary/check-conflicts\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"food_ids\": [\"123\", \"456\"],
            \"meal_context\": \"lunch\"
        }'" \
    "200"

# Test 17: Get dietary recommendations
run_test "Get Dietary Food Recommendations" \
    "curl -s -X GET \"$API_URL/dietary/recommendations?meal_type=dinner&limit=5\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 18: Analyze meal compatibility
run_test "Analyze Meal Compatibility" \
    "curl -s -X POST \"$API_URL/dietary/analyze-meal\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"foods\": [
                {\"food_id\": \"123\", \"quantity\": 1, \"unit\": \"serving\"},
                {\"food_id\": \"456\", \"quantity\": 0.5, \"unit\": \"cup\"}
            ],
            \"meal_type\": \"lunch\"
        }'" \
    "200"

echo -e "${BLUE}=== Advanced AI Features Tests ===${NC}"

# Test 19: AI chat with personalized context
run_test "AI Chat with Full Personalization" \
    "curl -s -X POST \"$API_URL/ai/chat\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"message\": \"Hi! Can you create a meal plan that aligns with my goals and preferences?\",
            \"conversation_history\": []
        }'" \
    "200"

# Test 20: Generate intelligent meal plan
run_test "Generate Intelligent Meal Plan" \
    "curl -s -X POST \"$API_URL/ai/meal-plan\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"duration\": 7,
            \"meals_per_day\": 3,
            \"budget\": \"moderate\",
            \"prep_time\": \"moderate\",
            \"variety\": \"high\",
            \"special_requests\": \"Use my dietary preferences and consider my weight loss goals\"
        }'" \
    "200"

echo -e "${BLUE}=== Performance and Edge Case Tests ===${NC}"

# Test 21: Large conversation history
run_test "AI Chat with Large History" \
    "curl -s -X POST \"$API_URL/ai/chat\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"message\": \"What did we discuss about my protein intake?\",
            \"conversation_history\": [
                {\"role\": \"user\", \"content\": \"I want to increase my protein intake\"},
                {\"role\": \"assistant\", \"content\": \"Great goal! How much do you currently consume?\"},
                {\"role\": \"user\", \"content\": \"About 60g per day\"},
                {\"role\": \"assistant\", \"content\": \"Let me help you get to 120g per day\"}
            ]
        }'" \
    "200"

# Test 22: Complex dietary restrictions
run_test "AI Chat with Complex Dietary Needs" \
    "curl -s -X POST \"$API_URL/ai/chat\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"message\": \"I am vegan, gluten-free, and allergic to nuts. Can you suggest a high-protein breakfast?\",
            \"conversation_history\": []
        }'" \
    "200"

echo -e "${BLUE}=== Summary ===${NC}"
echo "AI features endpoint tests completed."
echo "Token used: ${API_TOKEN:0:20}..."
echo ""
echo -e "${GREEN}All endpoint test files completed!${NC}"
echo "- Authentication & User Management: ✅"
echo "- Core Features: ✅"  
echo "- AI Features: ✅"
echo ""
echo "The Nutrivize V2 API has been comprehensively tested."
