#!/usr/bin/env python3
"""
Script to create comprehensive water and weight logs for nutrivize@gmail.com user
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta, date

# API Configuration
API_BASE = "http://localhost:8000"
AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MWRkZTkzMmViYWNkODhhZmIwMDM3YmZlZDhmNjJiMDdmMDg2NmIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGVtbyBVc2VyIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2Zvb2QtdHJhY2tlci02MDk2ZCIsImF1ZCI6ImZvb2QtdHJhY2tlci02MDk2ZCIsImF1dGhfdGltZSI6MTc1MzY2Njc4NCwidXNlcl9pZCI6IjNzZE5qM0hYeGJWVmhHWU9UcE5aWXhTekt5VDIiLCJzdWIiOiIzc2ROajNIWHhiVlZoR1lPVHBOWll4U3pLeVQyIiwiaWF0IjoxNzUzNjY2Nzg0LCJleHAiOjE3NTM2NzAzODQsImVtYWlsIjoibnV0cml2aXplQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJudXRyaXZpemVAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.W8QV2k0h_E_65BtGjsiU4wssOAOJ-z3WDS-54KaksqkeLdP7Xtp_zrSePYsMyRfo4qcU6uLZUh6xXAc8fTdavZqOHN_DcGsnALDTKzHUHn-ERlYkzdnhqrGhlISfZZm_thhXzR14h3uwIyVuI-C_Pkdr1dQOElFc-qeRuAxBprc2iShUt--_78RM1H37ojJdWMi3UwyPcPudpud0CZUZ-ucU7g-tH4sP2jcv_g7_x8hFfUbaaFImxokotmnUPn5RoMqCIDTxC881RIzh1sIdFI59MTujV3QNpU71oIC7Bcl37bSEuidjF__M9lGLsadta2i-WtrvmX-HWIrvmuRNOw"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

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
            
            await asyncio.sleep(0.5)  # Small delay between requests

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
            
            await asyncio.sleep(0.5)  # Small delay between requests

async def main():
    """Create comprehensive water and weight logs"""
    print("🚀 Creating comprehensive water and weight logs for nutrivize@gmail.com...")
    print("📅 Generating 2 weeks of realistic data")
    print("=" * 60)
    
    try:
        # Create comprehensive water logs (14 days)
        await create_comprehensive_water_logs()
        
        print()  # Empty line for separation
        
        # Create comprehensive weight logs (14 days) 
        await create_comprehensive_weight_logs()
        
        print("=" * 60)
        print("✅ Water and weight logs creation completed!")
        print("💧 Water logs: 14 days with realistic daily patterns (48-80 fl oz)")
        print("⚖️ Weight logs: 14 days with realistic progression trends")
        print("🎉 Demo user now has comprehensive tracking data!")
        
    except Exception as e:
        print(f"❌ Error during log creation: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
