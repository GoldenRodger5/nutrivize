#!/bin/bash

# Comprehensive API Endpoint Tests - Core Features
# Test file 2 of 3: Food management, logging, preferences, and meal planning

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

echo -e "${BLUE}=== Nutrivize V2 API Endpoint Tests - Core Features ===${NC}"
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

echo -e "${BLUE}=== Food Management Tests ===${NC}"

# Test 1: Search foods
run_test "Search Foods - 'chicken'" \
    "curl -s -X GET \"$API_URL/foods/search?q=chicken&limit=5\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 2: Get food by ID (using a common food ID)
run_test "Get Food Details" \
    "curl -s -X GET \"$API_URL/foods/123\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 3: Get food recommendations
run_test "Get Food Recommendations" \
    "curl -s -X GET \"$API_URL/foods/recommendations?limit=5\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== User Preferences Tests ===${NC}"

# Test 4: Get user preferences
run_test "Get User Preferences" \
    "curl -s -X GET \"$API_URL/preferences\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 5: Update dietary preferences
run_test "Update Dietary Preferences" \
    "curl -s -X PUT \"$API_URL/preferences\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"dietary\": {
                \"dietary_restrictions\": [\"vegetarian\"],
                \"allergens\": [\"nuts\"],
                \"disliked_foods\": [\"mushrooms\"],
                \"preferred_cuisines\": [\"mediterranean\", \"asian\"],
                \"cooking_skill_level\": \"intermediate\",
                \"max_prep_time\": 45,
                \"budget_preference\": \"moderate\"
            }
        }'" \
    "200"

# Test 6: Update nutrition preferences
run_test "Update Nutrition Preferences" \
    "curl -s -X PUT \"$API_URL/preferences\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"nutrition\": {
                \"calorie_goal\": 2000,
                \"protein_goal\": 150,
                \"carb_goal\": 250,
                \"fat_goal\": 65,
                \"fiber_goal\": 30,
                \"meal_frequency\": 3,
                \"snack_frequency\": 2
            }
        }'" \
    "200"

echo -e "${BLUE}=== Food Logging Tests ===${NC}"

# Test 7: Create food log entry
run_test "Create Food Log Entry" \
    "curl -s -X POST \"$API_URL/food-logs\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"food_id\": \"123\",
            \"quantity\": 1,
            \"unit\": \"serving\",
            \"meal_type\": \"lunch\",
            \"date\": \"$(date +%Y-%m-%d)\"
        }'" \
    "200"

# Test 8: Get user food logs
run_test "Get User Food Logs (Today)" \
    "curl -s -X GET \"$API_URL/food-logs?date=$(date +%Y-%m-%d)\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 9: Get nutrition summary
run_test "Get Nutrition Summary (Today)" \
    "curl -s -X GET \"$API_URL/food-logs/summary?date=$(date +%Y-%m-%d)\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== Goals and Analytics Tests ===${NC}"

# Test 10: Get user goals
run_test "Get User Goals" \
    "curl -s -X GET \"$API_URL/goals\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

# Test 11: Create a new goal
run_test "Create Weight Loss Goal" \
    "curl -s -X POST \"$API_URL/goals\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"type\": \"weight_loss\",
            \"target_value\": 10,
            \"target_date\": \"$(date -v+3m +%Y-%m-%d)\",
            \"description\": \"Lose 10 pounds in 3 months\"
        }'" \
    "200"

# Test 12: Get analytics insights
run_test "Get Analytics Insights" \
    "curl -s -X GET \"$API_URL/analytics/insights\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== Weight and Water Logging Tests ===${NC}"

# Test 13: Log weight
run_test "Log Weight Entry" \
    "curl -s -X POST \"$API_URL/weight-logs\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"weight\": 150.5,
            \"unit\": \"lbs\",
            \"date\": \"$(date -I)\"
        }'" \
    "200"

# Test 14: Log water intake
run_test "Log Water Intake" \
    "curl -s -X POST \"$API_URL/water-logs\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"amount\": 8,
            \"unit\": \"oz\",
            \"date\": \"$(date -I)\"
        }'" \
    "200"

# Test 15: Get weight logs
run_test "Get Weight Logs" \
    "curl -s -X GET \"$API_URL/weight-logs?limit=10\" \
        -H \"Authorization: Bearer $API_TOKEN\"" \
    "200"

echo -e "${BLUE}=== Meal Planning Tests ===${NC}"

# Test 16: Get meal suggestions
run_test "Get Meal Suggestions" \
    "curl -s -X POST \"$API_URL/ai/meal-suggestions\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"meal_type\": \"lunch\",
            \"preferences\": [\"healthy\", \"quick\"],
            \"max_prep_time\": 30
        }'" \
    "200"

# Test 17: Generate meal plan
run_test "Generate 3-Day Meal Plan" \
    "curl -s -X POST \"$API_URL/ai/meal-plan\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"duration\": 3,
            \"meals_per_day\": 3,
            \"budget\": \"moderate\",
            \"prep_time\": \"moderate\",
            \"variety\": \"high\",
            \"special_requests\": \"Focus on high protein meals\"
        }'" \
    "200"

echo -e "${BLUE}=== Nutrition Label Tests ===${NC}"

# Test 18: Analyze nutrition label
run_test "Analyze Nutrition Label (Mock Image)" \
    "curl -s -X POST \"$API_URL/nutrition-labels/analyze\" \
        -H \"Authorization: Bearer $API_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{
            \"image_base64\": \"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==\",
            \"image_type\": \"png\"
        }'" \
    "200"

echo -e "${BLUE}=== Summary ===${NC}"
echo "Core features endpoint tests completed."
echo "Token used: ${API_TOKEN:0:20}..."
echo ""
echo "Next: Run test_endpoints_ai.sh with this token"
echo "export API_TOKEN=\"$API_TOKEN\""
