# Meal Suggestions Feature Changelog

## October 2023 - Advanced Filter Fix

### Bug Fixes
- Fixed the JSON parsing error when using advanced filters in meal suggestions
- Improved robustness of Claude API response handling
- Added better error messages for users when suggestions fail
- Fixed frontend/backend route mismatch (from '/meals/suggestions' to '/suggest-meal')

### Enhancements
- Added comprehensive unit tests for meal suggestion functionality
- Improved the Claude prompt to be more specific about JSON formatting requirements
- Enhanced error handling to provide more helpful messages to users
- Added a "Try Again" button when suggestions fail
- Improved the loading animation
- Added form validation to prevent common errors
- Increased the Claude API token limit from 1000 to 4000 for more detailed responses
- Organized advanced filters to make the interface more intuitive

### Technical Improvements
- Added robust JSON parsing that handles different response formats
- Added error recovery strategies when JSON parsing fails
- Added asyncio support for testing asynchronous functions
- Improved console logging for debugging
- Enhanced structured error response objects

### User Experience Improvements
- Added collapsible advanced filters for a cleaner interface
- Added helpful tips when suggestions fail
- Improved error message formatting
- Enhanced loading indicators
- Added responsive design for better mobile experience

## How to Use Advanced Filters
For best results when using advanced filters:
1. Start with fewer filters and add more gradually
2. Make sure your food index has items that match your criteria
3. If specific ingredients aren't working, try more common ones
4. Provide a reasonable calorie range that matches your remaining macros 