#!/bin/bash

echo "🔍 Testing Authentication Flow"
echo "=============================="

# Test 1: Check backend health
echo "1. Testing backend health..."
response=$(curl -s -w "%{http_code}" http://localhost:8000/health -o /tmp/health_response.txt)
if [ "$response" -eq 200 ]; then
    echo "✅ Backend is healthy"
    cat /tmp/health_response.txt
    echo ""
else
    echo "❌ Backend health check failed (HTTP $response)"
    cat /tmp/health_response.txt
    echo ""
    exit 1
fi

# Test 2: Try to access protected endpoint without auth
echo "2. Testing protected endpoint without auth..."
response=$(curl -s -w "%{http_code}" http://localhost:8000/auth/me -o /tmp/no_auth_response.txt)
if [ "$response" -eq 401 ]; then
    echo "✅ Protected endpoint correctly returns 401"
    cat /tmp/no_auth_response.txt
    echo ""
else
    echo "❌ Protected endpoint should return 401 but returned $response"
    cat /tmp/no_auth_response.txt
    echo ""
fi

# Test 3: Check frontend is running
echo "3. Testing frontend availability..."
frontend_response=$(curl -s -w "%{http_code}" http://localhost:5174/ -o /tmp/frontend_response.txt)
if [ "$frontend_response" -eq 200 ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible (HTTP $frontend_response)"
    cat /tmp/frontend_response.txt
    echo ""
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open browser to http://localhost:5174/"
echo "2. Open browser developer tools (Console tab)"
echo "3. Try to login with your Firebase credentials"
echo "4. Watch the console logs for debugging information"
echo ""
echo "Backend logs can be viewed with:"
echo "tail -f /Users/isaacmineo/Main/projects/nutrivize-v2/backend/server.log"

# Clean up temp files
rm -f /tmp/health_response.txt /tmp/no_auth_response.txt /tmp/frontend_response.txt
