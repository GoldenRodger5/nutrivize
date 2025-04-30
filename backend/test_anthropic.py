import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_anthropic():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("API key not found. Make sure ANTHROPIC_API_KEY is set in your environment.")
        return
    
    print(f"Using API key: {api_key[:5]}...")
    
    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-5-haiku-20241022",
                "messages": [{"role": "user", "content": "Tell me a joke about food"}],
                "max_tokens": 1000
            }
        )
        
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {result['content'][0]['text']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_anthropic() 