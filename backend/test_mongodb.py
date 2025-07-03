#!/usr/bin/env python3
"""
Simple MongoDB connection test
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_basic_connection():
    """Test basic MongoDB connection"""
    print("🔍 Testing basic MongoDB connection...")
    
    mongodb_url = os.getenv("MONGODB_URL")
    print(f"📍 MongoDB URL: {mongodb_url}")
    
    if not mongodb_url:
        print("❌ MONGODB_URL environment variable not set")
        return False
    
    try:
        # Basic connection
        print("⚡ Attempting basic connection...")
        client = MongoClient(mongodb_url)
        
        # Test ping
        print("🏓 Testing ping...")
        client.admin.command('ping')
        print("✅ Basic connection successful!")
        
        # Test database access
        db = client.get_default_database()
        print(f"📊 Database name: {db.name}")
        
        # List collections
        collections = db.list_collection_names()
        print(f"📋 Collections: {collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_ssl_connection():
    """Test MongoDB connection with explicit SSL settings"""
    print("\n🔒 Testing MongoDB connection with SSL settings...")
    
    mongodb_url = os.getenv("MONGODB_URL")
    
    try:
        # Connection with explicit SSL settings
        client = MongoClient(
            mongodb_url,
            tls=True,
            tlsAllowInvalidCertificates=False,
            serverSelectionTimeoutMS=120000,  # 2 minutes
            connectTimeoutMS=120000,        # 2 minutes
            socketTimeoutMS=120000          # 2 minutes
        )
        
        # Test ping
        client.admin.command('ping')
        print("✅ SSL connection successful!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ SSL connection failed: {e}")
        return False

def test_simple_connection():
    """Test the simplest possible connection"""
    print("\n🎯 Testing simplest connection...")
    
    mongodb_url = os.getenv("MONGODB_URL")
    
    try:
        # Simplest connection possible
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=120000)  # 2 minutes
        client.admin.command('ping')
        print("✅ Simple connection successful!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Simple connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 MongoDB Connection Test\n")
    
    # Test different connection methods
    test_basic_connection()
    test_simple_connection()
    test_ssl_connection()
    
    print("\n🏁 Test complete!")
