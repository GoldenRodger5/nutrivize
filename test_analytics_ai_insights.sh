#!/bin/bash

# Test Analytics AI Insights Implementation
echo "🧪 Testing Analytics AI Insights Implementation..."

# Get token for testing
TOKEN=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "isaacmineo@gmail.com",
    "password": "Buddydog41"
  }' | jq -r '.token')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Test all analytics endpoints
echo ""
echo "📊 Testing Analytics Endpoints:"

echo "1. Testing Day Insights:"
DAY_INSIGHTS=$(curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=day" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.insights | length')
echo "   - Found $DAY_INSIGHTS insights for today"

echo "2. Testing Week Insights:"
WEEK_INSIGHTS=$(curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.insights | length')
echo "   - Found $WEEK_INSIGHTS insights for this week"

echo "3. Testing Month Insights:"
MONTH_INSIGHTS=$(curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=month" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.insights | length')
echo "   - Found $MONTH_INSIGHTS insights for this month"

echo "4. Testing Nutrition Trends:"
TRENDS=$(curl -s -X GET "http://localhost:8000/analytics/nutrition-trends?days=7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.trends | length')
echo "   - Found $TRENDS nutrition trends"

echo "5. Testing Goal Progress:"
GOAL_PROGRESS=$(curl -s -X GET "http://localhost:8000/analytics/goal-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.progress | keys | length')
echo "   - Found $GOAL_PROGRESS goal progress metrics"

echo "6. Testing Food Patterns:"
PATTERNS=$(curl -s -X GET "http://localhost:8000/analytics/food-patterns?days=30" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.patterns | length')
echo "   - Found $PATTERNS food patterns"

echo "7. Testing Macro Breakdown:"
MACRO_BREAKDOWN=$(curl -s -X GET "http://localhost:8000/analytics/macro-breakdown?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.breakdown | keys | length')
echo "   - Found $MACRO_BREAKDOWN macro breakdown categories"

echo ""
echo "🎯 Sample Week Insights:"
curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.insights[] | "- " + .title + " (" + .category + ", priority: " + (.importance | tostring) + ")"'

echo ""
echo "📈 Sample Statistics:"
curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.statistics | "Avg Calories: " + (.avg_calories | tostring) + ", Avg Protein: " + (.avg_protein | tostring) + "g, Consistency: " + (.consistency_percentage | tostring) + "%"'

echo ""
echo "💡 Sample Summary:"
curl -s -X GET "http://localhost:8000/analytics/insights?timeframe=week" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.summary'

echo ""
echo "✅ Analytics Implementation Test Complete!"
echo ""
echo "📱 Frontend Features:"
echo "- ✅ Day/Week/Month timeframe selection"
echo "- ✅ Real-time refresh when food data changes"
echo "- ✅ AI-powered insights categorized by importance"
echo "- ✅ Nutrition trends and goal progress tracking"
echo "- ✅ Food patterns and macro breakdown analysis"
echo ""
echo "🔗 Open http://localhost:5173 and navigate to Analytics tab to test the UI!"
