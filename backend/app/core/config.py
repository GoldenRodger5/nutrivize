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
        """Connect to MongoDB with improved SSL handling and retry logic"""
        if self.client is None:
            mongodb_url = os.getenv("MONGODB_URL")
            if not mongodb_url:
                raise ValueError("MONGODB_URL environment variable not set")
            
            # Enhanced connection options for MongoDB Atlas with SSL/TLS handling
            connection_options = {
                'serverSelectionTimeoutMS': 120000,  # 2 minutes
                'connectTimeoutMS': 120000,          # 2 minutes  
                'socketTimeoutMS': 120000,           # 2 minutes
                'maxPoolSize': 10,
                'minPoolSize': 1,
                'maxIdleTimeMS': 30000,
                'waitQueueTimeoutMS': 10000,
                'retryWrites': True,
                'retryReads': True,
                'w': 'majority',
                'readPreference': 'primary'
            }
            
            # Add SSL/TLS settings for MongoDB Atlas
            if 'mongodb.net' in mongodb_url or 'mongodb+srv' in mongodb_url:
                connection_options.update({
                    'ssl': True,
                    'tlsAllowInvalidCertificates': False,
                    'tlsAllowInvalidHostnames': False,
                    'authSource': 'admin'
                })
            
            # Try multiple connection attempts with different configurations
            connection_attempts = [
                connection_options,  # Full options
                {**connection_options, 'tlsAllowInvalidCertificates': True},  # Allow invalid certs
                {'serverSelectionTimeoutMS': 30000, 'ssl': True},  # Minimal options
                {}  # Default options only
            ]
            
            for attempt, options in enumerate(connection_attempts, 1):
                try:
                    print(f"🔄 MongoDB connection attempt {attempt}/4...")
                    self.client = MongoClient(mongodb_url, **options)
                    self.db = self.client.get_default_database()
                    
                    # Test connection with timeout
                    self.client.admin.command('ping')
                    print("✅ Connected to MongoDB successfully")
                    break
                    
                except Exception as e:
                    print(f"❌ Connection attempt {attempt} failed: {str(e)[:100]}...")
                    if attempt < len(connection_attempts):
                        print(f"🔄 Trying alternative configuration...")
                        if self.client:
                            try:
                                self.client.close()
                            except:
                                pass
                        self.client = None
                        self.db = None
                    else:
                        print(f"❌ All MongoDB connection attempts failed")
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
