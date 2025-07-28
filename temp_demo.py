#!/usr/bin/env python3
"""
Script to create comprehensive demo data for nutrivize@gmail.com user
This includes foods, food logs, goals, preferences, and other features
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta, date
from typing import Dict, List, Any

# API Configuration
API_BASE = "http://localhost:8000"
AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MWRkZTkzMmViYWNkODhhZmIwMDM3YmZlZDhmNjJiMDdmMDg2NmIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGVtbyBVc2VyIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2Zvb2QtdHJhY2tlci02MDk2ZCIsImF1ZCI6ImZvb2QtdHJhY2tlci02MDk2ZCIsImF1dGhfdGltZSI6MTc1MzY2MjQyMiwidXNlcl9pZCI6IjNzZE5qM0hYeGJWVmhHWU9UcE5aWXhTekt5VDIiLCJzdWIiOiIzc2ROajNIWHhiVlZoR1lPVHBOWll4U3pLeVQyIiwiaWF0IjoxNzUzNjYyNDIyLCJleHAiOjE3NTM2NjYwMjIsImVtYWlsIjoibnV0cml2aXplQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJudXRyaXZpemVAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.BMyGi2EYjUhkeLeXQ4Qq72VcQz_J07ifsS9tysrp9E8OCjHDLh-TA_hhdYLgsQ-YYgPNbKat8KgHd55L6Ow0nkyIBUL2GGx0f0v_XdvfT1QsgPk9XGQGp0_ErV2dzPVI4hTCxQKqxUobZ_gZwc16_uETKC8s7GmsBRwtx-q5C4yU4s3sfpidp3XlEgYRX1wq8-sJgmUnr55Yd08ZUTQGJ6EJTglgQbMhi1t5Y2_dCZu_L0Z-gPlL4gqTvMJRGxx7t9YlwUFVu30Vxp8PSzzoU1qnTSeiUwrq16m8FsRUVUPPHnnjwOO9fv9-28j7euP9f1VEF6bCwaJhE2HlypCl3w"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

# Essential foods for demo (simplified)
DEMO_FOODS = [
    {
        "name": "Oatmeal",
        "serving_size": 100,
        "serving_unit": "g",
        "nutrition": {
            "calories": 389,
            "protein": 16.9,
            "carbohydrates": 66.3,
            "fat": 6.9,
            "fiber": 10.6,
            "sugar": 0,
            "sodium": 2
        },
        "brand": "Quaker",
        "dietary_attributes": {
            "dietary_restrictions": ["vegetarian", "vegan"],
            "allergens": [],
            "food_categories": ["grain", "breakfast"]
        }
    },
    {
        "name": "Greek Yogurt",
        "serving_size": 150,
        "serving_unit": "g",
        "nutrition": {
            "calories": 100,
            "protein": 17,
            "carbohydrates": 6,
            "fat": 0,
            "fiber": 0,
            "sugar": 6,
            "sodium": 50
        },
        "brand": "Chobani",
        "dietary_attributes": {
            "dietary_restrictions": ["vegetarian"],
            "allergens": ["dairy"],
            "food_categories": ["dairy", "protein"]
        }
    },
    {
        "name": "Banana",
        "serving_size": 118,
        "serving_unit": "g",
        "nutrition": {
            "calories": 105,
            "protein": 1.3,
            "carbohydrates": 27,
            "fat": 0.4,
            "fiber": 3.1,
            "sugar": 14.4,
            "sodium": 1
        },
        "dietary_attributes": {
            "dietary_restrictions": ["vegetarian", "vegan"],
            "allergens": [],
            "food_categories": ["fruit"]
        }
    },
    {
        "name": "Chicken Breast",
        "serving_size": 100,
        "serving_unit": "g",
        "nutrition": {
            "calories": 165,
            "protein": 31,
            "carbohydrates": 0,
            "fat": 3.6,
            "fiber": 0,
            "sugar": 0,
            "sodium": 74
        },
        "dietary_attributes": {
            "dietary_restrictions": [],
            "allergens": [],
            "food_categories": ["meat", "protein"]
        }
    },
    {
        "name": "Brown Rice",
        "serving_size": 100,
        "serving_unit": "g",
        "nutrition": {
            "calories": 111,
            "protein": 2.6,
            "carbohydrates": 23,
            "fat": 0.9,
            "fiber": 1.8,
            "sugar": 0.4,
            "sodium": 5
        },
        "dietary_attributes": {
            "dietary_restrictions": ["vegetarian", "vegan"],
            "allergens": [],
            "food_categories": ["grain"]
        }
    }
]

async def create_food_with_retry(session: aiohttp.ClientSession, food_data: Dict[str, Any], max_retries: int = 3) -> str:
    """Create a single food item with retry logic"""
    for attempt in range(max_retries):
        try:
            async with session.post(f"{API_BASE}/foods/", 
                                   headers=HEADERS, 
                                   json=food_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✓ Created food: {food_data['name']}")
                    return result['id']
                elif response.status == 429:  # Rate limited
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"⏳ Rate limited, waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    text = await response.text()
                    print(f"✗ Failed to create {food_data['name']}: {text}")
                    return None
        except Exception as e:
            print(f"✗ Error creating {food_data['name']}: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            return None
    return None

async def create_foods_sequentially() -> List[str]:
    """Create foods one by one to avoid rate limiting"""
    print("🍎 Creating demo foods...")
    food_ids = []
    
    async with aiohttp.ClientSession() as session:
        for food_data in DEMO_FOODS:
            food_id = await create_food_with_retry(session, food_data)
            if food_id:
                food_ids.append(food_id)
            await asyncio.sleep(0.5)  # Small delay between requests
    
    print(f"✓ Created {len(food_ids)} foods successfully")
    return food_ids

async def create_water_logs_sequential():
    """Create water logs one by one"""
    print("� Creating water logs...")
    
    today = date.today()
    
    async with aiohttp.ClientSession() as session:
        for day_offset in range(7):
            log_date = (today - timedelta(days=day_offset))
            
            water_data = {
                "date": log_date.isoformat(),
                "amount": 64.0 + (day_offset * 8)  # Vary daily intake (in fl oz)
            }
            
            try:
                async with session.post(f"{API_BASE}/water-logs/", 
                                       headers=HEADERS, 
                                       json=water_data) as response:
                    if response.status == 200:
                        print(f"✓ Created water log for {log_date}")
                    elif response.status == 429:
                        print("⏳ Rate limited on water logs, waiting...")
                        await asyncio.sleep(2)
                        continue
                    else:
                        text = await response.text()
                        print(f"✗ Failed to create water log: {text}")
            except Exception as e:
                print(f"✗ Error creating water log: {str(e)}")
            
            await asyncio.sleep(0.5)  # Delay between requests

async def create_weight_logs_sequential():
    """Create weight logs one by one"""
    print("⚖️ Creating weight logs...")
    
    today = date.today()
    base_weight = 75.0
    
    async with aiohttp.ClientSession() as session:
        for day_offset in range(7):
            log_date = (today - timedelta(days=day_offset))
            current_weight = base_weight + (day_offset * 0.1)
            
            weight_data = {
                "date": log_date.isoformat(),
                "weight": round(current_weight, 1)
            }
            
            try:
                async with session.post(f"{API_BASE}/weight-logs/", 
                                       headers=HEADERS, 
                                       json=weight_data) as response:
                    if response.status == 200:
                        print(f"✓ Created weight log for {log_date}: {current_weight}kg")
                    elif response.status == 429:
                        print("⏳ Rate limited on weight logs, waiting...")
                        await asyncio.sleep(2)
                        continue
                    else:
                        text = await response.text()
                        print(f"✗ Failed to create weight log: {text}")
            except Exception as e:
                print(f"✗ Error creating weight log: {str(e)}")
            
            await asyncio.sleep(0.5)  # Delay between requests

async def create_comprehensive_food_logs(food_ids: List[str]):
    """Create comprehensive food logs for past 2 weeks with realistic meal patterns"""
    print("📊 Creating comprehensive food logs for past 2 weeks...")
    
    if not food_ids or len(food_ids) < 5:
        print("✗ Need at least 5 food IDs for comprehensive logs")
        return
    
    # Current time: July 27, 2025 8:55 PM EST
    today = date(2025, 7, 27)  # Today's date
    
    # Map food indices to our created foods
    foods_data = [
        {"id": food_ids[0], "name": "Oatmeal", "serving_size": 100, "unit": "g", "nutrition": DEMO_FOODS[0]["nutrition"]},
        {"id": food_ids[1], "name": "Greek Yogurt", "serving_size": 150, "unit": "g", "nutrition": DEMO_FOODS[1]["nutrition"]},
        {"id": food_ids[2], "name": "Banana", "serving_size": 118, "unit": "g", "nutrition": DEMO_FOODS[2]["nutrition"]},
        {"id": food_ids[3], "name": "Chicken Breast", "serving_size": 100, "unit": "g", "nutrition": DEMO_FOODS[3]["nutrition"]},
        {"id": food_ids[4], "name": "Brown Rice", "serving_size": 100, "unit": "g", "nutrition": DEMO_FOODS[4]["nutrition"]},
    ]
    
    # Realistic 2-week meal patterns
    meal_patterns = [
        # Day 1 pattern
        [
            {"food_idx": 0, "meal_type": "breakfast", "multiplier": 1.0},  # Oatmeal
            {"food_idx": 2, "meal_type": "snack", "multiplier": 1.0},     # Banana
            {"food_idx": 3, "meal_type": "lunch", "multiplier": 1.3},     # Chicken
            {"food_idx": 4, "meal_type": "lunch", "multiplier": 1.5},     # Rice
            {"food_idx": 3, "meal_type": "dinner", "multiplier": 1.2},    # Chicken
            {"food_idx": 1, "meal_type": "snack", "multiplier": 0.8},     # Yogurt
        ],
        # Day 2 pattern
        [
            {"food_idx": 1, "meal_type": "breakfast", "multiplier": 1.0}, # Yogurt
            {"food_idx": 2, "meal_type": "breakfast", "multiplier": 0.8}, # Banana
            {"food_idx": 3, "meal_type": "lunch", "multiplier": 1.2},     # Chicken
            {"food_idx": 4, "meal_type": "lunch", "multiplier": 1.3},     # Rice
            {"food_idx": 0, "meal_type": "snack", "multiplier": 0.5},     # Oatmeal
            {"food_idx": 3, "meal_type": "dinner", "multiplier": 1.4},    # Chicken
        ],
        # Day 3 pattern
        [
            {"food_idx": 0, "meal_type": "breakfast", "multiplier": 1.2}, # Oatmeal
            {"food_idx": 1, "meal_type": "snack", "multiplier": 0.7},     # Yogurt
            {"food_idx": 3, "meal_type": "lunch", "multiplier": 1.1},     # Chicken
            {"food_idx": 4, "meal_type": "lunch", "multiplier": 1.4},     # Rice
            {"food_idx": 2, "meal_type": "snack", "multiplier": 1.0},     # Banana
            {"food_idx": 3, "meal_type": "dinner", "multiplier": 1.3},    # Chicken
        ],
        # Day 4 pattern
        [
            {"food_idx": 1, "meal_type": "breakfast", "multiplier": 1.1}, # Yogurt
            {"food_idx": 2, "meal_type": "breakfast", "multiplier": 0.9}, # Banana
            {"food_idx": 3, "meal_type": "lunch", "multiplier": 1.4},     # Chicken
            {"food_idx": 4, "meal_type": "lunch", "multiplier": 1.2},     # Rice
            {"food_idx": 0, "meal_type": "snack", "multiplier": 0.6},     # Oatmeal
            {"food_idx": 3, "meal_type": "dinner", "multiplier": 1.1},    # Chicken
        ],
    ]
    
    total_logs_created = 0
    
    async with aiohttp.ClientSession() as session:
        # Create logs for past 14 days
        for day_offset in range(14):
            log_date = today - timedelta(days=day_offset)
            pattern = meal_patterns[day_offset % len(meal_patterns)]
            
            print(f"📅 Creating logs for {log_date}...")
            
            for meal in pattern:
                food = foods_data[meal["food_idx"]]
                amount = food["serving_size"] * meal["multiplier"]
                
                # Calculate nutrition based on actual amount
                nutrition = {}
                for key, value in food["nutrition"].items():
                    if key == "carbohydrates":
                        nutrition["carbs"] = round(value * meal["multiplier"], 1)
                    else:
                        nutrition[key] = round(value * meal["multiplier"], 1)
                
                log_data = {
                    "date": log_date.isoformat(),
                    "meal_type": meal["meal_type"],
                    "food_id": food["id"],
                    "food_name": food["name"],
                    "amount": round(amount, 1),
                    "unit": food["unit"],
                    "nutrition": nutrition
                }
                
                try:
                    async with session.post(f"{API_BASE}/food-logs/", 
                                           headers=HEADERS, 
                                           json=log_data) as response:
                        if response.status == 200:
                            total_logs_created += 1
                            print(f"  ✓ {meal['meal_type']}: {food['name']} ({amount:.1f}{food['unit']})")
                        elif response.status == 429:
                            print("  ⏳ Rate limited, waiting...")
                            await asyncio.sleep(2)
                            continue
                        else:
                            text = await response.text()
                            print(f"  ✗ Failed to create log: {text[:100]}...")
                except Exception as e:
                    print(f"  ✗ Error creating log: {str(e)}")
                
                # Small delay to avoid overwhelming the server
                await asyncio.sleep(0.2)
            
            # Longer pause between days
            await asyncio.sleep(1)
    
    print(f"✅ Created {total_logs_created} food log entries across 14 days!")
    return total_logs_created

async def create_comprehensive_water_logs():
    """Create water logs for past 2 weeks with realistic daily patterns"""
    print("💧 Creating comprehensive water logs for past 2 weeks...")
    
    # Current time: July 27, 2025 8:55 PM EST
    today = date(2025, 7, 27)
    
    async with aiohttp.ClientSession() as session:
        for day_offset in range(14):
            log_date = today - timedelta(days=day_offset)
            
            # Vary daily water intake (48-80 fl oz) with some weekend variation
            is_weekend = log_date.weekday() >= 5  # Saturday = 5, Sunday = 6
            base_intake = 68 if is_weekend else 72  # Slightly less on weekends
            daily_variation = (day_offset % 7) * 2  # Weekly pattern
            daily_water = base_intake + daily_variation + (day_offset % 3) * 3
            
            water_data = {
                "date": log_date.isoformat(),
                "amount": float(daily_water)
            }
            
            try:
                async with session.post(f"{API_BASE}/water-logs/", 
                                       headers=HEADERS, 
                                       json=water_data) as response:
                    if response.status == 200:
                        print(f"  ✓ {log_date}: {daily_water} fl oz")
                    elif response.status == 429:
                        print("  ⏳ Rate limited on water logs, waiting...")
                        await asyncio.sleep(2)
                        continue
                    else:
                        text = await response.text()
                        print(f"  ✗ Failed to create water log: {text[:50]}...")
            except Exception as e:
                print(f"  ✗ Error creating water log: {str(e)}")
            
            await asyncio.sleep(0.3)  # Small delay between requests

async def create_comprehensive_weight_logs():
    """Create weight logs for past 2 weeks with realistic weight progression"""
    print("⚖️ Creating comprehensive weight logs for past 2 weeks...")
    
    # Current time: July 27, 2025 8:55 PM EST
    today = date(2025, 7, 27)
    base_weight = 75.0  # Starting weight (kg)
    
    async with aiohttp.ClientSession() as session:
        for day_offset in range(14):
            log_date = today - timedelta(days=day_offset)
            
            # Simulate realistic weight progression with daily fluctuations
            # Gradual trend down with natural daily variation
            trend_change = -0.05 * day_offset  # Gradual 0.7kg loss over 2 weeks
            daily_fluctuation = (day_offset % 3 - 1) * 0.3  # ±0.3kg daily variation
            weekend_effect = 0.2 if log_date.weekday() >= 5 else 0  # Weekend water retention
            
            current_weight = base_weight + trend_change + daily_fluctuation + weekend_effect
            current_weight = round(current_weight, 1)
            
            weight_data = {
                "date": log_date.isoformat(),
                "weight": current_weight
            }
            
            try:
                async with session.post(f"{API_BASE}/weight-logs/", 
                                       headers=HEADERS, 
                                       json=weight_data) as response:
                    if response.status == 200:
                        print(f"  ✓ {log_date}: {current_weight}kg")
                    elif response.status == 429:
                        print("  ⏳ Rate limited on weight logs, waiting...")
                        await asyncio.sleep(2)
                        continue
                    else:
                        text = await response.text()
                        print(f"  ✗ Failed to create weight log: {text[:50]}...")
            except Exception as e:
                print(f"  ✗ Error creating weight log: {str(e)}")
            
            await asyncio.sleep(0.3)  # Small delay between requests

async def main():
    """Main function to create comprehensive demo data"""
    print("🚀 Starting comprehensive demo data creation for nutrivize@gmail.com...")
    print("📅 Creating 2 weeks of realistic meal tracking data")
    print("=" * 50)
    
    try:
        # Step 1: Create foods sequentially
        food_ids = await create_foods_sequentially()
        
        # Step 2: Create comprehensive food logs
        total_logs = await create_comprehensive_food_logs(food_ids)
        
        # Step 3: Create comprehensive water logs (14 days)
        await create_comprehensive_water_logs()
        
        # Step 4: Create comprehensive weight logs (14 days) 
        await create_comprehensive_weight_logs()
        
        print("=" * 50)
        print("✅ Demo data creation completed!")
        print(f"📊 Created {len(food_ids)} foods with {total_logs} food log entries")
        print("📈 Generated 2 weeks of comprehensive meal tracking data")
        print("💧 Water logs: 14 days with realistic daily patterns")
        print("⚖️ Weight logs: 14 days with realistic progression trends")
        print("🎉 Demo user has extensive data for presentation!")
        
    except Exception as e:
        print(f"❌ Error during demo data creation: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
