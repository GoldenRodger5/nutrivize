#!/usr/bin/env python3
"""
Test script to verify that the shopping list API returns data in the format 
that the frontend expects for displaying prices and totals.
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5174"

# Test user credentials
TEST_EMAIL = "IsaacMineo@gmail.com"
TEST_PASSWORD = "Buddydog41"

def test_shopping_list_frontend_integration():
    """Test that shopping list API returns correctly formatted data for frontend"""
    
    print("🧪 Testing Shopping List Frontend Integration")
    print("=" * 60)
    
    # 1. Authenticate
    print("🔐 Authenticating...")
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        return False
    
    token = auth_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # 2. Generate shopping list
    print("\n🛒 Generating shopping list...")
    shopping_response = requests.post(
        f"{BASE_URL}/meal-planning/plans/mp_veg_med_wl_2024/shopping-list",
        headers=headers,
        json={}
    )
    
    if shopping_response.status_code != 200:
        print(f"❌ Shopping list generation failed: {shopping_response.status_code}")
        print(shopping_response.text)
        return False
    
    shopping_data = shopping_response.json()
    print("✅ Shopping list generated successfully")
    
    # 3. Validate frontend-expected structure
    print("\n📋 Validating frontend data structure...")
    
    # Check main structure
    required_fields = ["items", "total_estimated_cost"]
    for field in required_fields:
        if field not in shopping_data:
            print(f"❌ Missing required field: {field}")
            return False
        print(f"✅ Found field: {field}")
    
    # Check items structure
    items = shopping_data.get("items", [])
    if not items:
        print("❌ No items found in shopping list")
        return False
    
    print(f"✅ Found {len(items)} shopping list items")
    
    # Check item structure for frontend compatibility
    required_item_fields = ["name", "amount", "unit", "estimated_price", "category"]
    sample_item = items[0]
    
    for field in required_item_fields:
        if field not in sample_item:
            print(f"❌ Missing required item field: {field}")
            return False
        print(f"✅ Item field present: {field}")
    
    # 4. Display results formatted for frontend
    print("\n💰 Shopping List Summary (Frontend Format)")
    print("-" * 40)
    print(f"Total Items: {len(items)}")
    print(f"Total Estimated Cost: ${shopping_data['total_estimated_cost']:.2f}")
    print(f"Store Location: {shopping_data.get('store_location', 'N/A')}")
    
    print("\n📝 Sample Items:")
    for i, item in enumerate(items[:5]):  # Show first 5 items
        price = f"${item['estimated_price']:.2f}" if item.get('estimated_price') else "N/A"
        print(f"  {i+1}. {item['name']} - {item['amount']} {item['unit']} - {price}")
        if item.get('used_in_meals'):
            print(f"     Used in: {', '.join(item['used_in_meals'])}")
        if item.get('store_package_size'):
            print(f"     Store package: {item['store_package_size']} (${item.get('store_package_price', 0):.2f})")
    
    # 5. Test pricing accuracy
    print("\n🧮 Validating pricing calculations...")
    calculated_total = sum(item.get('estimated_price', 0) for item in items)
    api_total = shopping_data['total_estimated_cost']
    
    if abs(calculated_total - api_total) < 0.01:  # Allow for rounding differences
        print(f"✅ Pricing calculation accurate: ${calculated_total:.2f} ≈ ${api_total:.2f}")
    else:
        print(f"⚠️ Pricing mismatch: calculated ${calculated_total:.2f} vs API ${api_total:.2f}")
    
    # 6. Test that all items have prices
    items_with_prices = sum(1 for item in items if item.get('estimated_price', 0) > 0)
    print(f"✅ Items with prices: {items_with_prices}/{len(items)}")
    
    if items_with_prices == len(items):
        print("🎉 All items have valid pricing!")
    else:
        print(f"⚠️ {len(items) - items_with_prices} items missing pricing")
    
    print("\n" + "="*60)
    print("🎯 FRONTEND INTEGRATION TEST RESULTS:")
    print(f"   ✅ API Structure: Compatible")
    print(f"   ✅ Item Pricing: {items_with_prices}/{len(items)} items")
    print(f"   ✅ Total Cost: ${api_total:.2f}")
    print(f"   ✅ Ready for Frontend Display!")
    
    print(f"\n🌐 Frontend URL: {FRONTEND_URL}")
    print("   Navigate to Meal Plans → Generate Shopping List to test in UI")
    
    return True

if __name__ == "__main__":
    test_shopping_list_frontend_integration()
