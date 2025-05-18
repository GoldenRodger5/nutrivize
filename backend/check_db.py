from app.database import get_database

# Get database connection
db = get_database()

# Check all collections
print(f"Collections: {', '.join(db.list_collection_names())}")

# Check healthkit data
print(f"\nTotal HealthKit data records: {db.healthkit_data.count_documents({})}")

# Check users with data
print("\nUsers with HealthKit data:")
for user_id in db.healthkit_data.distinct("user_id"):
    record_count = db.healthkit_data.count_documents({"user_id": user_id})
    print(f"- {user_id}: {record_count} records")

# Check dates in health data
print("\nDates with HealthKit data:")
date_keys = db.healthkit_data.distinct("date_key")
for date_key in sorted(date_keys):
    count = db.healthkit_data.count_documents({"date_key": date_key})
    print(f"- {date_key}: {count} records") 