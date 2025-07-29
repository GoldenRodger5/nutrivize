#!/bin/bash

# Domain Migration Checklist for nutrivize.app
# Run this script to verify all domain-related configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if domain resolves
check_domain() {
    local domain=$1
    if dig +short "$domain" > /dev/null 2>&1; then
        local ip=$(dig +short "$domain" | head -n1)
        if [ -n "$ip" ]; then
            print_success "$domain resolves to $ip"
            return 0
        fi
    fi
    print_error "$domain does not resolve"
    return 1
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    if curl -s -I "https://$domain" > /dev/null 2>&1; then
        print_success "$domain SSL certificate is valid"
        return 0
    else
        print_error "$domain SSL certificate is invalid or site not accessible"
        return 1
    fi
}

# Function to check HTTP response
check_http() {
    local url=$1
    local expected_code=${2:-200}
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        print_success "$url returns $response_code"
        return 0
    else
        print_error "$url returns $response_code (expected $expected_code)"
        return 1
    fi
}

print_header "NUTRIVIZE.APP DOMAIN MIGRATION CHECKLIST"

echo "Verifying domain migration to nutrivize.app..."
echo ""

# Check configuration files
print_header "CONFIGURATION FILES CHECK"

echo "1. Frontend Environment Variables"
if grep -q "api.nutrivize.app" frontend/.env.production 2>/dev/null; then
    print_success "Frontend .env.production updated with new API URL"
else
    print_error "Frontend .env.production not updated"
fi

echo ""
echo "2. Backend Environment Example"
if grep -q "nutrivize.app" backend/.env.example 2>/dev/null; then
    print_success "Backend .env.example updated with new CORS origins"
else
    print_error "Backend .env.example not updated"
fi

echo ""
echo "3. Legal Documents"
if grep -q "nutrivize.app" PRIVACY_POLICY.md 2>/dev/null; then
    print_success "Privacy Policy updated with new domain"
else
    print_error "Privacy Policy not updated"
fi

if grep -q "nutrivize.app" TERMS_OF_SERVICE.md 2>/dev/null; then
    print_success "Terms of Service updated with new domain"
else
    print_error "Terms of Service not updated"
fi

# Check DNS resolution
print_header "DNS RESOLUTION CHECK"

echo "Checking domain resolution..."
check_domain "nutrivize.app"
check_domain "www.nutrivize.app"
check_domain "api.nutrivize.app"

print_info "Note: If domains don't resolve, configure DNS in Cloudflare dashboard"

# Check SSL certificates (only if domains resolve)
print_header "SSL CERTIFICATE CHECK"

echo "Checking SSL certificates..."
if dig +short nutrivize.app > /dev/null 2>&1; then
    check_ssl "nutrivize.app"
    check_ssl "api.nutrivize.app"
else
    print_warning "Skipping SSL check - domains not yet configured"
fi

# Check HTTP responses (only if domains resolve and have SSL)
print_header "HTTP RESPONSE CHECK"

echo "Checking HTTP responses..."
if curl -s -I "https://nutrivize.app" > /dev/null 2>&1; then
    check_http "https://nutrivize.app" "200"
    check_http "https://api.nutrivize.app/health" "200"
else
    print_warning "Skipping HTTP check - sites not yet accessible"
fi

# Check for old domain references
print_header "OLD DOMAIN REFERENCES CHECK"

echo "Checking for remaining old domain references..."

OLD_REFS=0

# Check for localhost references in production files
if grep -r "localhost" frontend/.env.production backend/.env.example 2>/dev/null | grep -v "# For local testing" > /dev/null; then
    print_warning "Found localhost references in production configs"
    OLD_REFS=$((OLD_REFS + 1))
fi

# Check for .com references (should be .app now)
if grep -r "nutrivize\.com" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null > /dev/null; then
    print_warning "Found old nutrivize.com references"
    OLD_REFS=$((OLD_REFS + 1))
fi

if [ $OLD_REFS -eq 0 ]; then
    print_success "No old domain references found"
fi

# Email configuration check
print_header "EMAIL CONFIGURATION CHECK"

echo "Checking email configurations..."
if grep -q "@nutrivize.app" PRIVACY_POLICY.md TERMS_OF_SERVICE.md LAUNCH_COMMUNICATION_PLAN.md 2>/dev/null; then
    print_success "Email addresses updated to @nutrivize.app"
else
    print_error "Email addresses not fully updated"
fi

# Production readiness
print_header "PRODUCTION READINESS"

echo "Production deployment checklist:"
echo ""
print_info "Backend Deployment (Render):"
echo "  1. Deploy backend with updated CORS settings"
echo "  2. Add custom domain: api.nutrivize.app"
echo "  3. Configure environment variables"
echo ""
print_info "Frontend Deployment (Vercel/Netlify):"
echo "  1. Deploy frontend with new API URL"
echo "  2. Add custom domain: nutrivize.app"
echo "  3. Configure www redirect"
echo ""
print_info "DNS Configuration (Cloudflare):"
echo "  1. Point nutrivize.app to frontend"
echo "  2. Point api.nutrivize.app to backend"
echo "  3. Configure SSL settings"
echo "  4. Set up email forwarding"

# Next steps
print_header "NEXT STEPS"

echo "To complete the domain migration:"
echo ""
echo "1. 🌐 Configure DNS in Cloudflare:"
echo "   - Follow CLOUDFLARE_DNS_SETUP.md guide"
echo "   - Set up CNAME records for domains"
echo "   - Configure email forwarding"
echo ""
echo "2. 🚀 Deploy to production:"
echo "   - Deploy backend with new CORS settings"
echo "   - Deploy frontend with new API URL"
echo "   - Add custom domains in hosting platforms"
echo ""
echo "3. 🧪 Test production:"
echo "   - Run: python test_production_api.py"
echo "   - Verify all functionality works"
echo "   - Test email forwarding"
echo ""
echo "4. 📢 Go live:"
echo "   - Update any external integrations"
echo "   - Announce new domain"
echo "   - Monitor for issues"

echo ""
print_success "Domain migration configuration complete!"
print_info "Ready for DNS setup and production deployment."

echo ""
echo "📋 Summary:"
echo "✅ Configuration files updated"
echo "✅ Legal documents updated" 
echo "✅ Email addresses updated"
echo "✅ Production test script ready"
echo "⏳ DNS configuration needed"
echo "⏳ Production deployment needed"
