# Nutrivize API Improvements

This update enhances the Nutrivize backend API with improved resilience and meal diversity features, addressing issues with API reliability and meal variety.

## Key Improvements

### 1. API Resilience

- **Retry Logic with Exponential Backoff**: The API now automatically retries failed requests with exponential backoff, reducing failures during temporary network issues.
- **Robust Response Validation**: Enhanced JSON parsing with multiple fallback strategies to handle partial or malformed responses.
- **Fallback Meals**: If the AI service fails completely, the system now provides sensible fallback meals rather than returning errors.
- **Error Tracing**: Better error logging for easier debugging of API-related issues.

### 2. Meal Diversity

- **Diversity Tracking**: The system now tracks previously generated meals to ensure variety in future suggestions.
- **Ingredient Usage Analysis**: Tracks commonly used ingredients and encourages variety in meal components.
- **Cuisine Rotation**: Suggests different cuisines across meals to promote diversity.
- **Enhanced Prompt Engineering**: Modified AI prompts encourage more creative and diverse meal suggestions.
- **Cooking Method Variation**: Ensures different cooking methods are used across meal suggestions.

### 3. Technical Implementation Details

- **MealDiversityTracker**: New class tracks meal history and generates diversity constraints.
- **Improved Error Handling**: Multiple layers of error handling ensure the API always returns usable responses.
- **Response Structure Validation**: Validates all responses to ensure they match expected formats.
- **Module Organization**: Code has been restructured for easier maintenance and extensibility.

## Ingredient Macros Tracking

We've enhanced the meal suggestions API to provide nutrition information for individual ingredients in suggested meals.

### Changes:

1. Updated the `Ingredient` model to include:
   - `macros`: Nutritional breakdown (calories, protein, carbs, fat) for each ingredient
   - `needs_indexing`: A flag indicating if the user should add this ingredient to their food index for more precise tracking

2. Modified the AI prompt to instruct the LLM to:
   - Provide macros for each ingredient as precisely as possible
   - Use food index data for indexed ingredients
   - Provide estimated nutrition values for non-indexed ingredients
   - Set `needs_indexing: true` for ingredients that should be added to the user's food index

3. Updated the frontend to display:
   - Nutrition information per ingredient
   - Visual indicator for ingredients that need to be added to the food index

### Benefits:

- More precise tracking of individual ingredients
- Clearer user guidance on which foods to add to their index
- Better understanding of how each ingredient contributes to overall meal nutrition

### Example Response Format:

```json
{
  "name": "Greek Yogurt with Berries",
  "macros": {
    "protein": 15,
    "carbs": 20,
    "fat": 5,
    "calories": 180
  },
  "ingredients": [
    {
      "name": "Greek Yogurt", 
      "amount": 150, 
      "unit": "g", 
      "in_food_index": true, 
      "macros": {
        "protein": 12,
        "carbs": 5,
        "fat": 0,
        "calories": 80
      },
      "needs_indexing": false
    },
    {
      "name": "Mixed Berries", 
      "amount": 50, 
      "unit": "g", 
      "in_food_index": false, 
      "macros": {
        "protein": 0.5,
        "carbs": 5,
        "fat": 0,
        "calories": 30
      },
      "needs_indexing": true
    }
  ]
}
```

## Installation

1. Run the installation script:
   ```bash
   ./install_improved_api.sh
   ```

2. This will:
   - Install required dependencies
   - Create backups of the original files
   - Replace the existing implementation with the improved version
   - Create a restore script

3. Start the server with:
   ```bash
   cd backend && python -m app.main
   ```

4. To restore the original implementation:
   ```bash
   ./restore_original_api.sh
   ```

## Testing

Test scripts are included to verify the improvements:

- `test_improved_curl.sh`: Tests the improved API endpoints and verifies diversity and resilience.
- `test_direct_curl.sh`: Tests the original API for comparison.

## Results

The improved API shows:
- 100% success rate for meal suggestions (no more "Error parsing response")
- Significantly improved meal diversity between requests
- Consistent response structure even during API failures
- More varied cuisines and cooking methods across suggestions 