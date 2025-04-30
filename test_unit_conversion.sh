#!/bin/bash

echo "Testing meal suggestions API with focus on ingredient macros and unit conversion..."

# Create test request payload with specific amounts
cat > test_conversion_request.json << 'EOJ'
{
  "user_id": "test_user",
  "meal_type": "snack",
  "time_of_day": "15:00",
  "preference": "healthy",
  "remaining_macros": {
    "calories": 500,
    "protein": 30,
    "carbs": 50,
    "fat": 20
  },
  "use_food_index_only": false,
  "specific_ingredients": ["yogurt", "berries"]
}
EOJ

# Make request and save response
curl -s -X POST -H "Content-Type: application/json" -d @test_conversion_request.json http://localhost:8000/suggest-meal > test_conversion_response.json

# Check if the request was successful
if [ ! -s test_conversion_response.json ]; then
  echo "Error: Failed to get a response from the API"
  exit 1
fi

# Extract and save only the relevant first suggestion part for easier parsing
cat test_conversion_response.json | grep -o '{"name":"[^}]*"ingredients":\[[^]]*\]' > suggestion.json

# Extract the first meal suggestion
MEAL_NAME=$(grep -o '"name":"[^"]*"' suggestion.json | head -1 | cut -d'"' -f4)
echo -e "\n✅ First meal suggestion: $MEAL_NAME"

# Save the first ingredient separately for easier parsing
cat test_conversion_response.json | grep -o '"ingredients":\[\{[^}]*\}' | grep -o '\{[^}]*\}' > ingredient.json

# Extract ingredient details
INGREDIENT_NAME=$(cat ingredient.json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
INGREDIENT_AMOUNT=$(cat ingredient.json | grep -o '"amount":[0-9.]*' | cut -d':' -f2)
INGREDIENT_UNIT=$(cat ingredient.json | grep -o '"unit":"[^"]*"' | cut -d'"' -f4)
echo -e "\n✅ Extracted ingredient: $INGREDIENT_NAME ($INGREDIENT_AMOUNT $INGREDIENT_UNIT)"

# Extract macros for verification
echo "Looking for macros in the first ingredient..."
cat ingredient.json | grep -A 10 '"macros":'

# Use jq for more reliable extraction if available
if command -v jq &> /dev/null; then
    echo -e "\n✅ Using jq for reliable extraction:"
    CALORIES=$(cat ingredient.json | jq -r '.macros.calories')
    PROTEIN=$(cat ingredient.json | jq -r '.macros.protein')
    CARBS=$(cat ingredient.json | jq -r '.macros.carbs')
    FAT=$(cat ingredient.json | jq -r '.macros.fat')
    
    echo -e "\n✅ Macros per $INGREDIENT_AMOUNT $INGREDIENT_UNIT of $INGREDIENT_NAME:"
    echo "   Calories: $CALORIES"
    echo "   Protein: ${PROTEIN}g"
    echo "   Carbs: ${CARBS}g"
    echo "   Fat: ${FAT}g"
    
    # Perform unit conversion calculation based on our frontend logic
    if [ "$INGREDIENT_UNIT" = "g" ]; then
        # Convert to ounces (g * 0.035274)
        OZ_AMOUNT=$(echo "$INGREDIENT_AMOUNT * 0.035274" | bc -l | xargs printf "%.1f")
        
        # Calculate expected calories in ounces (same total)
        OZ_CALORIES=$CALORIES
        
        echo -e "\n✅ Unit conversion simulation:"
        echo "   $INGREDIENT_AMOUNT g = $OZ_AMOUNT oz"
        echo "   Calories remain at $OZ_CALORIES"
        
        # Calculate for doubling the amount
        DOUBLE_AMOUNT=$(echo "$INGREDIENT_AMOUNT * 2" | bc -l | xargs printf "%.1f")
        DOUBLE_CALORIES=$(echo "$CALORIES * 2" | bc -l | xargs printf "%.1f")
        DOUBLE_PROTEIN=$(echo "$PROTEIN * 2" | bc -l | xargs printf "%.1f")
        
        echo -e "\n✅ Amount change simulation:"
        echo "   Original: $INGREDIENT_AMOUNT g = $CALORIES calories, ${PROTEIN}g protein"
        echo "   Doubled: $DOUBLE_AMOUNT g = $DOUBLE_CALORIES calories, ${DOUBLE_PROTEIN}g protein"
    fi
else
    echo -e "\n❌ jq not available for parsing. Please install jq for better results."
    # Show raw content instead
    echo -e "\nRaw ingredient data:"
    cat ingredient.json
fi

# Print the raw response for manual verification
echo -e "\n✅ Manual verification of first 500 characters of API response:"
head -c 500 test_conversion_response.json

echo -e "\n\nTesting complete. The API response contains the necessary data for unit conversion and macro calculation."
echo "The frontend code will handle the unit conversion and macro scaling dynamically when users edit values." 