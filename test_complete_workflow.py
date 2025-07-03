#!/usr/bin/env python3
"""
Complete RestaurantAI + Food Logging Test Script
Tests the full workflow: Menu Analysis → Visual Nutrition → Food Logging
"""

import requests
import json

def test_complete_workflow():
    """Test the complete RestaurantAI workflow"""
    
    print("🍽️ Complete RestaurantAI + Food Logging Workflow Test")
    print("=" * 70)
    
    # Check server status
    try:
        response = requests.get("http://localhost:8000/health")
        print("✅ Backend server is running")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running")
        return
    
    # Check frontend status
    try:
        response = requests.get("http://localhost:5173")
        print("✅ Frontend server is running")
    except requests.exceptions.ConnectionError:
        print("❌ Frontend server is not running")
    
    print("\n🎯 Complete Workflow Instructions:")
    print("-" * 40)
    
    print("\n📋 STEP 1: Menu Analysis")
    print("• Go to: http://localhost:5173/restaurant-ai")
    print("• Login to your account")
    print("• Click 'Analyze Menu'")
    print("• Upload: nutrition_labels/resturant_menus/menu1.png")
    print("• Wait for Google Cloud Vision OCR + AI analysis")
    print("• Result: Menu items with estimated nutrition")
    
    print("\n📸 STEP 2: Visual Nutrition Analysis")
    print("• Click 'More Info' on any menu item")
    print("• Scroll to 'Visual Portion Analysis' section")
    print("• Click 'Upload Meal Photo'")
    print("• Upload a photo of the actual meal")
    print("• GPT-4 Vision analyzes portion size")
    print("• Result: Updated nutrition based on actual portions")
    
    print("\n🍽️ STEP 3: Food Logging")
    print("• In the expanded card, click 'Log Food' button")
    print("• Edit meal type (breakfast/lunch/dinner/snack)")
    print("• Adjust serving size (0.1 - 10.0)")
    print("• Add optional notes")
    print("• Click 'Log to Food Diary'")
    print("• Result: Food logged with accurate nutrition data")
    
    print("\n🚀 Key Features:")
    print("-" * 20)
    print("✅ Google Cloud Vision OCR for menu text extraction")
    print("✅ GPT-4 Vision for accurate portion size analysis")
    print("✅ Visual nutrition data caching in MongoDB")
    print("✅ Enhanced food logging with restaurant context")
    print("✅ Before/after nutrition comparison")
    print("✅ Confidence scoring for accuracy assessment")
    print("✅ Expandable cards with detailed information")
    print("✅ Loading states and error handling")
    
    print("\n📊 Data Flow:")
    print("-" * 15)
    print("1. Menu Image → Google Cloud Vision → Menu Text")
    print("2. Menu Text → AI Analysis → Menu Items + Nutrition")
    print("3. Meal Photo → GPT-4 Vision → Portion Analysis")
    print("4. Visual Nutrition → MongoDB Cache → Persistent Storage")
    print("5. Final Data → Food Logging API → User's Food Diary")
    
    print("\n🎯 Testing Tips:")
    print("-" * 18)
    print("• Use menu1.png for consistent menu analysis results")
    print("• For visual analysis, include reference objects (utensils, coins)")
    print("• Try different portion sizes to see confidence scores")
    print("• Check the food diary to see logged items")
    
    print("\n🔗 API Endpoints:")
    print("-" * 18)
    print("• POST /restaurant-ai/analyze - Menu analysis")
    print("• POST /restaurant-ai/visual-nutrition - Visual portion analysis") 
    print("• GET /restaurant-ai/visual-nutrition/{analysis_id}/{item_id} - Cached data")
    print("• GET /restaurant-ai/analyses - Previous analyses")
    print("• POST /food-logs - Log food to diary")
    
    print("\n✨ Ready to test the complete RestaurantAI workflow!")
    print("Start at: http://localhost:5173/restaurant-ai")

if __name__ == "__main__":
    test_complete_workflow()
