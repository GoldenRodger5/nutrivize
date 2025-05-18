import requests
import subprocess
import time
import sys
import os

def is_server_running(url="http://localhost:5001"):
    """Check if the server is running by making a request to it"""
    try:
        response = requests.get(url, timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def start_server():
    """Start the backend server"""
    print("Starting the backend server...")
    
    # Change to the backend directory
    os.chdir("../backend")
    
    # Start the server (adjust command if needed)
    server_process = subprocess.Popen(
        ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"],
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for server to start
    time.sleep(3)
    
    # Check if server started successfully
    if is_server_running():
        print("Backend server started successfully!")
        return server_process
    else:
        print("Failed to start the server!")
        # Print any error output
        stderr = server_process.stderr.read().decode('utf-8')
        print(f"Error output: {stderr}")
        return None

def main():
    """Main function to check and start the server if needed"""
    print("Checking if the backend server is running...")
    
    if is_server_running():
        print("Backend server is already running.")
    else:
        print("Backend server is not running.")
        server_process = start_server()
        
        if not server_process:
            print("Exiting...")
            sys.exit(1)
    
    print("Ready to fetch health data!")

if __name__ == "__main__":
    main() 