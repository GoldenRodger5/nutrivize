#!/usr/bin/env python3
"""
Test script to verify shopping list caching functionality
"""

import requests
import json
import time

def test_shopping_list_caching():
    """Test the shopping list caching functionality"""
    
    print("🛒 Testing Shopping List Caching...")
    
    # Authenticate first using Firebase
    firebase_auth_url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"
    
    auth_payload = {
        "email": "IsaacMineo@gmail.com",
        "password": "Buddydog41",
        "returnSecureToken": True
    }
    
    auth_response = requests.post(f"{firebase_auth_url}?key={api_key}", json=auth_payload)
    
    if auth_response.status_code != 200:
        print(f"❌ Auth failed: {auth_response.status_code}")
        print(auth_response.text)
        return
    
    token = auth_response.json().get("idToken")
    headers = {"Authorization": f"Bearer {token}"}
    
    plan_id = "mp_veg_med_wl_2024"
    
    # Test 1: Generate new shopping list (will be cached)
    print("\n🔄 Test 1: Generate new shopping list...")
    shopping_response = requests.post(
        f"http://localhost:8000/meal-planning/plans/{plan_id}/shopping-list",
        headers=headers,
        json={"force_regenerate": True}  # Force new generation
    )
    
    if shopping_response.status_code == 200:
        data = shopping_response.json()
        print(f"✅ Generated new shopping list: {len(data.get('items', []))} items, ${data.get('total_estimated_cost', 0):.2f}")
        generated_at = data.get('generated_at')
        print(f"📅 Generated at: {generated_at}")
    else:
        print(f"❌ Failed to generate: {shopping_response.status_code}")
        return
    
    # Test 2: Get cached shopping list
    print("\n📦 Test 2: Get cached shopping list...")
    cached_response = requests.get(
        f"http://localhost:8000/meal-planning/plans/{plan_id}/shopping-list",
        headers=headers
    )
    
    if cached_response.status_code == 200:
        cached_data = cached_response.json()
        print(f"✅ Retrieved cached shopping list: {len(cached_data.get('items', []))} items, ${cached_data.get('total_estimated_cost', 0):.2f}")
        cached_generated_at = cached_data.get('generated_at')
        print(f"📅 Cached from: {cached_generated_at}")
        
        # Verify it's the same list
        if generated_at == cached_generated_at:
            print("✅ Cache working correctly - same timestamp")
        else:
            print("⚠️  Different timestamps - possible cache issue")
    else:
        print(f"❌ Failed to get cached list: {cached_response.status_code}")
    
    # Test 3: Generate shopping list without force (should use cache)
    print("\n🔄 Test 3: Generate shopping list (should use cache)...")
    normal_response = requests.post(
        f"http://localhost:8000/meal-planning/plans/{plan_id}/shopping-list",
        headers=headers,
        json={}  # No force_regenerate
    )
    
    if normal_response.status_code == 200:
        normal_data = normal_response.json()
        print(f"✅ Got shopping list (cached): {len(normal_data.get('items', []))} items, ${normal_data.get('total_estimated_cost', 0):.2f}")
        normal_generated_at = normal_data.get('generated_at')
        print(f"📅 From: {normal_generated_at}")
        
        # Verify it's using cache
        if generated_at == normal_generated_at:
            print("✅ Cache working correctly - reused existing list")
        else:
            print("⚠️  Generated new list instead of using cache")
    else:
        print(f"❌ Failed: {normal_response.status_code}")
    
    # Test 4: Get all user shopping lists
    print("\n📋 Test 4: Get all user shopping lists...")
    all_lists_response = requests.get(
        "http://localhost:8000/meal-planning/shopping-lists",
        headers=headers
    )
    
    if all_lists_response.status_code == 200:
        all_data = all_lists_response.json()
        shopping_lists = all_data.get('shopping_lists', [])
        print(f"✅ Retrieved {len(shopping_lists)} shopping lists")
        
        for i, shopping_list in enumerate(shopping_lists[:3]):
            print(f"  {i+1}. Plan: {shopping_list.get('meal_plan_id')} | Items: {len(shopping_list.get('items', []))} | Cost: ${shopping_list.get('total_estimated_cost', 0):.2f}")
    else:
        print(f"❌ Failed to get all lists: {all_lists_response.status_code}")
    
    print("\n🎯 Shopping list caching test complete!")

if __name__ == "__main__":
    test_shopping_list_caching()
