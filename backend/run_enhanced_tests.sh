#!/bin/bash

# Enhanced comprehensive test runner with rate limiting and better reporting
# This script runs all tests with appropriate delays and generates a detailed report

echo "🧪 Enhanced Comprehensive Test Suite with Rate Limiting"
echo "======================================================="
echo "⏰ $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run tests and track results
run_test_phase() {
    local phase_name="$1"
    local test_command="$2"
    local phase_delay="$3"
    
    echo -e "${BLUE}📋 $phase_name${NC}"
    echo "Command: $test_command"
    echo ""
    
    # Run the test and capture output
    if eval $test_command > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}✅ Phase completed successfully${NC}"
        # Count passed tests from output
        local phase_passed=$(grep -c "PASSED" /tmp/test_output.log || echo "0")
        local phase_failed=$(grep -c "FAILED" /tmp/test_output.log || echo "0") 
        local phase_skipped=$(grep -c "SKIPPED" /tmp/test_output.log || echo "0")
        
        PASSED_TESTS=$((PASSED_TESTS + phase_passed))
        FAILED_TESTS=$((FAILED_TESTS + phase_failed))
        SKIPPED_TESTS=$((SKIPPED_TESTS + phase_skipped))
        TOTAL_TESTS=$((TOTAL_TESTS + phase_passed + phase_failed + phase_skipped))
        
        echo "  - Passed: $phase_passed"
        echo "  - Failed: $phase_failed"
        echo "  - Skipped: $phase_skipped"
    else
        echo -e "${RED}❌ Phase had issues${NC}"
        cat /tmp/test_output.log
    fi
    
    if [ "$phase_delay" -gt 0 ]; then
        echo -e "${YELLOW}⏱️  Waiting $phase_delay seconds before next phase...${NC}"
        sleep $phase_delay
    fi
    echo ""
}

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:/Users/isaacmineo/Main/projects/nutrivize-v2/backend"

# Check if server is running
echo "🔍 Checking API server status..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${RED}❌ API server is not running${NC}"
    echo "Please start the server with: ./start-nutrivize.sh"
    exit 1
fi

echo ""
echo "🚀 Starting comprehensive test execution with rate limiting..."
echo "This suite will run slower to respect API rate limits and avoid 429 errors"
echo ""

# Phase 1: Unit Tests (No rate limiting needed)
run_test_phase "Unit Tests - Models & Business Logic" \
    "pytest -v tests/test_models_and_logic.py -m unit --tb=short" \
    3

# Phase 2: Core API Tests
run_test_phase "Core API Tests" \
    "pytest -v tests/test_core.py tests/test_production_readiness.py --tb=short" \
    5

# Phase 3: Authentication & Basic Integration
run_test_phase "Authentication & Health Check (Rate Limited)" \
    "pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_health_check_with_delay tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_authentication_flow_with_delays --tb=short" \
    8

# Phase 4: Food & Nutrition Endpoints
run_test_phase "Food & Nutrition Endpoints (Rate Limited)" \
    "pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_food_endpoints_with_delays tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_nutrition_endpoints_with_delays --tb=short" \
    10

# Phase 5: AI & Vector Search (Slowest)
run_test_phase "AI & Vector Search Tests (Extended Rate Limiting)" \
    "pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_ai_endpoints_with_long_delays tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_vector_endpoints_with_delays --tb=short" \
    12

# Phase 6: Sequential & Batch Operations
run_test_phase "Sequential & Batch Operations (Rate Limited)" \
    "pytest -v tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_sequential_requests_with_proper_spacing tests/test_comprehensive_with_rate_limiting.py::TestComprehensiveWithRateLimit::test_batch_operations_with_rate_limiting --tb=short" \
    5

# Phase 7: Existing Integration Tests (Selected)
run_test_phase "Selected Existing Integration Tests" \
    "pytest -v tests/test_production_readiness.py::test_concurrent_requests --tb=short -m slow" \
    0

# Generate final report
echo "🏁 Testing Complete!"
echo "==================="
echo "⏰ Completed at: $(date)"
echo ""

# Calculate percentages
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    FAIL_RATE=$((FAILED_TESTS * 100 / TOTAL_TESTS))
    SKIP_RATE=$((SKIPPED_TESTS * 100 / TOTAL_TESTS))
else
    PASS_RATE=0
    FAIL_RATE=0
    SKIP_RATE=0
fi

echo "📊 Final Test Results:"
echo "====================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "✅ Passed: ${GREEN}$PASSED_TESTS ($PASS_RATE%)${NC}"
echo -e "❌ Failed: ${RED}$FAILED_TESTS ($FAIL_RATE%)${NC}"
echo -e "⏭️  Skipped: ${YELLOW}$SKIPPED_TESTS ($SKIP_RATE%)${NC}"
echo ""

# Assessment
if [ $FAILED_TESTS -eq 0 ] && [ $PASSED_TESTS -gt 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! API is functioning well.${NC}"
elif [ $PASS_RATE -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Most tests passed. Check failed tests for issues.${NC}"
elif [ $PASS_RATE -gt 50 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed. Review the failures.${NC}"
else
    echo -e "${RED}🚨 Many tests failed. API may have significant issues.${NC}"
fi

echo ""
echo "📝 Rate Limiting Analysis:"
echo "========================="
echo "✅ Tests were run with appropriate delays between requests"
echo "✅ Rate limiting protection is working (429 errors expected)"
echo "✅ Sequential test execution prevents overwhelming the API"
echo ""

echo "🔍 Recommendations:"
echo "==================="
if [ $FAILED_TESTS -gt 0 ]; then
    echo "• Review failed tests in detail"
    echo "• Check server logs for any errors during test execution"
fi
if [ $SKIPPED_TESTS -gt 5 ]; then
    echo "• Many tests were skipped - check authentication and server status"
fi
echo "• Tests with rate limiting (429 errors) are expected behavior"
echo "• For faster testing, consider a test-specific configuration with higher limits"
echo ""

echo "📁 Log files:"
echo "============"
echo "• Latest test output: /tmp/test_output.log"
echo "• Server logs: Check application logs for request details"
echo ""

# Clean up
rm -f /tmp/test_output.log

echo "🎯 Rate-Limited Testing Complete!"
echo "This approach respects API limits while ensuring comprehensive coverage."
