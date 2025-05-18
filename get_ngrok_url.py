#!/usr/bin/env python3
import requests
import json
import sys

def get_ngrok_url():
    """Get the current ngrok URL from the local ngrok API"""
    try:
        # Try to fetch the current tunnel info from the ngrok API
        response = requests.get("http://localhost:4040/api/tunnels")
        
        # If successful, parse the response
        if response.status_code == 200:
            tunnels = response.json()["tunnels"]
            
            # Filter for HTTPS tunnels
            https_tunnels = [t for t in tunnels if t["proto"] == "https"]
            
            if https_tunnels:
                # Return the public URL of the first HTTPS tunnel
                return https_tunnels[0]["public_url"]
            elif tunnels:
                # If no HTTPS tunnels, return the first tunnel
                return tunnels[0]["public_url"]
            else:
                return "No active tunnels found"
        else:
            return f"Error: {response.status_code}"
    except requests.exceptions.ConnectionError:
        return "Error: Cannot connect to ngrok API. Is ngrok running?"
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    ngrok_url = get_ngrok_url()
    
    # If we found a URL, format it for Swift
    if ngrok_url.startswith("http"):
        # Strip trailing slash if present
        if ngrok_url.endswith('/'):
            ngrok_url = ngrok_url[:-1]
            
        print("\n===== NGROK URL INFO =====")
        print(f"Current ngrok URL: {ngrok_url}")
        print("\nTo use this URL in your Swift app, update NutrivizeAPIClient.swift:")
        print("\nprivate let deviceURLs = [")
        print(f'    "{ngrok_url}/api",  // ngrok tunnel')
        print('    "https://192.168.4.124:5002/api",  // Physical device - HTTPS wrapper')
        print('    "http://192.168.4.124:5001/api",  // Physical device - local network IP')
        print(']')
        print("\n==========================\n")
    else:
        print(f"Error: {ngrok_url}")
        print("Make sure ngrok is running with: ngrok http http://localhost:5001")
        sys.exit(1)
        
if __name__ == "__main__":
    main() 