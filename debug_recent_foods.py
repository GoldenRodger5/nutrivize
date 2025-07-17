import asyncio
import os
import sys
from datetime import datetime, timedelta, date

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)

from app.services.food_log_service import food_log_service

async def debug_recent_foods():
    """Debug recent foods functionality"""
    
    # Test user ID (use a real one from your database)
    test_user_id = "uJLgBhzGV6f8a1YaJhN8r0yJZs23"  # Replace with actual user ID
    
    # Calculate date range (extend to 30 days to find some data)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    print(f"🔍 Debugging recent foods for user: {test_user_id}")
    print(f"📅 Date range: {start_date} to {end_date}")
    
    try:
        # Get food logs from the specified date range
        daily_summaries = await food_log_service.get_date_range_logs(test_user_id, start_date, end_date)
        
        print(f"📊 Got {len(daily_summaries)} daily summaries")
        
        for i, daily_summary in enumerate(daily_summaries):
            print(f"\n📅 Day {i+1} ({daily_summary.date}):")
            print(f"   🍽️  Total meals: {len(daily_summary.meals)}")
            
            for j, meal in enumerate(daily_summary.meals):
                print(f"   Meal {j+1}:")
                print(f"     - Food ID: {meal.food_id}")
                print(f"     - Food Name: {meal.food_name}")
                print(f"     - Amount: {meal.amount} {meal.unit}")
                print(f"     - Meal Type: {meal.meal_type}")
                print(f"     - Logged At: {meal.logged_at}")
                
        # Test aggregation logic
        recent_foods_map = {}
        
        for daily_summary in daily_summaries:
            for meal in daily_summary.meals:
                food_id = meal.food_id
                food_name = meal.food_name
                amount = meal.amount
                unit = meal.unit
                logged_at = meal.logged_at
                
                if food_id and food_name:
                    if food_id in recent_foods_map:
                        recent_foods_map[food_id]["usage_count"] += 1
                        # Update last_used to the most recent usage
                        if logged_at > recent_foods_map[food_id]["last_used"]:
                            recent_foods_map[food_id]["last_used"] = logged_at
                            recent_foods_map[food_id]["serving_size"] = amount
                            recent_foods_map[food_id]["serving_unit"] = unit
                    else:
                        recent_foods_map[food_id] = {
                            "food_id": food_id,
                            "food_name": food_name,
                            "serving_size": amount,
                            "serving_unit": unit,
                            "last_used": logged_at,
                            "usage_count": 1
                        }
        
        print(f"\n📋 Aggregated recent foods: {len(recent_foods_map)} unique foods")
        
        for food_id, food_data in recent_foods_map.items():
            print(f"   🥗 {food_data['food_name']} (ID: {food_id})")
            print(f"       Used {food_data['usage_count']} times")
            print(f"       Last used: {food_data['last_used']}")
            print(f"       Serving: {food_data['serving_size']} {food_data['serving_unit']}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_recent_foods())
