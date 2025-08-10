"""
Enhanced test configuration for Nutrivize V2 backend tests
"""
import asyncio
import pytest
import httpx
from typing import AsyncGenerator
from unittest.mock import Mock, AsyncMock
import os
import sys
import requests
import time
import random
from functools import wraps

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.models.user import UserResponse, OnboardingBasicProfile

# Test configuration
TEST_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "isaacmineo@gmail.com"
TEST_USER_PASSWORD = "Buddydog41"

# Rate limiting configuration
MIN_REQUEST_DELAY = 0.5  # Minimum delay between requests
MAX_REQUEST_DELAY = 1.5  # Maximum delay between requests
RATE_LIMIT_BACKOFF = 2.0  # Backoff delay when rate limited
MAX_RETRIES = 3  # Maximum retries for rate limited requests

def check_server_running(url: str = TEST_BASE_URL, max_retries: int = 3) -> bool:
    """Check if the API server is running"""
    for i in range(max_retries):
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                return True
        except:
            if i < max_retries - 1:
                time.sleep(2)
            continue
    return False

def rate_limited_request(func):
    """Decorator to handle rate limiting in test requests"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        for attempt in range(MAX_RETRIES):
            try:
                # Add random delay to avoid hitting rate limits
                delay = random.uniform(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY)
                await asyncio.sleep(delay)
                
                result = await func(*args, **kwargs)
                
                # Check if we hit rate limit
                if hasattr(result, 'status_code') and result.status_code == 429:
                    if attempt < MAX_RETRIES - 1:
                        print(f"Rate limited, backing off for {RATE_LIMIT_BACKOFF} seconds...")
                        await asyncio.sleep(RATE_LIMIT_BACKOFF * (attempt + 1))
                        continue
                
                return result
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RATE_LIMIT_BACKOFF)
                    continue
                raise e
        return result
    return wrapper

async def safe_request(client: httpx.AsyncClient, method: str, url: str, **kwargs):
    """Make a request with rate limiting protection"""
    delay = random.uniform(MIN_REQUEST_DELAY, MAX_REQUEST_DELAY)
    await asyncio.sleep(delay)
    
    for attempt in range(MAX_RETRIES):
        try:
            response = await client.request(method, url, **kwargs)
            
            if response.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    backoff_time = RATE_LIMIT_BACKOFF * (2 ** attempt)
                    print(f"Rate limited, backing off for {backoff_time} seconds...")
                    await asyncio.sleep(backoff_time)
                    continue
            
            return response
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RATE_LIMIT_BACKOFF)
                continue
            raise e
    
    return response

@pytest.fixture(scope="session")
def server_status():
    """Check if server is running for the test session"""
    return check_server_running()

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client(server_status) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Create async HTTP client for testing with rate limiting support"""
    if not server_status:
        pytest.skip("Server not running - skipping integration tests")
    
    # Custom client with longer timeout and retry configuration
    async with httpx.AsyncClient(
        base_url=TEST_BASE_URL, 
        timeout=httpx.Timeout(60.0),  # Increased timeout for rate limited requests
        follow_redirects=True,
        limits=httpx.Limits(max_connections=5, max_keepalive_connections=2)  # Limit concurrent connections
    ) as client:
        yield client

@pytest.fixture
async def auth_token(client: httpx.AsyncClient):
    """Get authentication token for test requests with rate limiting"""
    try:
        # Add delay before auth request
        await asyncio.sleep(random.uniform(0.5, 1.0))
        
        login_response = await safe_request(
            client, "POST", "/auth/login", 
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if login_response.status_code == 200:
            return login_response.json().get("token")
        else:
            print(f"Login failed with status: {login_response.status_code}")
            return None
    except Exception as e:
        print(f"Auth token error: {e}")
        return None

@pytest.fixture
async def auth_headers(auth_token):
    """Get authentication headers for test requests"""
    if auth_token:
        return {"Authorization": f"Bearer {auth_token}"}
    return {"Authorization": "Bearer mock-token-for-testing"}

@pytest.fixture
def sample_user_profile():
    """Sample user profile for testing"""
    return UserResponse(
        uid="test_user_123",
        email=TEST_USER_EMAIL,
        name="Test User",
        preferences={
            "age": 25,
            "gender": "other", 
            "height_cm": 175,
            "weight_kg": 70,
            "activity_level": "moderate",
            "health_goals": ["weight_loss", "muscle_gain"],
            "dietary_restrictions": ["vegetarian"],
            "daily_calorie_goal": 2000,
            "macro_targets": {
                "protein_percent": 30,
                "carbs_percent": 45,
                "fat_percent": 25
            }
        }
    )

@pytest.fixture
def sample_onboarding_data():
    """Sample onboarding data for testing"""
    return OnboardingBasicProfile(
        age=25,
        gender="other",
        height=175,
        weight=70,
        activity_level="moderate",
        health_conditions=[],
        medications=[]
    )

@pytest.fixture
def mock_firebase_user():
    """Mock Firebase user for authentication testing"""
    mock_user = Mock()
    mock_user.uid = "test_firebase_uid"
    mock_user.email = TEST_USER_EMAIL
    mock_user.email_verified = True
    return mock_user

@pytest.fixture
def mock_mongodb():
    """Mock MongoDB connection for testing"""
    mock_db = AsyncMock()
    mock_collection = AsyncMock()
    mock_db.users = mock_collection
    mock_db.food_logs = mock_collection
    mock_db.preferences = mock_collection
    return mock_db

@pytest.fixture
def mock_pinecone():
    """Mock Pinecone service for vector testing"""
    mock_service = AsyncMock()
    mock_service.generate_embedding = AsyncMock(return_value=[0.1] * 3072)
    mock_service.search_similar = AsyncMock(return_value=[])
    return mock_service

@pytest.fixture
def mock_openai():
    """Mock OpenAI service for AI testing"""
    mock_service = AsyncMock()
    mock_service.generate_response = AsyncMock(return_value="Mock AI response")
    mock_service.analyze_nutrition = AsyncMock(return_value={
        "score": 85,
        "insights": "Good nutrition balance"
    })
    return mock_service

# Test data constants
SAMPLE_FOOD_DATA = {
    "name": "Apple",
    "brand": "Generic",
    "serving_size": "1 medium",
    "calories": 95,
    "protein": 0.5,
    "carbohydrates": 25,
    "fat": 0.3,
    "fiber": 4.4,
    "sugar": 19
}

SAMPLE_MEAL_LOG = {
    "meal_type": "breakfast",
    "foods": [
        {
            "food_id": "apple_001",
            "quantity": 1,
            "serving_size": "1 medium"
        }
    ],
    "total_calories": 95,
    "timestamp": "2024-01-01T08:00:00Z"
}

# Pytest configuration
def pytest_configure(config):
    """Configure pytest settings"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "server_required: marks tests that require the server to be running"
    )

def pytest_collection_modifyitems(config, items):
    """Automatically mark integration tests"""
    for item in items:
        # Mark tests that use client fixture as integration tests
        if "client" in item.fixturenames:
            item.add_marker(pytest.mark.integration)
            item.add_marker(pytest.mark.server_required)
        
        # Mark slow tests
        if "slow" in item.nodeid or "ai" in item.nodeid.lower():
            item.add_marker(pytest.mark.slow)

# Database cleanup
@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Clean up test data after each test"""
    yield
    # Add cleanup logic here if needed
    pass
