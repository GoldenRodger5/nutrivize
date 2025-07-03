#!/usr/bin/env python3
"""
Script to check dietary data for Isaac's foods in the food index
"""

import requests
import json
from typing import Dict, Any, List

# Configuration
EMAIL = "IsaacMineo@gmail.com"
PASSWORD = "Buddydog41"
API_BASE_URL = "http://localhost:8000"  # Adjust if needed

def authenticate() -> str:
    """Authenticate with Firebase and get token"""
    print("🔐 Authenticating with Firebase...")
    
    # Firebase Auth REST API endpoint
    firebase_api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"  # From your Firebase config
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"
    
    auth_data = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(auth_url, json=auth_data)
        response.raise_for_status()
        auth_result = response.json()
        
        token = auth_result.get('idToken')
        if not token:
            print("❌ Failed to get auth token")
            return None
            
        print("✅ Successfully authenticated with Firebase")
        return token
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Firebase authentication failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def fetch_all_foods(token: str) -> List[Dict[str, Any]]:
    """Fetch all foods for the user"""
    print("🍎 Fetching all foods from the food index...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    all_foods = []
    skip = 0
    limit = 100
    
    while True:
        try:
            url = f"{API_BASE_URL}/foods?limit={limit}&skip={skip}"
            print(f"📡 Fetching foods: skip={skip}, limit={limit}")
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            foods_batch = response.json()
            
            if not foods_batch:
                print("📊 No more foods found")
                break
                
            all_foods.extend(foods_batch)
            print(f"✅ Fetched {len(foods_batch)} foods (total so far: {len(all_foods)})")
            
            # If we got fewer than the limit, we're done
            if len(foods_batch) < limit:
                break
                
            skip += limit
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch foods: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
            break
    
    print(f"🎯 Total foods fetched: {len(all_foods)}")
    return all_foods

def analyze_dietary_data(foods: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze the dietary data in the foods"""
    print("🔍 Analyzing dietary data...")
    
    total_foods = len(foods)
    foods_with_dietary_data = 0
    foods_with_restrictions = 0
    foods_with_allergens = 0
    foods_with_categories = 0
    
    restriction_counts = {}
    allergen_counts = {}
    category_counts = {}
    
    foods_missing_data = []
    foods_with_data = []
    
    for food in foods:
        food_name = food.get('name', 'Unknown')
        dietary_attrs = food.get('dietary_attributes')
        
        if dietary_attrs is None:
            foods_missing_data.append({
                'name': food_name,
                'id': food.get('id'),
                'source': food.get('source', 'unknown')
            })
            continue
            
        foods_with_dietary_data += 1
        
        # Check restrictions
        restrictions = dietary_attrs.get('dietary_restrictions', [])
        if restrictions:
            foods_with_restrictions += 1
            for restriction in restrictions:
                restriction_counts[restriction] = restriction_counts.get(restriction, 0) + 1
        
        # Check allergens
        allergens = dietary_attrs.get('allergens', [])
        if allergens:
            foods_with_allergens += 1
            for allergen in allergens:
                allergen_counts[allergen] = allergen_counts.get(allergen, 0) + 1
        
        # Check categories
        categories = dietary_attrs.get('food_categories', [])
        if categories:
            foods_with_categories += 1
            for category in categories:
                category_counts[category] = category_counts.get(category, 0) + 1
        
        # Store food with data for examples
        if restrictions or allergens or categories:
            foods_with_data.append({
                'name': food_name,
                'id': food.get('id'),
                'source': food.get('source', 'unknown'),
                'restrictions': restrictions,
                'allergens': allergens,
                'categories': categories
            })
    
    return {
        'total_foods': total_foods,
        'foods_with_dietary_data': foods_with_dietary_data,
        'foods_with_restrictions': foods_with_restrictions,
        'foods_with_allergens': foods_with_allergens,
        'foods_with_categories': foods_with_categories,
        'restriction_counts': restriction_counts,
        'allergen_counts': allergen_counts,
        'category_counts': category_counts,
        'foods_missing_data': foods_missing_data[:10],  # Show first 10
        'foods_with_data': foods_with_data[:10],  # Show first 10
        'missing_data_count': len(foods_missing_data)
    }

def print_analysis(analysis: Dict[str, Any]):
    """Print the analysis results"""
    print("\n" + "="*60)
    print("📊 DIETARY DATA ANALYSIS RESULTS")
    print("="*60)
    
    total = analysis['total_foods']
    with_data = analysis['foods_with_dietary_data']
    missing = analysis['missing_data_count']
    
    print(f"\n📈 SUMMARY:")
    print(f"   Total Foods: {total}")
    print(f"   Foods with Dietary Data: {with_data} ({(with_data/total*100):.1f}%)")
    print(f"   Foods Missing Dietary Data: {missing} ({(missing/total*100):.1f}%)")
    print(f"   Foods with Restrictions: {analysis['foods_with_restrictions']}")
    print(f"   Foods with Allergens: {analysis['foods_with_allergens']}")
    print(f"   Foods with Categories: {analysis['foods_with_categories']}")
    
    if analysis['restriction_counts']:
        print(f"\n🥗 DIETARY RESTRICTIONS:")
        for restriction, count in sorted(analysis['restriction_counts'].items(), key=lambda x: x[1], reverse=True):
            print(f"   {restriction}: {count} foods")
    else:
        print(f"\n🥗 DIETARY RESTRICTIONS: None found")
    
    if analysis['allergen_counts']:
        print(f"\n⚠️  ALLERGENS:")
        for allergen, count in sorted(analysis['allergen_counts'].items(), key=lambda x: x[1], reverse=True):
            print(f"   {allergen}: {count} foods")
    else:
        print(f"\n⚠️  ALLERGENS: None found")
    
    if analysis['category_counts']:
        print(f"\n🏷️  FOOD CATEGORIES:")
        for category, count in sorted(analysis['category_counts'].items(), key=lambda x: x[1], reverse=True):
            print(f"   {category}: {count} foods")
    else:
        print(f"\n🏷️  FOOD CATEGORIES: None found")
    
    print(f"\n❌ FOODS MISSING DIETARY DATA (showing first 10):")
    for food in analysis['foods_missing_data']:
        print(f"   • {food['name']} (ID: {food['id'][:8]}..., Source: {food['source']})")
    
    if analysis['foods_with_data']:
        print(f"\n✅ FOODS WITH DIETARY DATA (showing first 10):")
        for food in analysis['foods_with_data']:
            restrictions = ", ".join(food['restrictions']) if food['restrictions'] else "none"
            allergens = ", ".join(food['allergens']) if food['allergens'] else "none"
            categories = ", ".join(food['categories']) if food['categories'] else "none"
            print(f"   • {food['name']} (Source: {food['source']})")
            print(f"     - Restrictions: {restrictions}")
            print(f"     - Allergens: {allergens}")
            print(f"     - Categories: {categories}")

def main():
    """Main function"""
    print("🚀 Starting Dietary Data Investigation for Isaac's Food Index")
    print(f"👤 User: {EMAIL}")
    print(f"🌐 API: {API_BASE_URL}")
    
    # Step 1: Authenticate
    token = authenticate()
    if not token:
        print("❌ Authentication failed. Cannot proceed.")
        return
    
    # Step 2: Fetch all foods
    foods = fetch_all_foods(token)
    if not foods:
        print("❌ No foods found or failed to fetch foods.")
        return
    
    # Step 3: Analyze dietary data
    analysis = analyze_dietary_data(foods)
    
    # Step 4: Print results
    print_analysis(analysis)
    
    # Step 5: Save raw data for further investigation
    output_file = "/Users/isaacmineo/Main/projects/nutrivize-v2/food_data_analysis.json"
    with open(output_file, 'w') as f:
        json.dump({
            'analysis': analysis,
            'sample_foods': foods[:5]  # Save first 5 foods as samples
        }, f, indent=2, default=str)
    
    print(f"\n💾 Raw analysis saved to: {output_file}")
    print("\n🎯 INVESTIGATION COMPLETE!")

if __name__ == "__main__":
    main()
