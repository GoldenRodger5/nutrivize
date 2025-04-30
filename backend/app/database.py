import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Load environment variables
load_dotenv()

# Get password from .env file
db_password = os.getenv("DB_PASSWORD")

uri = f"mongodb+srv://isaacmineo:{db_password}@nutrivize.rbj6ly6.mongodb.net/?retryWrites=true&w=majority&appName=Nutrivize"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Function to test connection
def test_connection():
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(e)
        return False

# Get database instance
def get_database():
    return client["nutrivize"] 