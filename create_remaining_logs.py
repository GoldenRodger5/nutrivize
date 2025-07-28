#!/usr/bin/env python3
"""
Script to create remaining water and weight logs for nutrivize@gmail.com user
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

async def create_remaining_logs():
    """Create remaining water and weight logs with longer delays"""
    print("🚀 Creating remaining water and weight logs...")
    print("📅 Generating data for July 13-25, 2025")
    print("=" * 60)
    
    # Current time: July 27, 2025 8:55 PM EST
    today = date(2025, 7, 27)
    
    water_logs_created = 0
    weight_logs_created = 0
    
    async with aiohttp.ClientSession() as session:
        # Create logs for July 13-25 (the ones that failed before)
        for day_offset in range(2, 15):  # Skip today and yesterday which worked
            log_date = today - timedelta(days=day_offset)
            
            print(f"📅 Creating logs for {log_date}...")
            
            # Create water log
            try:
                is_weekend = log_date.weekday() >= 5  # Saturday = 5, Sunday = 6
                base_intake = 68 if is_weekend else 72  # Slightly less on weekends
                daily_variation = (day_offset % 7) * 2  # Weekly pattern
                daily_water = base_intake + daily_variation + (day_offset % 3) * 3
                
                water_data = {
                    "date": log_date.isoformat(),
                    "amount": float(daily_water)
                }
                
                async with session.post(f"{API_BASE}/water-logs/", 
                                       headers=HEADERS, 
                                       json=water_data) as response:
                    if response.status == 200:
                        water_logs_created += 1
                        print(f"  ✓ Water: {daily_water} fl oz")
                    else:
                        text = await response.text()
                        print(f"  ✗ Water failed: {text[:50]}...")
            except Exception as e:
                print(f"  ✗ Water error: {str(e)}")
            
            # Small delay between water and weight
            await asyncio.sleep(1)
            
            # Create weight log
            try:
                base_weight = 75.0  # Starting weight (kg)
                trend_change = -0.05 * day_offset  # Gradual 0.7kg loss over 2 weeks
                daily_fluctuation = (day_offset % 3 - 1) * 0.3  # ±0.3kg daily variation
                weekend_effect = 0.2 if log_date.weekday() >= 5 else 0  # Weekend water retention
                
                current_weight = base_weight + trend_change + daily_fluctuation + weekend_effect
                current_weight = round(current_weight, 1)
                
                weight_data = {
                    "date": log_date.isoformat(),
                    "weight": current_weight
                }
                
                async with session.post(f"{API_BASE}/weight-logs/", 
                                       headers=HEADERS, 
                                       json=weight_data) as response:
                    if response.status == 200:
                        weight_logs_created += 1
                        print(f"  ✓ Weight: {current_weight}kg")
                    else:
                        text = await response.text()
                        print(f"  ✗ Weight failed: {text[:50]}...")
            except Exception as e:
                print(f"  ✗ Weight error: {str(e)}")
            
            # Longer delay between days to be gentle on the server
            await asyncio.sleep(2)
    
    print("=" * 60)
    print(f"✅ Remaining logs creation completed!")
    print(f"💧 Created {water_logs_created} additional water logs")
    print(f"⚖️ Created {weight_logs_created} additional weight logs")
    print("🎉 Demo user now has comprehensive tracking data!")

if __name__ == "__main__":
    asyncio.run(create_remaining_logs())
