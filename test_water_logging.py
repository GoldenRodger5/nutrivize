#!/usr/bin/env python3
"""
Quick test script for water logging functionality
"""

import asyncio
import httpx
from datetime import date

BASE_URL = "http://localhost:8000"

async def test_water_logging():
    """Test water logging endpoint"""
    async with httpx.AsyncClient() as client:
        # Test data
        water_data = {
            "date": date.today().isoformat(),
            "amount": 16.0,  # 16 fl oz
            "notes": "Test log"
        }
        
        # This would normally require authentication
        # For now just test if the endpoint structure is correct
        print(f"Testing water logging with data: {water_data}")
        print(f"Date format: {water_data['date']}")
        print("Note: This requires authentication, so it will fail, but we can check the format")

if __name__ == "__main__":
    asyncio.run(test_water_logging())
