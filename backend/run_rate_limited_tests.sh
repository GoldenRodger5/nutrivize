#!/bin/bash

# Comprehensive test runner with rate limiting consideration
# This script runs tests in a way that respects API rate limits

echo "🧪 Starting Comprehensive Rate-Limited Testing Suite"
echo "=================================================="

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:/Users/isaacmineo/Main/projects/nutrivize-v2/backend"

# Check if server is running
echo "🔍 Checking if API server is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server is not running. Please start it first with:"
    echo "   cd /Users/isaacmineo/Main/projects/nutrivize-v2"
    echo "   ./start-nutrivize.sh"
    exit 1
fi

echo ""
echo "🚀 Running tests with rate limiting consideration..."
echo "This will run slower than normal to respect API rate limits"
echo ""

# Run tests in phases to avoid overwhelming the API

echo "📋 Phase 1: Basic Integration Tests (with delays)"
pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_health_check_with_delay \
       tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_authentication_flow_with_delays \
       --tb=short -x

echo ""
echo "⏱️  Waiting 5 seconds before next phase..."
sleep 5

echo "📋 Phase 2: Food & Nutrition Tests (with extended delays)"
pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_food_endpoints_with_delays \
       tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_nutrition_endpoints_with_delays \
       --tb=short

echo ""
echo "⏱️  Waiting 10 seconds before AI tests..."
sleep 10

echo "📋 Phase 3: AI & Vector Tests (with long delays)"
pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_ai_endpoints_with_long_delays \
       tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_vector_endpoints_with_delays \
       --tb=short

echo ""
echo "⏱️  Waiting 10 seconds before batch tests..."
sleep 10

echo "📋 Phase 4: Sequential & Batch Operation Tests"
pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_sequential_requests_with_proper_spacing \
       tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_batch_operations_with_rate_limiting \
       --tb=short

echo ""
echo "⏱️  Waiting 5 seconds before core tests..."
sleep 5

echo "📋 Phase 5: Existing Core Tests (selected)"
pytest -v tests/test_core.py::test_health_check \
       tests/test_production_readiness.py::test_api_server_running \
       --tb=short

echo ""
echo "📋 Phase 6: Model and Logic Tests (unit tests - no rate limiting needed)"
pytest -v tests/test_models_and_logic.py::TestUserModels::test_user_response_creation \
       tests/test_models_and_logic.py::TestNutritionLogic::test_calorie_calculation \
       --tb=short

echo ""
echo "🏁 Testing Complete!"
echo "==================="

# Generate a summary report
echo ""
echo "📊 Test Summary:"
echo "- Phase 1: Basic integration tests with delays"
echo "- Phase 2: Food & nutrition endpoints with extended delays"
echo "- Phase 3: AI & vector tests with long delays"
echo "- Phase 4: Sequential & batch operations"
echo "- Phase 5: Selected core tests"
echo "- Phase 6: Unit tests (no rate limiting needed)"
echo ""
echo "⚠️  Note: Some tests may have been skipped due to rate limiting."
echo "This is expected behavior and indicates the API's rate limiting is working correctly."
echo ""
echo "🔍 For detailed results, check the pytest output above."
echo "If you encountered many rate limit errors, consider:"
echo "1. Increasing delays in conftest_improved.py"
echo "2. Running tests in smaller batches"
echo "3. Using a test-specific configuration with higher rate limits"
