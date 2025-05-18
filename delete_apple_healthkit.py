import sys
import os
sys.path.append(os.path.abspath("."))
from backend.app.database import get_database
from datetime import datetime

def main():
    """Delete all Apple HealthKit entries from MongoDB"""
    print("⚠️ DELETING ALL APPLE HEALTHKIT DATA FROM MONGODB ⚠️")
    print("This will permanently remove all Apple HealthKit data.")
    
    confirm = input("Type 'DELETE' to confirm: ")
    if confirm != "DELETE":
        print("Operation canceled.")
        return
    
    # Get the database connection
    db = get_database()
    
    # Count before deletion
    total_before = db.healthkit_data.count_documents({})
    ios_before = db.healthkit_data.count_documents({"source": "Apple HealthKit (iOS)"})
    other_before = db.healthkit_data.count_documents({"source": "Apple HealthKit"})
    
    print(f"Before deletion:")
    print(f"- Total HealthKit entries: {total_before}")
    print(f"- iOS HealthKit entries: {ios_before}")
    print(f"- Other Apple HealthKit entries: {other_before}")
    
    # Delete all Apple HealthKit entries
    result1 = db.healthkit_data.delete_many({"source": "Apple HealthKit (iOS)"})
    result2 = db.healthkit_data.delete_many({"source": "Apple HealthKit"})
    
    # Count after deletion
    total_after = db.healthkit_data.count_documents({})
    
    print(f"\nDeletion complete:")
    print(f"- Deleted {result1.deleted_count} iOS HealthKit entries")
    print(f"- Deleted {result2.deleted_count} other Apple HealthKit entries")
    print(f"- Remaining entries: {total_after}")
    
    print("\n✅ All Apple HealthKit data has been deleted.")
    print("The next data sent from Swift will be stored in fresh records.")

if __name__ == "__main__":
    main() 