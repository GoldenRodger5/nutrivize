#!/bin/bash

# Production Launch Checklist Script
# This script walks through the complete launch checklist interactively

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to ask for confirmation
confirm() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Function to mark task as complete
mark_complete() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Start the checklist
print_header "NUTRIVIZE PRODUCTION LAUNCH CHECKLIST"

echo "This script will guide you through the complete production launch process."
echo "Each step requires confirmation before proceeding."
echo ""

if ! confirm "Are you ready to begin the launch checklist?"; then
    print_error "Launch checklist cancelled."
    exit 1
fi

# Pre-Launch Technical Checklist
print_header "PRE-LAUNCH TECHNICAL CHECKLIST"

echo "1. Environment Configuration"
if confirm "Have you configured all production environment variables?"; then
    mark_complete "Environment variables configured"
else
    print_warning "Please complete environment configuration first"
    echo "Run: cp .env.example .env.production and fill in values"
fi

echo ""
echo "2. Database Setup"
if confirm "Is the production MongoDB Atlas database configured and accessible?"; then
    mark_complete "Database configuration verified"
else
    print_error "Database must be configured before launch"
    exit 1
fi

echo ""
echo "3. Authentication System"
if confirm "Is Firebase authentication properly configured for production?"; then
    mark_complete "Authentication system verified"
else
    print_error "Authentication must be working before launch"
    exit 1
fi

echo ""
echo "4. API Endpoints Testing"
if confirm "Have you run the comprehensive API testing suite (test_api_endpoints.py)?"; then
    mark_complete "API endpoints tested"
else
    print_warning "Consider running: python test_api_endpoints.py"
fi

echo ""
echo "5. Frontend Build"
if confirm "Is the frontend build optimized and error-free?"; then
    mark_complete "Frontend build verified"
else
    print_warning "Run frontend build and resolve any issues"
fi

echo ""
echo "6. SSL Certificates"
if confirm "Are SSL certificates properly configured for HTTPS?"; then
    mark_complete "SSL certificates configured"
else
    print_error "HTTPS is required for production"
    exit 1
fi

echo ""
echo "7. Domain Configuration"
if confirm "Is the custom domain properly configured and pointing to your services?"; then
    mark_complete "Domain configuration verified"
else
    print_warning "Consider configuring custom domain for professional appearance"
fi

# Security and Compliance
print_header "SECURITY AND COMPLIANCE"

echo "1. Privacy Policy"
if confirm "Have you reviewed and customized the privacy policy for your business?"; then
    mark_complete "Privacy policy reviewed"
else
    print_warning "Please review PRIVACY_POLICY.md and customize with your details"
fi

echo ""
echo "2. Terms of Service"
if confirm "Have you reviewed and customized the terms of service?"; then
    mark_complete "Terms of service reviewed"
else
    print_warning "Please review TERMS_OF_SERVICE.md and customize with your details"
fi

echo ""
echo "3. Cookie Consent"
if confirm "Is the cookie consent system implemented and working?"; then
    mark_complete "Cookie consent implemented"
else
    print_warning "Ensure CookieConsent component is integrated into your app"
fi

echo ""
echo "4. Data Security"
if confirm "Have you verified all sensitive data is properly encrypted and secured?"; then
    mark_complete "Data security verified"
else
    print_error "Data security must be verified before launch"
    exit 1
fi

# Performance and Monitoring
print_header "PERFORMANCE AND MONITORING"

echo "1. Performance Testing"
if confirm "Have you conducted load testing and performance optimization?"; then
    mark_complete "Performance testing completed"
else
    print_warning "Consider conducting performance testing under expected load"
fi

echo ""
echo "2. Error Monitoring"
if confirm "Is error monitoring and logging properly configured?"; then
    mark_complete "Error monitoring configured"
else
    print_warning "Configure error monitoring for production issues"
fi

