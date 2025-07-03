#!/bin/bash

# Master Test Runner for Nutrivize V2 API
# Runs all endpoint tests in sequence

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║            Nutrivize V2 - Comprehensive API Tests        ║${NC}"
echo -e "${MAGENTA}║                 Authentication Required                  ║${NC}"
echo -e "${MAGENTA}║               isaacmineo@gmail.com / Buddydog41           ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
API_URL="http://localhost:8000"
TEST_DIR="/Users/isaacmineo/Main/projects/nutrivize-v2"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$TEST_DIR/test_results_$TIMESTAMP.log"

echo -e "${BLUE}Test Configuration:${NC}"
echo "API URL: $API_URL"
echo "Test Directory: $TEST_DIR"
echo "Log File: $LOG_FILE"
echo ""

# Check if API is running
echo -e "${YELLOW}Checking API availability...${NC}"
if curl -s "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ API is running${NC}"
else
    echo -e "${RED}❌ API is not accessible at $API_URL${NC}"
    echo "Please ensure the Nutrivize V2 backend is running."
    exit 1
fi

echo ""
echo -e "${BLUE}Starting comprehensive endpoint testing...${NC}"
echo "Results will be logged to: $LOG_FILE"
echo ""

# Initialize log file
echo "Nutrivize V2 API Test Results - $(date)" > "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to run test file and capture results
run_test_file() {
    local test_file="$1"
    local test_name="$2"
    
    echo -e "${BLUE}🚀 Running: $test_name${NC}"
    echo "===========================================" | tee -a "$LOG_FILE"
    echo "Test: $test_name - $(date)" | tee -a "$LOG_FILE"
    echo "===========================================" | tee -a "$LOG_FILE"
    
    if bash "$test_file" 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test execution
failed_tests=0
total_tests=3

echo -e "${MAGENTA}=== Test Suite 1/3: Authentication & User Management ===${NC}"
if run_test_file "$TEST_DIR/test_endpoints_auth.sh" "Authentication & User Management"; then
    echo ""
else
    ((failed_tests++))
    echo -e "${RED}⚠️  Authentication tests failed, continuing with other tests...${NC}"
    echo ""
fi

echo -e "${MAGENTA}=== Test Suite 2/3: Core Features ===${NC}"
if run_test_file "$TEST_DIR/test_endpoints_core.sh" "Core Features"; then
    echo ""
else
    ((failed_tests++))
    echo -e "${RED}⚠️  Core features tests failed, continuing with other tests...${NC}"
    echo ""
fi

echo -e "${MAGENTA}=== Test Suite 3/3: AI Features ===${NC}"
if run_test_file "$TEST_DIR/test_endpoints_ai.sh" "AI Features"; then
    echo ""
else
    ((failed_tests++))
    echo -e "${RED}⚠️  AI features tests failed${NC}"
    echo ""
fi

# Summary
echo "" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo "Test Summary - $(date)" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($total_tests/$total_tests)${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Authentication & User Management${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Core Features${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ AI Features${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${YELLOW}⚠️  $failed_tests/$total_tests test suites had issues${NC}" | tee -a "$LOG_FILE"
    if [ $failed_tests -eq $total_tests ]; then
        echo -e "${RED}❌ All test suites failed${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${GREEN}✅ $((total_tests - failed_tests))/$total_tests test suites passed${NC}" | tee -a "$LOG_FILE"
    fi
fi

echo "" | tee -a "$LOG_FILE"
echo "Detailed results available in: $LOG_FILE" | tee -a "$LOG_FILE"

# Final deployment readiness check
echo "" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo "Deployment Readiness Assessment" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🚀 DEPLOYMENT READY${NC}" | tee -a "$LOG_FILE"
    echo "✅ All critical endpoints are functional" | tee -a "$LOG_FILE"
    echo "✅ Authentication system is working" | tee -a "$LOG_FILE"
    echo "✅ Core features are operational" | tee -a "$LOG_FILE"
    echo "✅ AI features are functional" | tee -a "$LOG_FILE"
    echo "✅ Restaurant AI with multi-file support is active" | tee -a "$LOG_FILE"
    echo "✅ User profile and session history features are working" | tee -a "$LOG_FILE"
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT NEEDS ATTENTION${NC}" | tee -a "$LOG_FILE"
    echo "Some endpoints may need fixes before production deployment" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Test completed at: $(date)" | tee -a "$LOG_FILE"

exit $failed_tests
