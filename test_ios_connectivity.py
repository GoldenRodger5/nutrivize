#!/usr/bin/env python3
import socket
import requests
import json

def get_local_ip():
    """Get the local IP address of this machine"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 80))
    ip = s.getsockname()[0]
    s.close()
    return ip

def test_endpoint(base_url, endpoint, method="GET", data=None, headers=None):
    """Test if an endpoint is reachable"""
    url = f"{base_url}{endpoint}"
    print(f"Testing {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:100]}...")
        return True
    except requests.exceptions.RequestException as e:
        print(f"  Error: {str(e)}")
        return False

def main():
    local_ip = get_local_ip()
    print(f"Local machine IP: {local_ip}")
    
    # The URLs the Swift app is trying to use
    urls = [
        f"http://{local_ip}:5001",
        "http://0.0.0.0:5001",
        "http://localhost:5001",
        "http://127.0.0.1:5001"
    ]
    
    # Try a simple GET request to each URL
    for base_url in urls:
        print(f"\nTesting connectivity to {base_url}")
        
        # Test root endpoint
        root_reachable = test_endpoint(base_url, "/")
        
        # Only test API endpoints if root is reachable
        if root_reachable:
            # Test Swift login endpoint
            print("\nTesting Swift login endpoint")
            login_data = {
                "email": "isaacmineo@gmail.com",
                "password": "Buddydog41",
                "device_id": "test-device"
            }
            test_endpoint(
                base_url, 
                "/api/swift/login", 
                method="POST", 
                data=login_data
            )
            
            # Test HealthKit batch upload endpoint
            print("\nTesting HealthKit batch upload endpoint (without auth)")
            health_data = {
                "entries": [
                    {
                        "user_id": "GME7nGpJQRc2v9T057vJ4oyqAJN2",
                        "date": "2025-05-18T04:00:00Z",
                        "date_key": "2025-05-18",
                        "steps": 1500.0,
                        "calories": 120.0,
                        "distance": 1200.0,
                        "exercise_minutes": 10.0,
                        "resting_heart_rate": 65.0,
                        "walking_heart_rate": 100.0,
                        "sleep_hours": 7.0,
                        "source": "Connectivity Test"
                    }
                ]
            }
            
            test_endpoint(
                base_url, 
                "/api/swift/healthkit/batch-upload", 
                method="POST", 
                data=health_data
            )
    
    print("\nConnectivity testing completed")

if __name__ == "__main__":
    main() 