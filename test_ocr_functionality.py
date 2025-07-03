#!/usr/bin/env python3
"""
Test script for OCR nutrition label scanning functionality
"""

import requests
import json
import os

def test_nutrition_label_scanning():
    """Test the nutrition label scanning endpoints"""
    
    print("📸 Testing Nutrition Label OCR Scanning...")
    
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
    
    # Test with both nutrition label images
    nutrition_labels_dir = "/Users/isaacmineo/Main/projects/nutrivize-v2/nutrition_labels"
    
    for image_file in ["nutrition_label1.png", "nutrition_label2.png"]:
        image_path = os.path.join(nutrition_labels_dir, image_file)
        
        if not os.path.exists(image_path):
            print(f"⚠️ Image file not found: {image_path}")
            continue
            
        print(f"\n📸 Testing with {image_file}...")
        
        # Test scan-only endpoint first
        test_scan_only(headers, image_path, image_file)
        
        # Test scan-and-create endpoint
        test_scan_and_create(headers, image_path, image_file)

def test_scan_only(headers, image_path, image_file):
    """Test the scan-only endpoint"""
    print(f"  🔍 Testing scan-only for {image_file}...")
    
    try:
        with open(image_path, 'rb') as img_file:
            files = {'file': (image_file, img_file, 'image/png')}
            
            scan_response = requests.post(
                "http://localhost:8000/nutrition-labels/scan",
                headers=headers,
                files=files
            )
            
        print(f"    Status: {scan_response.status_code}")
        
        if scan_response.status_code == 200:
            try:
                data = scan_response.json()
                print("    ✅ Scan successful!")
                
                # Show OCR text (first 200 chars)
                ocr_text = data.get('ocr_text', '')
                print(f"    📝 OCR Text (preview): {ocr_text[:200]}...")
                
                # Show parsed nutrition info
                nutrition_info = data.get('nutrition_info', {})
                print(f"    🍎 Parsed Food Name: {nutrition_info.get('name', 'N/A')}")
                print(f"    🔢 Calories: {nutrition_info.get('calories', 0)}")
                print(f"    🥩 Protein: {nutrition_info.get('protein', 0)}g")
                print(f"    🍞 Carbs: {nutrition_info.get('carbs', 0)}g")
                print(f"    🥑 Fat: {nutrition_info.get('fat', 0)}g")
                
            except json.JSONDecodeError as e:
                print(f"    ❌ Failed to parse response JSON: {e}")
                print(f"    Response text: {scan_response.text[:500]}...")
        else:
            print(f"    ❌ Scan failed: {scan_response.text}")
            
    except Exception as e:
        print(f"    ❌ Error during scan: {e}")

def test_scan_and_create(headers, image_path, image_file):
    """Test the scan-and-create endpoint"""
    print(f"  🏗️ Testing scan-and-create for {image_file}...")
    
    try:
        with open(image_path, 'rb') as img_file:
            files = {'file': (image_file, img_file, 'image/png')}
            data = {'food_name': f'Scanned Food from {image_file}'}
            
            create_response = requests.post(
                "http://localhost:8000/nutrition-labels/scan-and-create",
                headers=headers,
                files=files,
                data=data
            )
            
        print(f"    Status: {create_response.status_code}")
        
        if create_response.status_code == 200:
            try:
                result = create_response.json()
                print("    ✅ Food created successfully!")
                
                # Show created food info
                food = result.get('food', {})
                print(f"    🆔 Food ID: {food.get('id', 'N/A')}")
                print(f"    🍎 Name: {food.get('name', 'N/A')}")
                print(f"    📏 Serving: {food.get('serving_size', 'N/A')} {food.get('serving_unit', '')}")
                
                nutrition = food.get('nutrition', {})
                print(f"    🔢 Calories: {nutrition.get('calories', 0)}")
                print(f"    🥩 Protein: {nutrition.get('protein', 0)}g")
                print(f"    🍞 Carbs: {nutrition.get('carbs', 0)}g")
                print(f"    🥑 Fat: {nutrition.get('fat', 0)}g")
                
            except json.JSONDecodeError as e:
                print(f"    ❌ Failed to parse response JSON: {e}")
                print(f"    Response text: {create_response.text[:500]}...")
        else:
            print(f"    ❌ Create failed: {create_response.text}")
            
    except Exception as e:
        print(f"    ❌ Error during create: {e}")

def test_endpoints_availability():
    """Test if the OCR endpoints are available"""
    print("\n🔍 Checking OCR endpoints availability...")
    
    # Test if endpoints exist by checking OpenAPI docs
    try:
        docs_response = requests.get("http://localhost:8000/docs")
        if docs_response.status_code == 200:
            print("✅ API docs accessible at http://localhost:8000/docs")
        
        # Test basic health check
        health_response = requests.get("http://localhost:8000/health")
        if health_response.status_code == 200:
            print("✅ Server health check passed")
            
    except Exception as e:
        print(f"❌ Error checking endpoints: {e}")

if __name__ == "__main__":
    test_endpoints_availability()
    test_nutrition_label_scanning()
