#!/bin/bash

# Production Deployment Health Check Script
# Run this script to verify production readiness

echo "🚀 Nutrivize Production Readiness Check"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ISSUES=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ISSUES=$((ISSUES + 1))
    fi
}

# Function to check warning
check_warning() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${YELLOW}⚠️  $2${NC}"
    fi
}

echo "📋 Checking Frontend Dependencies..."
cd frontend
if npm list --depth=0 > /dev/null 2>&1; then
    check_status 0 "Frontend dependencies installed"
else
    check_status 1 "Frontend dependencies missing - run 'npm install'"
fi

echo ""
echo "🔨 Running Frontend Build Test..."
if npm run build > /dev/null 2>&1; then
    check_status 0 "Frontend builds successfully"
else
    check_status 1 "Frontend build failed - check for TypeScript errors"
fi

echo ""
echo "📋 Checking Backend Dependencies..."
cd ../backend
if python -m pip check > /dev/null 2>&1; then
    check_status 0 "Backend dependencies satisfied"
else
    check_status 1 "Backend dependencies issues - check requirements.txt"
fi

cd ..

echo ""
echo "🔍 Checking Environment Files..."
if [ -f "backend/.env" ]; then
    check_status 0 "Backend .env file exists"
else
    check_status 1 "Backend .env file missing"
fi

if [ -f "frontend/.env" ]; then
    check_status 0 "Frontend .env file exists"
else
    check_warning 1 "Frontend .env file missing (may be optional)"
fi

echo ""
echo "📄 Checking Legal Documents..."
if [ -f "PRIVACY_POLICY.md" ]; then
    check_status 0 "Privacy Policy exists"
else
    check_status 1 "Privacy Policy missing"
fi

if [ -f "TERMS_OF_SERVICE.md" ]; then
    check_status 0 "Terms of Service exists"
else
    check_status 1 "Terms of Service missing"
fi

echo ""
echo "🔧 Checking Configuration Files..."
if [ -f "backend/render.yaml" ]; then
    check_status 0 "Render deployment config exists"
else
    check_status 1 "Render deployment config missing"
fi

if [ -f "start-nutrivize.sh" ]; then
    check_status 0 "Start script exists"
else
    check_warning 1 "Start script missing"
fi

echo ""
echo "🗄️ Checking Database Connectivity..."
# This would need actual database credentials to test
check_warning 1 "Database connectivity not tested (requires live credentials)"

echo ""
echo "🔐 Checking Authentication Setup..."
if [ -f "backend/food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json" ]; then
    check_status 0 "Firebase service account key exists"
else
    check_status 1 "Firebase service account key missing"
fi

echo ""
echo "📊 Production Readiness Summary"
echo "==============================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed! Ready for production deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Render production environment"
    echo "2. Set up monitoring and error tracking"
    echo "3. Configure production domain and SSL"
    echo "4. Run user acceptance testing"
    echo "5. Prepare launch communications"
else
    echo -e "${RED}⚠️  $ISSUES critical issues found. Address these before production deployment.${NC}"
    echo ""
    echo "Focus on fixing the ❌ items above before deploying to production."
fi

echo ""
echo "🔗 Additional Deployment Checklist:"
echo "- [ ] Set up production environment variables on Render"
echo "- [ ] Configure custom domain and SSL certificate"
echo "- [ ] Set up error monitoring (Sentry, LogRocket)"
echo "- [ ] Configure analytics (Google Analytics)"
echo "- [ ] Set up uptime monitoring"
echo "- [ ] Prepare user onboarding flow"
echo "- [ ] Create user documentation/help"
echo "- [ ] Set up customer support channels"
echo "- [ ] Plan launch marketing strategy"
