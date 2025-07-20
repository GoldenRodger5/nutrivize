#!/usr/bin/env python3
import asyncio
import aiohttp
import json

async def show_complete_pricing():
    base_url = "http://localhost:8000"
    auth_data = {"email": "isaacmineo@gmail.com", "password": "Buddydog41"}
    
    async with aiohttp.ClientSession() as session:
        # Login
        async with session.post(f"{base_url}/auth/login", json=auth_data) as response:
            auth_response = await response.json()
            token = auth_response.get("token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Generate fresh shopping list
        async with session.post(f"{base_url}/meal-planning/plans/healthy_maintenance_001/shopping-list", 
                              headers=headers, json={"force_regenerate": True}) as response:
            data = await response.json()
        
        print("📊 Complete Shopping List with Realistic Pricing:")
        print("=" * 70)
        
        total = 0
        for i, item in enumerate(data.get('shopping_list', []), 1):
            cost = item.get('estimated_cost', 0)
            total += cost
            name = item.get('item', 'Unknown')[:40]
            amount = item.get('amount', 0)
            unit = item.get('unit', '')[:6]
            print(f"{i:2d}. {name:42} - {amount:6.1f} {unit:6} ${cost:5.2f}")
        
        print("=" * 70)
        print(f"Total Estimated Cost: ${total:.2f}")
        print(f"Average per item: ${total/len(data.get('shopping_list', [])) if data.get('shopping_list') else 0:.2f}")

asyncio.run(show_complete_pricing())
