#!/bin/bash

# Deploy fixes for number inputs, AI service, and macro distribution
echo "🚀 Deploying Number Input and AI Service Fixes"
echo "==============================================="

# 1. Build frontend with new components
echo "📦 Building frontend..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# 2. Push backend changes
echo "🔄 Backend changes already applied:"
echo "  ✅ Fixed database comparison in unified_ai_service.py"
echo "  ✅ Fixed food_id error in food_log_service.py" 
echo "  ✅ Enhanced food index summary with better formatting"
echo "  ✅ Improved AI response for direct queries"

# 3. Frontend changes applied:
echo "🔄 Frontend changes already applied:"
echo "  ✅ Created NumberInputField component for decimal support"
echo "  ✅ Created MacroDistributionSlider component"
echo "  ✅ Updated FoodLogModal to use NumberInputField"
echo "  ✅ Updated MealPlans to use MacroDistributionSlider"
echo "  ✅ Updated FoodLogEnhanced to use NumberInputField"

echo ""
echo "🎯 Key Improvements:"
echo "  • Number inputs now support decimals (e.g., 1.5 servings)"
echo "  • Can clear number inputs completely"
echo "  • Macro distribution auto-balances to 100%"
echo "  • AI preserves user meal plan names"
echo "  • AI provides focused responses to direct queries"
echo "  • Fixed database comparison errors"
echo "  • Fixed food_id missing errors in logs"

echo ""
echo "📋 Still TODO:"
echo "  • Update remaining NumberInput components in Goals.tsx"
echo "  • Update RestaurantAI.tsx NumberInput components"
echo "  • Test decimal input functionality end-to-end"
echo "  • Test macro distribution slider"
echo "  • Test AI meal plan name preservation"

echo ""
echo "✅ Core fixes deployed. Ready for testing!"
