#!/usr/bin/env python3
"""
Test script for RestaurantAI functionality
"""

import requests
import json

def test_restaurant_ai():
    """Test the RestaurantAI endpoints"""
    
    # Note: This is a basic test - in production you'd need proper authentication
    base_url = "http://localhost:8000"
    
    # Test data - sample menu URL
    test_menu_data = {
        "source_type": "url",
        "source_data": "https://www.olive-garden.com/menus/dinner",
        "restaurant_name": "Olive Garden",
        "menu_name": "Dinner Menu"
    }
    
    print("🍽️ Testing RestaurantAI functionality...")
    
    try:
        # Test health endpoint first
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server health check failed")
            return
        
        print("\n📋 RestaurantAI endpoints available:")
        print("- POST /restaurant-ai/analyze - Analyze menu")
        print("- GET /restaurant-ai/analyses - Get user analyses")
        print("- GET /restaurant-ai/analyses/{id} - Get specific analysis")
        
        print("\n🔧 Note: To test with authentication, use the frontend interface at:")
        print("   http://localhost:5173/restaurant-ai")
        
        print("\n✨ Expected features:")
        print("- Upload menu via URL, image, or PDF")
        print("- AI-powered nutritional analysis")
        print("- Personalized meal recommendations")
        print("- Advanced filtering by dietary preferences")
        print("- Suggested modifications for healthier choices")
        
    except requests.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"❌ Error testing RestaurantAI: {e}")

if __name__ == "__main__":
    test_restaurant_ai()
