# Nutrivize V2 Frontend Test Flows

This document outlines the test flows to validate that all cross-component updates are working correctly.

## Test Flow 1: Goal Creation and Dashboard Updates

1. **Login to the application**
2. **Navigate to Goals page** (`/goals`)
3. **Create a new goal** with:
   - Goal type: Weight loss
   - Current weight: 180 lbs
   - Target weight: 160 lbs
   - Weekly rate: 1 lb/week
   - Nutrition targets: 1800 calories, 140g protein, 180g carbs, 60g fat
4. **Verify goal is created** and marked as active
5. **Navigate to Dashboard** (`/`)
6. **Verify Dashboard shows**:
   - Goal nutrition targets in the overview cards
   - Welcome message is replaced with nutrition summary
   - Quick action buttons are functional

## Test Flow 2: Weight Logging and Goal Progress

1. **Navigate to Goals page** (`/goals`)
2. **Log a new weight entry** using the weight logging section
3. **Verify weight is logged** and appears in the weight log list
4. **Navigate to Dashboard** (`/`)
5. **Verify any weight-related progress is updated**

## Test Flow 3: Food Logging and Real-time Updates

1. **Navigate to Food Log page** (`/food-log`)
2. **Search for a food item** (e.g., "chicken breast")
3. **Log food item** with:
   - Amount: 6 oz
   - Meal type: Lunch
4. **Verify food appears** in the daily meal breakdown
5. **Verify nutrition summary updates** with new totals
6. **Navigate to Dashboard** (`/`)
7. **Verify Dashboard nutrition cards** show updated progress bars and values
8. **Navigate back to Food Log**
9. **Delete a food entry**
10. **Verify nutrition summary updates** immediately
11. **Navigate to Dashboard again**
12. **Verify Dashboard reflects** the removed food entry

## Test Flow 4: Macro Percentage Mode

1. **Navigate to Goals page** (`/goals`)
2. **Toggle to percentage mode** for macros
3. **Set macro percentages** (e.g., 30% protein, 40% carbs, 30% fat)
4. **Verify percentages sum to 100%** and gram values auto-calculate
5. **Use macro preset buttons** and verify values update
6. **Use auto-balance feature** and verify remaining percentage is distributed
7. **Save goal** and verify Dashboard uses new targets

## Test Flow 5: Navigation and State Persistence

1. **Navigate between all pages** using the main navigation
2. **Verify state persists** across page transitions
3. **Refresh the browser** and verify data reloads correctly
4. **Use Quick Action buttons** on Dashboard to navigate to different pages

## Expected Behaviors

### Global State Management
- All data changes should be reflected immediately across all components
- No manual page refreshes should be required to see updates
- Context state should update automatically when API calls succeed

### Error Handling
- Invalid form submissions should show appropriate error messages
- API errors should be handled gracefully
- Network issues should not crash the application

### UI/UX
- Loading states should be shown during API calls
- Form validations should work correctly
- Navigation should be smooth and intuitive
- All buttons and interactive elements should be functional

### Performance
- Page transitions should be fast
- API calls should not block the UI unnecessarily
- Data should only be fetched when needed (not on every component mount)

## Notes

- Test with both existing and new user accounts
- Verify all numeric displays are properly formatted
- Check that units (lbs, kg, grams, etc.) are displayed correctly
- Ensure mobile responsiveness (if applicable)
- Test error scenarios (invalid inputs, network failures, etc.)
