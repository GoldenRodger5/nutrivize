# Smart Meal Planning Guide

## Purpose

SmartMealPlanning is an AI-powered tool in Nutrivize that helps users create nutritionally optimized meals based on their personal dietary preferences, restrictions, and nutritional goals. It combines data from your dietary profile, food inventory, and nutritional science to suggest foods that work well together and meet your specific needs.

## Key Features

1. **Personalized Food Recommendations**: AI suggests foods based on your dietary profile, including restrictions, allergies, and health goals.

2. **Compatibility Analysis**: Each food is scored for compatibility with your dietary needs, highlighting benefits and potential concerns.

3. **Meal Building**: Add suggested foods to build complete, balanced meals tailored to your preferences.

4. **Nutritional Analysis**: View comprehensive nutritional analysis of your meal as you build it, with insights and suggestions for improvement.

5. **Meal-Type Optimization**: Choose breakfast, lunch, dinner, or snack to get recommendations specifically tailored for that meal type.

## User Flow

### 1. Setting Up Your Profile

Before using SmartMealPlanning effectively, ensure your dietary profile is set up:

- Click "Update Dietary Profile" to set or update your dietary preferences
- Add any dietary restrictions (vegetarian, vegan, keto, etc.)
- Include allergens to avoid
- Set your strictness level (how strictly the system should adhere to your preferences)

### 2. Getting AI Recommendations

- Select a meal type (breakfast, lunch, dinner, or snack)
- The system will automatically generate food recommendations based on your profile
- Each recommendation includes:
  - Compatibility score (0-100)
  - Why it's good for you
  - Nutritional highlights
  - Meal suitability indicator

### 3. Building Your Meal

- Click "Add to Meal" for any recommendation you'd like to include
- Your selected items will appear in the "Build Your Meal" section
- You can remove foods if you change your mind
- The system will automatically analyze your meal as you build it

### 4. Meal Analysis

As you add foods, the Smart Meal Analysis section will show:

- Total calories, protein, carbs, and fat
- How well your meal aligns with your dietary goals
- Suggestions for improving balance or nutritional value
- Any potential concerns or conflicts with your dietary profile

### 5. Finalizing Your Meal

- Once satisfied with your meal composition, you can:
  - Save the meal for future reference
  - Log the meal to your food diary
  - View detailed nutritional breakdown

## Tips for Best Results

1. **Keep Your Profile Updated**: The more accurate your dietary profile, the better the recommendations will be.

2. **Try Different Combinations**: Experiment with different food combinations to find meals that are both nutritionally optimal and enjoyable.

3. **Check Compatibility Scores**: Foods with higher scores (80-100) align better with your dietary needs.

4. **Balance Your Meal**: Aim for a good balance of proteins, carbs, and fats according to your nutritional goals.

5. **Use the Refresh Button**: If you're not satisfied with the initial recommendations, click "Refresh Recommendations" to get new suggestions.

## API Endpoints

The SmartMealPlanning feature relies on these key API endpoints:

- `/preferences/dietary`: Gets your dietary preferences and restrictions
- `/foods/stats`: Gets statistics about your food inventory and compatibility
- `/ai/meal-suggestions`: Gets AI-powered meal recommendations based on your profile

If you experience any issues with SmartMealPlanning, please ensure your backend server is properly configured to support these endpoints.

---

We hope you enjoy using the SmartMealPlanning feature to create delicious, nutritionally optimized meals that fit your lifestyle and preferences!
