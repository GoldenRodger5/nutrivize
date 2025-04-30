# Meal Plan Phase 3 Implementation

## Overview
Phase 3 extends the meal planning system with advanced features for meal repetition, leftovers management, and enhanced grocery lists, providing a more realistic and user-friendly meal planning experience.

## Key Features Implemented

### 1. Meal Repetition
- **User Selection:** Users can choose which meals to repeat across multiple days
- **Repeat Marking:** Meals in the plan are marked with their repeat status
- **Reference Tracking:** Each repeated meal maintains a reference to its original source
- **Smart Repetition:** Only non-leftover meals can be selected for repetition

### 2. Leftovers Management
- **Leftover Settings:** Users can specify which meals should use leftovers from the previous day
- **Cooking Time Reduction:** Leftover meals have reduced cooking time (just 5 minutes to reheat)
- **Visual Indicators:** Leftover meals are clearly marked in the interface
- **Description Updates:** Leftover meal descriptions reference their original meal

### 3. Advanced Grocery List
- **Categorization:** Grocery items are automatically categorized (produce, meat, dairy, etc.)
- **Cost Estimation:** Each item includes an estimated cost based on standardized pricing
- **Total Cost Calculation:** The total estimated cost of all groceries is displayed
- **In-Food-Index Marking:** Items already in the user's food index are highlighted
- **Optimized Organization:** Items are grouped by category for easier shopping

## Backend Implementation
1. **Data Models:**
   - Extended `MealPlanMeal` with leftover and repetition fields
   - Enhanced `MealPlanRequest` with new settings for meal repetition and leftovers

2. **Algorithm Enhancements:**
   - Logic to handle meal repetition across days
   - Logic to create leftover meals from previous day's meals
   - Smart grocery list generation with consolidation, categorization, and cost estimation

3. **Helper Functions:**
   - `determine_category()` for automatic grocery categorization
   - `estimate_cost()` for calculating item costs based on unit price data

## Frontend Implementation
1. **User Interface:**
   - New form options for enabling meal repetition and leftovers
   - Day-by-day selection UI for configuring which meals to repeat or use as leftovers
   - Enhanced grocery list with categories, estimated costs, and better organization

2. **Visual Design:**
   - Styled category sections in the grocery list
   - Cost indicators for grocery items
   - Clear marking of leftover and repeated meals

## Benefits
- **Reduced Food Waste:** Intentional planning for leftovers
- **Time Savings:** Repeated meals reduce cooking time
- **Cost Awareness:** Estimated grocery costs help with budgeting
- **Shopping Efficiency:** Categorized grocery lists streamline shopping
- **More Realistic Meal Planning:** Better matches real-world cooking and eating patterns

## Future Enhancements
- Allow saving repeated meals as templates
- Enable custom grocery categories and price adjustments
- Implement smart leftover suggestions based on portion sizes
- Add option to mark grocery items as "already owned" 