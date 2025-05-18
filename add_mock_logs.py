from datetime import datetime, timezone, time, timedelta
import random
from backend.app.database import get_database
from backend.app.models import log_food

# Mock foods with realistic nutritional values
mock_foods = [
    {
        "name": "Chicken Breast",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 165,
        "proteins": 31,
        "carbs": 0,
        "fats": 3.6,
        "fiber": 0,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Brown Rice",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 112,
        "proteins": 2.6,
        "carbs": 23.5,
        "fats": 0.9,
        "fiber": 1.8,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Salmon",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 208,
        "proteins": 20,
        "carbs": 0,
        "fats": 13,
        "fiber": 0,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Greek Yogurt",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 59,
        "proteins": 10,
        "carbs": 3.6,
        "fats": 0.4,
        "fiber": 0,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Sweet Potato",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 86,
        "proteins": 1.6,
        "carbs": 20.1,
        "fats": 0.1,
        "fiber": 3,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Broccoli",
        "serving_size": 100,
        "serving_unit": "g",
        "calories": 34,
        "proteins": 2.8,
        "carbs": 6.6,
        "fats": 0.4,
        "fiber": 2.6,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Almonds",
        "serving_size": 30,
        "serving_unit": "g",
        "calories": 173,
        "proteins": 6.3,
        "carbs": 6.1,
        "fats": 14.9,
        "fiber": 3.5,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    },
    {
        "name": "Eggs",
        "serving_size": 50,
        "serving_unit": "g",
        "calories": 155,
        "proteins": 12.6,
        "carbs": 1.1,
        "fats": 11.3,
        "fiber": 0,
        "source": "mock-data",
        "created_by": "IsaacMineo@gmail.com"
    }
]

def main():
    db = get_database()
    user_id = "IsaacMineo@gmail.com"
    
    # First, add these foods to the food index
    food_ids = {}
    
    # Check if foods already exist in the index and add them if they don't
    for food in mock_foods:
        existing_food = db.food_index.find_one({"name": food["name"], "created_by": user_id})
        
        if existing_food:
            food_ids[food["name"]] = existing_food["_id"]
            print(f"Food {food['name']} already exists with ID: {existing_food['_id']}")
        else:
            result = db.food_index.insert_one(food)
            food_ids[food["name"]] = result.inserted_id
            print(f"Added {food['name']} to food index with ID: {result.inserted_id}")
    
    # Set up dates for food logs (from April 24th to April 29th, 2025)
    start_date = datetime(2025, 4, 24, tzinfo=timezone.utc)
    end_date = datetime(2025, 4, 29, tzinfo=timezone.utc)
    
    date_range = []
    current_date = start_date
    
    print(f"\nGenerating food logs from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    while current_date <= end_date:
        date_range.append(current_date)
        current_date += timedelta(days=1)
    
    print(f"Total days to generate: {len(date_range)}")
    
    # Set up meal types
    meal_types = ["breakfast", "lunch", "dinner", "snack"]
    
    # Generate food logs for each date
    log_count = 0
    for log_date in date_range:
        # Convert to midnight UTC for consistent date handling
        log_date_midnight = datetime.combine(log_date.date(), time.min).replace(tzinfo=timezone.utc)
        
        print(f"\nGenerating logs for {log_date.strftime('%Y-%m-%d')}")
        
        # For each day, create 3-4 food logs
        num_logs = random.randint(3, 4)
        
        for _ in range(num_logs):
            # Pick a random food and meal type
            food_name = random.choice(list(food_ids.keys()))
            meal_type = random.choice(meal_types)
            
            # Get the food details from our mock_foods list
            food_details = next(food for food in mock_foods if food["name"] == food_name)
            
            # Create a random amount (0.5-2.0 servings)
            amount = round(random.uniform(0.5, 2.0), 1)
            
            # Calculate nutrition based on amount
            calories = round(food_details["calories"] * amount)
            proteins = round(food_details["proteins"] * amount, 1)
            carbs = round(food_details["carbs"] * amount, 1)
            fats = round(food_details["fats"] * amount, 1)
            fiber = round(food_details["fiber"] * amount, 1)
            
            # Create log entry
            log_entry = {
                "user_id": user_id,
                "date": log_date_midnight,
                "meal_type": meal_type,
                "food_id": str(food_ids[food_name]),
                "name": food_name,
                "amount": amount,
                "unit": food_details["serving_unit"],
                "calories": calories,
                "proteins": proteins,
                "carbs": carbs,
                "fats": fats,
                "fiber": fiber,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            try:
                # Insert into database
                result = db.food_logs.insert_one(log_entry)
                log_count += 1
                print(f"  Added {food_name} ({amount} {food_details['serving_unit']}) as {meal_type}")
            except Exception as e:
                print(f"  Error adding log for {food_name}: {str(e)}")
    
    print(f"\nAdded {log_count} food logs to the database")

if __name__ == "__main__":
    main() 