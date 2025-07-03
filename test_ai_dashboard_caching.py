#!/usr/bin/env python3
"""
Test script to verify AI Dashboard caching functionality
"""

import asyncio
import httpx
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_ai_dashboard_caching():
    """Test AI dashboard caching by making multiple requests"""
    
    # Test credentials - adjust as needed
    test_email = "test@example.com"
    test_password = "testpassword123"
    
    print("🧪 Testing AI Dashboard Caching...")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # 1. Login to get auth token
        print("1️⃣ Logging in...")
        login_response = await client.post(f"{BASE_URL}/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print("Creating test user...")
            
            # Try to create test user
            register_response = await client.post(f"{BASE_URL}/auth/register", json={
                "email": test_email,
                "password": test_password,
                "name": "Test User"
            })
            
            if register_response.status_code in [200, 201]:
                print("✅ Test user created")
                # Login again
                login_response = await client.post(f"{BASE_URL}/auth/login", json={
                    "email": test_email,
                    "password": test_password
                })
            else:
                print(f"❌ Failed to create test user: {register_response.status_code}")
                return
        
        if login_response.status_code != 200:
            print(f"❌ Still unable to login: {login_response.status_code}")
            return
            
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
        
        # 2. Test cache status
        print("\n2️⃣ Checking cache status...")
        cache_status_response = await client.get(f"{BASE_URL}/ai-dashboard/cache-status", headers=headers)
        if cache_status_response.status_code == 200:
            cache_status = cache_status_response.json()
            print(f"📊 Cache Status: {cache_status}")
        else:
            print(f"⚠️ Could not get cache status: {cache_status_response.status_code}")
        
        # 3. First AI coaching request (should generate fresh data)
        print("\n3️⃣ First AI coaching request (fresh generation)...")
        start_time = time.time()
        coaching_response1 = await client.get(f"{BASE_URL}/ai-dashboard/coaching", headers=headers)
        first_request_time = time.time() - start_time
        
        if coaching_response1.status_code == 200:
            print(f"✅ First request successful ({first_request_time:.2f}s)")
            coaching_data1 = coaching_response1.json()
            print(f"📝 Insight: {coaching_data1.get('personalizedInsight', 'N/A')[:100]}...")
        else:
            print(f"❌ First coaching request failed: {coaching_response1.status_code}")
            return
        
        # 4. Second AI coaching request (should use cached data)
        print("\n4️⃣ Second AI coaching request (should be cached)...")
        start_time = time.time()
        coaching_response2 = await client.get(f"{BASE_URL}/ai-dashboard/coaching", headers=headers)
        second_request_time = time.time() - start_time
        
        if coaching_response2.status_code == 200:
            print(f"✅ Second request successful ({second_request_time:.2f}s)")
            coaching_data2 = coaching_response2.json()
            
            # Check if data is the same (indicating cache hit)
            if coaching_data1 == coaching_data2:
                print("🎯 Data is identical - cache hit confirmed!")
            else:
                print("⚠️ Data differs - possible cache miss")
                
            # Check if second request was significantly faster
            if second_request_time < first_request_time * 0.7:
                print(f"⚡ Second request was {first_request_time/second_request_time:.1f}x faster - likely cached!")
            else:
                print(f"🐌 Second request took similar time - might not be cached")
                
        else:
            print(f"❌ Second coaching request failed: {coaching_response2.status_code}")
            return
        
        # 5. Test cache invalidation
        print("\n5️⃣ Testing cache invalidation...")
        invalidate_response = await client.post(f"{BASE_URL}/ai-dashboard/invalidate-cache", headers=headers)
        if invalidate_response.status_code == 200:
            print("✅ Cache invalidation successful")
        else:
            print(f"⚠️ Cache invalidation failed: {invalidate_response.status_code}")
        
        # 6. Third request after invalidation (should generate fresh data again)
        print("\n6️⃣ Third request after cache invalidation...")
        start_time = time.time()
        coaching_response3 = await client.get(f"{BASE_URL}/ai-dashboard/coaching", headers=headers)
        third_request_time = time.time() - start_time
        
        if coaching_response3.status_code == 200:
            print(f"✅ Third request successful ({third_request_time:.2f}s)")
            
            if third_request_time > second_request_time * 1.5:
                print("🔄 Third request took longer - fresh generation confirmed!")
            else:
                print("🤔 Third request was still fast - check cache invalidation")
        else:
            print(f"❌ Third coaching request failed: {coaching_response3.status_code}")
        
        # 7. Test today's nutrition detail endpoint
        print("\n7️⃣ Testing Today's Nutrition Detail endpoint...")
        nutrition_detail_response = await client.get(f"{BASE_URL}/ai-dashboard/todays-nutrition-detail", headers=headers)
        if nutrition_detail_response.status_code == 200:
            nutrition_data = nutrition_detail_response.json()
            print("✅ Today's nutrition detail successful")
            print(f"📊 Total foods logged: {nutrition_data.get('total_foods_logged', 0)}")
            print(f"🍽️ Meals with data: {nutrition_data.get('meals_with_data', 0)}")
        else:
            print(f"❌ Today's nutrition detail failed: {nutrition_detail_response.status_code}")
        
        print("\n🎉 AI Dashboard caching test completed!")
        print("=" * 50)
        print("📋 Summary:")
        print(f"   • First request: {first_request_time:.2f}s")
        print(f"   • Second request: {second_request_time:.2f}s")
        print(f"   • Third request: {third_request_time:.2f}s")
        print(f"   • Cache speedup: {first_request_time/second_request_time:.1f}x")

if __name__ == "__main__":
    asyncio.run(test_ai_dashboard_caching())
