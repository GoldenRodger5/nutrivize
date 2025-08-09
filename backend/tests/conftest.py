"""
Test configuration and fixtures for Nutrivize V2 backend tests
"""
import asyncio
import pytest
import httpx
from typing import AsyncGenerator
from unittest.mock import Mock, AsyncMock
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.models.user import UserResponse, OnboardingBasicProfile

# Test configuration
TEST_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Create async HTTP client for testing"""
    async with httpx.AsyncClient(base_url=TEST_BASE_URL) as client:
        yield client

@pytest.fixture
async def auth_headers(client: httpx.AsyncClient):
    """Get authentication headers for test requests"""
    # Mock successful login
    login_response = await client.post("/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    
    if login_response.status_code == 200:
        token = login_response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    # Return mock headers for testing
    return {"Authorization": "Bearer test-token"}

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

# Database cleanup
@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Clean up test data after each test"""
    yield
    # Add cleanup logic here if needed
    pass