echo ""
echo "3. Health Checks"
if confirm "Are health check endpoints working and monitored?"; then
    mark_complete "Health checks configured"
else
    print_warning "Ensure /health endpoint is implemented and monitored"
fi

echo ""
echo "4. Backup Strategy"
if confirm "Do you have a backup strategy for user data and configurations?"; then
    mark_complete "Backup strategy in place"
else
    print_error "Backup strategy is critical for production"
    exit 1
fi

# Legal and Business
print_header "LEGAL AND BUSINESS PREPARATION"

echo "1. Legal Review"
if confirm "Have legal documents been reviewed by appropriate counsel?"; then
    mark_complete "Legal review completed"
else
    print_warning "Consider legal review of privacy policy and terms of service"
fi

echo ""
echo "2. Business Entity"
if confirm "Is your business entity properly registered for this service?"; then
    mark_complete "Business registration verified"
else
    print_warning "Ensure proper business registration for liability protection"
fi

echo ""
echo "3. Insurance"
if confirm "Do you have appropriate liability insurance for a health-related service?"; then
    mark_complete "Insurance coverage verified"
else
    print_warning "Consider liability insurance for health-related applications"
fi

# Support and Communication
print_header "SUPPORT AND COMMUNICATION"

echo "1. Support System"
if confirm "Is customer support system set up and ready?"; then
    mark_complete "Support system ready"
else
    print_warning "Set up support email and help documentation"
fi

echo ""
echo "2. Documentation"
if confirm "Is user documentation and help content prepared?"; then
    mark_complete "Documentation prepared"
else
    print_warning "Prepare user guides and FAQ content"
fi

echo ""
echo "3. Launch Communication"
if confirm "Are launch announcements and marketing materials prepared?"; then
    mark_complete "Launch communication prepared"
else
    print_warning "Review LAUNCH_COMMUNICATION_PLAN.md for templates"
fi

# Final Launch Steps
print_header "FINAL LAUNCH STEPS"

echo "1. Final Testing"
if confirm "Have you completed one final end-to-end test of all functionality?"; then
    mark_complete "Final testing completed"
else
    print_error "Complete final testing before launch"
    exit 1
fi

echo ""
echo "2. Team Notification"
if confirm "Has the internal team been notified of the launch?"; then
    mark_complete "Team notified"
else
    print_warning "Notify your team before going live"
fi

echo ""
echo "3. Monitoring Setup"
if confirm "Are you prepared to monitor the system during and after launch?"; then
    mark_complete "Monitoring prepared"
else
    print_error "Active monitoring is essential during launch"
    exit 1
fi

echo ""
print_header "LAUNCH EXECUTION"

if confirm "Are you ready to execute the final deployment?"; then
    print_status "Executing deployment..."
    
    # Run the deployment preparation script
    if [ -f "./prepare-deployment.sh" ]; then
        print_status "Running deployment preparation..."
        ./prepare-deployment.sh
    else
        print_warning "Deployment script not found. Deploy manually."
    fi
    
    mark_complete "Deployment executed"
else
    print_warning "Launch postponed. Complete remaining items and run this script again."
    exit 1
fi

echo ""
print_header "POST-LAUNCH MONITORING"

echo "The application is now live! Here's what to monitor in the first 24 hours:"
echo ""
echo "• System health and uptime"
echo "• User registration and activity"
echo "• Error rates and performance metrics"
echo "• Support inquiries"
echo "• User feedback"
echo ""

print_status "Launch checklist completed successfully!"
print_status "Monitor your application closely in the coming hours."
print_status "Good luck with your launch! 🚀"

# Save launch timestamp
echo "Launch completed at: $(date)" >> launch-history.log

echo ""
echo "Launch history saved to launch-history.log"
echo "Remember to:"
echo "1. Monitor system health"
echo "2. Respond to user feedback"
echo "3. Address any issues promptly"
echo "4. Celebrate your achievement! 🎉"
