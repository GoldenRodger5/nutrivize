from backend.app.database import get_database
from datetime import datetime
import json

def main():
    print("Verifying HealthKit data in MongoDB...")
    
    # Get the database connection using the backend's function
    db = get_database()
    
    # Check for healthkit_data collection
    if "healthkit_data" not in db.list_collection_names():
        print("No healthkit_data collection found!")
        return
    
    # Get count of documents
    total_count = db.healthkit_data.count_documents({})
    print(f"Found {total_count} HealthKit data entries")
    
    if total_count == 0:
        print("No data found!")
        return
    
    # Check for user IDs
    user_ids = db.healthkit_data.distinct("user_id")
    print(f"User IDs: {', '.join(user_ids)}")
    
    # Check for sources
    sources = db.healthkit_data.distinct("source")
    print(f"Sources: {', '.join(sources)}")
    
    # Check date range
    earliest = db.healthkit_data.find_one({}, sort=[("date", 1)])
    latest = db.healthkit_data.find_one({}, sort=[("date", -1)])
    
    if earliest and latest:
        earliest_date = earliest.get("date")
        latest_date = latest.get("date")
        print(f"Date range: {earliest_date.strftime('%Y-%m-%d')} to {latest_date.strftime('%Y-%m-%d')}")
    
    # Check for zero values
    zero_count = db.healthkit_data.count_documents({"steps": 0, "calories": 0})
    print(f"Entries with zero values: {zero_count}")
    
    # Show all entries
    print("\nAll entries:")
    cursor = db.healthkit_data.find().sort("date_key", 1)
    for doc in cursor:
        doc_id = str(doc.pop("_id"))
        date_str = doc.get("date").strftime("%Y-%m-%d") if isinstance(doc.get("date"), datetime) else doc.get("date")
        print(f"Entry ID: {doc_id} | Date: {date_str} | Date Key: {doc.get('date_key')}")
        print(f"  Steps: {doc.get('steps')} | Calories: {doc.get('calories')} | Source: {doc.get('source')}")

if __name__ == "__main__":
    main() 