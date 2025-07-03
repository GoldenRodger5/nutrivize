#!/usr/bin/env python3
"""
Test script to verify analytics endpoints and examine the data structures
being returned for frontend display.
"""

import asyncio
import json
import requests
from datetime import datetime

# Backend URL
BASE_URL = "http://localhost:8000"

# Test user credentials (using the test user)
TEST_EMAIL = "IsaacMineo@gmail.com"
TEST_PASSWORD = "Buddydog41"

async def test_analytics_endpoints():
    """Test all analytics endpoints and examine response structures"""
    
    print("🔐 Authenticating with Firebase...")
    
    # First authenticate to get a token
    auth_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        print(auth_response.text)
        return
    
    auth_data = auth_response.json()
    token = auth_data.get("access_token")
    
    if not token:
        print("❌ No token received from authentication")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # Test analytics endpoints
    endpoints = [
        ("/analytics/insights?timeframe=week", "AI Insights (Week)"),
        ("/analytics/insights?timeframe=month", "AI Insights (Month)"),
        ("/analytics/nutrition-trends?days=7", "Nutrition Trends (7 days)"),
        ("/analytics/nutrition-trends?days=30", "Nutrition Trends (30 days)"),
        ("/analytics/goal-progress", "Goal Progress"),
        ("/analytics/food-patterns?days=30", "Food Patterns"),
        ("/analytics/macro-breakdown?timeframe=week", "Macro Breakdown (Week)"),
        ("/analytics/weekly-summary", "Weekly Summary"),
    ]
    
    results = {}
    
    for endpoint, name in endpoints:
        print(f"\n📊 Testing {name}...")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                results[name] = {
                    "status": "success",
                    "data_keys": list(data.keys()) if isinstance(data, dict) else "non-dict",
                    "data_sample": data if len(str(data)) < 500 else "truncated (too large)"
                }
                print(f"✅ {name}: SUCCESS")
                
                # Show data structure for key endpoints
                if "insights" in endpoint.lower():
                    if isinstance(data, dict) and "insights" in data:
                        insights_count = len(data["insights"]) if isinstance(data["insights"], list) else 0
                        print(f"   📝 Insights count: {insights_count}")
                        if insights_count > 0:
                            sample_insight = data["insights"][0]
                            print(f"   📋 Sample insight: {sample_insight.get('title', 'No title')}")
                    
                    if isinstance(data, dict) and "statistics" in data:
                        stats_count = len(data["statistics"]) if isinstance(data["statistics"], dict) else 0
                        print(f"   📈 Statistics keys: {list(data['statistics'].keys()) if isinstance(data.get('statistics'), dict) else 'No statistics'}")
                
                elif "trends" in endpoint.lower():
                    if isinstance(data, dict) and "trends" in data:
                        trends_count = len(data["trends"]) if isinstance(data["trends"], list) else 0
                        print(f"   📊 Trends count: {trends_count}")
                
            else:
                results[name] = {
                    "status": "failed",
                    "error": f"HTTP {response.status_code}: {response.text[:200]}"
                }
                print(f"❌ {name}: FAILED ({response.status_code})")
                
        except Exception as e:
            results[name] = {
                "status": "error",
                "error": str(e)
            }
            print(f"💥 {name}: ERROR - {str(e)}")
    
    # Summary
    print("\n" + "="*80)
    print("📋 ANALYTICS ENDPOINTS SUMMARY")
    print("="*80)
    
    for name, result in results.items():
        status_emoji = "✅" if result["status"] == "success" else "❌"
        print(f"{status_emoji} {name}: {result['status'].upper()}")
        
        if result["status"] == "success":
            if isinstance(result["data_keys"], list):
                print(f"    🔑 Data keys: {result['data_keys']}")
        elif "error" in result:
            print(f"    ❌ Error: {result['error']}")
    
    print("\n🎯 Ready to test frontend display!")

if __name__ == "__main__":
    asyncio.run(test_analytics_endpoints())
