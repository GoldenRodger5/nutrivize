from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.client = None
        self.db = None
        
    def connect(self):
        """Connect to MongoDB"""
        if self.client is None:
            mongodb_url = os.getenv("MONGODB_URL")
            if not mongodb_url:
                raise ValueError("MONGODB_URL environment variable not set")
            
            # Simple connection options for MongoDB Atlas
            try:
                
                self.client = MongoClient(
                    mongodb_url,
                    serverSelectionTimeoutMS=120000,  # 2 minutes
                    connectTimeoutMS=120000,          # 2 minutes  
                    socketTimeoutMS=120000            # 2 minutes
                )
                self.db = self.client.get_default_database()
                
                # Test connection
                self.client.admin.command('ping')
                print("✅ Connected to MongoDB successfully")
                
            except Exception as e:
                print(f"❌ MongoDB connection failed: {e}")
                # For development, we can continue without MongoDB
                print("⚠️  Continuing in development mode without database")
                self.client = None
                self.db = None
                return None
            
        return self.db
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            print("🔌 Disconnected from MongoDB")

# Global database manager
db_manager = DatabaseManager()

def get_database():
    """Get database instance"""
    return db_manager.connect()
