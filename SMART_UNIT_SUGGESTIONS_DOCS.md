# Smart Unit Suggestions System Documentation

## Overview
The smart unit suggestions system provides intelligent unit recommendations based on food type, user preferences, and nutrition label data. This makes food logging more intuitive and efficient.

## Key Features

### 1. Food-Type-Based Suggestions
The system analyzes food names and suggests appropriate units:

- **Beverages**: ml, fl oz, cup (for drinks, juice, coffee, etc.)
- **Proteins**: oz, g, lb (for meat, chicken, fish, etc.)
- **Baking Ingredients**: cup, tbsp, tsp (for flour, sugar, etc.)
- **Spices**: tsp, tbsp, g (for salt, pepper, etc.)
- **Fruits**: piece, cup, g (for apples, bananas, etc.)
- **Pasta**: cup, oz, g (for spaghetti, noodles, etc.)

### 2. Nutrition Label Integration
When foods are added via OCR scanning:
- Serving size and unit are automatically detected
- The OCR-detected unit is prioritized in suggestions
- Serving quantity is used as the default amount

### 3. User Preference Memory
- Stores user's unit choices in localStorage
- Remembers frequently used units for each food type
- Prioritizes user's historical preferences over generic suggestions

### 4. Smart Default Selection
When selecting a food, the system chooses the best unit based on:
1. User's previous choice for this food
2. OCR-detected serving unit (if available)
3. Food-type-based recommendations
4. Fallback to grams

## Implementation Details

### Core Files
- `unitConversion.ts`: Enhanced with smart suggestion logic
- `QuantityUnitInput.tsx`: Redesigned component with smart features
- `FoodLogModal.tsx`: Integrated smart defaults
- `MealDetailView.tsx`: Updated to use smart component

### Smart Suggestions Function
```typescript
getSmartUnitSuggestions(foodName: string, servingUnit?: string): UnitSuggestion[]
```

Returns an array of suggestions with:
- `unit`: The unit string (e.g., 'cup', 'oz')
- `category`: Unit category ('weight', 'volume', 'piece')
- `isRecommended`: True for the most recommended unit
- `description`: Explanation of why this unit is suggested

### User Interface Features
- **Suggestion Badges**: Clickable badges showing recommended units
- **Star Ratings**: ⭐ for most recommended, 💡 for other suggestions
- **Tooltips**: Explain unit categories and conversion help
- **Real-time Conversion**: Updates nutrition values when units change

## Example Usage

### For Different Food Types
```typescript
// Milk → suggests ml, cup, fl oz
getSmartUnitSuggestions("milk")

// Chicken breast → suggests oz, g, lb
getSmartUnitSuggestions("chicken breast")

// Flour → suggests cup, tbsp, g
getSmartUnitSuggestions("flour")
```

### With OCR Data
```typescript
// Nutrition label detected "1 cup" serving
getSmartUnitSuggestions("cereal", "cup")
// → "cup" will be marked as recommended
```

## Benefits

1. **Improved UX**: Users see relevant units immediately
2. **Consistency**: Same smart logic across all food interfaces
3. **Learning**: System improves with user behavior
4. **Accuracy**: OCR data ensures label-accurate logging
5. **Efficiency**: Reduces unit selection time

## Future Enhancements

Potential improvements:
- Machine learning for better food type detection
- Regional unit preferences (metric vs imperial)
- Integration with food database for better defaults
- Contextual suggestions based on meal type or time of day
