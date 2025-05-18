import pymongo

def main():
    """List all collections in the MongoDB database"""
    print("Connecting to MongoDB database...")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        
        # Access the database
        db = client["nutrivize"]
        
        # Get all collection names
        collection_names = db.list_collection_names()
        
        if not collection_names:
            print("No collections found in the database.")
            return
        
        print(f"Found {len(collection_names)} collections:")
        for name in sorted(collection_names):
            count = db[name].count_documents({})
            print(f"  {name}: {count} documents")
            
            # For collections with reasonable size, print a sample document
            if 0 < count <= 100:
                sample = db[name].find_one()
                if sample:
                    print(f"    Sample document keys: {', '.join(sample.keys())}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main() 