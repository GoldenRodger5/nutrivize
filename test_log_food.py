from backend.app.models import log_food
from datetime import datetime, timezone
import json

# Test log entry
test_log = {
    "user_id": "isaac_mineo",
    "date": datetime.now(timezone.utc).isoformat(),
    "meal_type": "breakfast",
    "food_id": "test_food",
    "name": "Test Food",
    "amount": 1.0,
    "unit": "serving",
    "calories": 200.0,
    "proteins": 20.0,
    "carbs": 10.0,
    "fats": 5.0,
    "fiber": 2.0,
    "notes": "Test log entry"
}

print("Testing log_food function...")
try:
    log_id = log_food(test_log)
    print(f"Successfully logged food with ID: {log_id}")
except Exception as e:
    print(f"Error logging food: {e}")
    
print("Done!") 