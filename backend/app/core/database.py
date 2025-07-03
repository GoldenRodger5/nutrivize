from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.database import Database
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    """MongoDB database manager"""
    
    def __init__(self):
        self.client: MongoClient = None
        self.database: Database = None
        
    def connect(self) -> Database:
        """Connect to MongoDB"""
        if self.database is not None:
            return self.database
            
        # Updated connection URI for the upgraded MongoDB cluster
        uri = "mongodb+srv://isaacmineo:1vWVKLtI4cFn1LNN@nutrivize.rbj6ly6.mongodb.net/?retryWrites=true&w=majority&appName=Nutrivize"
        
        # Create a new client and connect to the server with ServerApi
        self.client = MongoClient(uri, server_api=ServerApi('1'))
        self.database = self.client["nutrivize_v2"]
        
        # Send a ping to confirm a successful connection
        try:
            self.client.admin.command('ping')
            print("Pinged your deployment. You successfully connected to MongoDB!")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
            
        return self.database
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.client = None
            self.database = None


# Global database manager instance
db_manager = DatabaseManager()

def get_database() -> Database:
    """Get database instance"""
    return db_manager.connect()
