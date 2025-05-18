import sys
import os
sys.path.append(os.path.abspath("."))
from backend.app.database import get_database

def main():
    print("Verifying HealthKit data in MongoDB...")
    
    # Get the database connection
    db = get_database()
    
    # List collections
    collections = db.list_collection_names()
    print(f"Collections: {', '.join(collections)}")
    
    # Count HealthKit entries
    count = db.healthkit_data.count_documents({})
    print(f"Total HealthKit entries: {count}")
    
    # Check for zero values
    zero_count = db.healthkit_data.count_documents({"steps": 0, "calories": 0})
    print(f"Entries with zero values: {zero_count}")
    
    # List all entries
    print("\nAll entries:")
    for doc in db.healthkit_data.find().sort("date_key", 1):
        print(f"Entry: {doc.get('date_key')} | Steps: {doc.get('steps')} | Calories: {doc.get('calories')} | Source: {doc.get('source')}")

if __name__ == "__main__":
    main() 