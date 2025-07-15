---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.

Whenever you test the API, you should use the following instructions:
- Use the provided auth key for authentication. This is necesssary to access the endpoints.
AUTHENTICATION:
To authenticate with the API, you need to obtain an auth key. This token expires after a certain period. You need this key in order to test endpoints. You can do this by
Use this to get the auth key: curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "isaacmineo@gmail.com",
    "password": "Buddydog41"
  }'



  REMEMBER:

- We are using FastAPI for the backend.
- We are using MongoDB for the database.
- We are using firebase for authentication.
- We are using user separation for the database.
- We are configured for both local testing and render testing
- For local testing, the API is running on http://localhost:8000 and the start command is ./start-nutrivize.sh to start the backend and frontend.
- This is the claude model we are using: claude-sonnet-4-20250514 
- Whenever you are tasked with testing endpoints or functionalities, always check first the correct way to send the request, the expected response, and any specific parameters that need to be included. This is crucial to ensure that the tests are accurate and effective.

