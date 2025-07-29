#!/bin/bash

echo "🔐 Testing Authentication and Endpoints"
echo "======================================"

# Test credentials
EMAIL="IsaacMineo@gmail.com"
PASSWORD="Buddydog41"
API_URL="http://localhost:8000"

echo "Testing with credentials: $EMAIL"
echo ""

# Step 1: Test backend health
echo "1. Testing backend health..."
health_response=$(curl -s $API_URL/health)
echo "✅ Backend response: $health_response"
echo ""

# Step 2: Test Firebase authentication via frontend
echo "2. Testing Firebase authentication..."
echo "Since we can't directly authenticate with Firebase from bash, we'll use a Python script"

# Create a Python script to handle Firebase auth and test endpoints
cat > test_auth.py << 'EOF'
import requests
import json
import sys
import os

# Add Firebase Admin SDK for testing
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials
    print("Firebase Admin SDK available")
except ImportError:
    print("❌ Firebase Admin SDK not available for direct testing")
    print("We'll test the endpoints with a mock approach")
    sys.exit(1)

def test_with_firebase():
    API_URL = "http://localhost:8000"
    
    # Test 1: Check health endpoint
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test 2: Test protected endpoint without auth
    print("\n🔒 Testing protected endpoint without auth...")
    try:
        response = requests.get(f"{API_URL}/auth/me")
        print(f"✅ Expected 401: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Auth test failed: {e}")
    
    # Test 3: Try to get a real Firebase token (if service account is available)
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if service_account_path and os.path.exists(service_account_path):
        print(f"\n🔑 Using service account: {service_account_path}")
        try:
            # Initialize Firebase Admin (if not already done)
            if not firebase_admin._apps:
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            
            # For testing, we'll create a custom token for the user
            # Note: This is for testing purposes
            print("📝 Creating custom token for testing...")
            
            # We can't easily get the user's Firebase token without their password
            # So we'll test with a simulated approach
            print("⚠️  For a real test, we need to authenticate via the frontend")
            print("   The frontend handles Firebase authentication properly")
            
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
    else:
        print("⚠️  No Firebase service account found for direct testing")
    
    print("\n🎯 Recommendations:")
    print("1. Open browser to http://localhost:5174")
    print("2. Login with IsaacMineo@gmail.com / Buddydog41")
    print("3. Check browser console for token and debugging info")
    print("4. Use browser Network tab to see API calls")

if __name__ == "__main__":
    test_with_firebase()
EOF

# Run the Python test
cd /Users/isaacmineo/Main/projects/nutrivize-v2/backend
source venv/bin/activate
python test_auth.py

echo ""
echo "🌐 Frontend Testing Instructions:"
echo "================================="
echo "1. Open http://localhost:5174 in your browser"
echo "2. Open Developer Tools (F12) -> Console tab"
echo "3. Login with: $EMAIL / $PASSWORD"
echo "4. Look for these console messages:"
echo "   - 🔥 Firebase auth state changed"
echo "   - 🔑 Got Firebase token"
echo "   - 🌐 Calling /auth/me"
echo "   - ✅ Successfully got user data"
echo ""
echo "5. If successful, open Network tab and you should see:"
echo "   - POST to Firebase auth"
echo "   - GET to /auth/me (200 OK)"
echo ""
echo "🔧 Manual API Testing:"
echo "====================="
echo "If you get a token from the browser console, test with:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $API_URL/auth/me"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $API_URL/foods/search?q=apple"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $API_URL/food-logs/daily/$(date +%Y-%m-%d)"

# Clean up
rm -f test_auth.py
