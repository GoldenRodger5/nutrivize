#!/usr/bin/env python3
"""
Debug script to check the actual database state
"""
import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000"
AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImE4ZGY2MmQzYTBhNDRlM2RmY2RjYWZjNmRhMTM4Mzc3NDU5ZjliMDEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZm9vZC10cmFja2VyLTYwOTZkIiwiYXVkIjoiZm9vZC10cmFja2VyLTYwOTZkIiwiYXV0aF90aW1lIjoxNzUyNjE5Mzc2LCJ1c2VyX2lkIjoiR01FN25HcEpRUmMydjlUMDU3dko0b3lxQUpOMiIsInN1YiI6IkdNRTduR3BKUVJjMnY5VDA1N3ZKNG95cUFKTjIiLCJpYXQiOjE3NTI2MTkzNzYsImV4cCI6MTc1MjYyMjk3NiwiZW1haWwiOiJpc2FhY21pbmVvQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJpc2FhY21pbmVvQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.sReC2uw-AFIqVUd2rP8eAxUuaMarQKUabHQekODtKEY8DrEfPvVPIuUg_VBEux425ooaox46-W0ezHe25PuQ6bYk4A1ug-bX9ql9rZU_1caXVian7tAt8ze_X2T1ykvHQaMfVmPGRXP4dcebYHRUXVTw22-6Ts5b_c-RiZOGe0LZ8278fmDc4OpZOTYshWH-sPqbdjfFTJfuh5w1IsqyA97sxGaW-z__8OSP3Z5puEyVvLJr89BjBbaXy_ObMFEzCVNBjOTi0TMghJiEKyYhK6VdvemsWQvOx6DuPR9szdzl1njtRVmaFZFvcWy15M93_pL-suNaOgHrTj_x958pbw"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

def main():
    # Add a test food
    test_food = {
        "food_id": "debug_food_001",
        "food_name": "Debug Food",
        "quantity": 100.0,
        "unit": "g",
        "calories": 100.0,
        "protein": 10.0,
        "carbs": 20.0,
        "fat": 5.0,
        "fiber": 3.0,
        "sugar": 8.0,
        "sodium": 50.0
    }
    
    print("🔍 Debug User Endpoints")
    print("=" * 50)
    
    # Add food to recent foods
    print("1. Adding food to recent foods...")
    response = requests.post(f"{BASE_URL}/user/recent-foods", headers=headers, json=test_food)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Check recent foods
    print("\n2. Checking recent foods...")
    response = requests.get(f"{BASE_URL}/user/recent-foods", headers=headers)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")
    
    # Add food to favorites
    print("\n3. Adding food to favorites...")
    fav_food = {
        "food_id": "debug_fav_001",
        "food_name": "Debug Favorite",
        "default_quantity": 150.0,
        "default_unit": "g",
        "calories": 200.0,
        "protein": 15.0,
        "carbs": 25.0,
        "fat": 8.0,
        "fiber": 4.0,
        "sugar": 10.0,
        "sodium": 60.0
    }
    
    response = requests.post(f"{BASE_URL}/user/favorite-foods", headers=headers, json=fav_food)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Check favorites
    print("\n4. Checking favorite foods...")
    response = requests.get(f"{BASE_URL}/user/favorite-foods", headers=headers)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    main()
