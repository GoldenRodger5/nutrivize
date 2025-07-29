#!/usr/bin/env python3
"""
Production health check script
Run this after deployment to verify all systems are working
"""

import requests
import sys
import os
from datetime import datetime

BACKEND_URL = os.getenv('BACKEND_URL', 'https://your-backend.onrender.com')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://your-frontend.onrender.com')

def check_backend():
    """Check backend health"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {str(e)}")
        return False

def check_frontend():
    """Check frontend availability"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {str(e)}")
        return False

def check_database():
    """Check database connectivity through API"""
    try:
        response = requests.get(f"{BACKEND_URL}/health/database", timeout=10)
        if response.status_code == 200:
            print("✅ Database connection is healthy")
            return True
        else:
            print(f"❌ Database check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🏥 Production Health Check")
    print("=" * 30)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Check time: {datetime.now()}")
    print()
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    database_ok = check_database()
    
    print()
    if backend_ok and frontend_ok and database_ok:
        print("🎉 All systems are healthy!")
        sys.exit(0)
    else:
        print("⚠️  Some systems are not healthy. Please investigate.")
        sys.exit(1)
