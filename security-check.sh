#!/bin/bash

# Pre-commit security check script for Nutrivize V2
# This script checks for potential security issues before committing

echo "🔍 Running Security Pre-Commit Checks..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check 1: Look for potential credential patterns in staged files (excluding docs, examples, templates)
echo "1. Checking for credential patterns in staged files..."
CREDENTIAL_PATTERNS=(
    "password.*="
    "secret.*="
    "api.*key.*="
    "token.*="
    "mongodb.*://"
    "postgres.*://"
    "mysql.*://"
    "firebase.*key"
    "sk-[a-zA-Z0-9]"
    "AIza[a-zA-Z0-9]"
    "[0-9]{4}[,-][0-9]{4}[,-][0-9]{4}[,-][0-9]{4}"  # Credit card pattern
)

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    # Only check non-documentation files
    staged_files=$(git diff --cached --name-only | grep -v -E "\.(md|txt|instructions)$|/(docs|documentation|examples|templates)/")
    if [ ! -z "$staged_files" ]; then
        if echo "$staged_files" | xargs grep -l -i "$pattern" 2>/dev/null; then
            echo -e "${RED}⚠️  WARNING: Potential credential pattern found: $pattern${NC}"
            echo "   Files containing this pattern:"
            echo "$staged_files" | xargs grep -l -i "$pattern" 2>/dev/null | sed 's/^/     - /'
            ISSUES_FOUND=1
        fi
    fi
done

# Check 2: Look for .env files being committed
echo ""
echo "2. Checking for .env files in staged changes..."
if git diff --cached --name-only | grep -E "\.env$|\.env\." | grep -v -E "\.(example|template)$"; then
    echo -e "${RED}🚨 CRITICAL: .env files found in staged changes!${NC}"
    echo "   Files:"
    git diff --cached --name-only | grep -E "\.env$|\.env\." | grep -v -E "\.(example|template)$" | sed 's/^/     - /'
    echo -e "${RED}   These files may contain sensitive credentials!${NC}"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No .env files in staged changes${NC}"
fi

# Check 3: Look for Firebase service account files
echo ""
echo "3. Checking for Firebase credential files..."
if git diff --cached --name-only | grep -E "firebase.*\.json|service-account.*\.json" | grep -v -E "\.(example|template)\.json$"; then
    echo -e "${RED}🚨 CRITICAL: Firebase credential files found!${NC}"
    echo "   Files:"
    git diff --cached --name-only | grep -E "firebase.*\.json|service-account.*\.json" | grep -v -E "\.(example|template)\.json$" | sed 's/^/     - /'
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No Firebase credential files in staged changes${NC}"
fi

# Check 4: Look for hardcoded IP addresses or URLs that might be sensitive
echo ""
echo "4. Checking for potentially sensitive URLs/IPs..."
SENSITIVE_PATTERNS=(
    "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+"  # IP:Port
    "localhost:[0-9]+"
    "127\.0\.0\.1:[0-9]+"
    "\.ngrok\.io"
    "\.herokuapp\.com"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  WARNING: Potentially sensitive URL/IP pattern: $pattern${NC}"
        echo "   Consider using environment variables for URLs/IPs"
    fi
done

# Check 5: Look for test credentials in production code (excluding docs and tests)
echo ""
echo "5. Checking for test credentials in production files..."
production_files=$(git diff --cached --name-only | grep -v -E "(test|spec|example|template|\.(md|txt|instructions)$|/(docs|documentation|examples|templates)/)")
if [ ! -z "$production_files" ]; then
    if echo "$production_files" | xargs grep -l -i -E "(test.*password|admin.*password|123|password123)" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  WARNING: Potential test credentials in production files${NC}"
        echo "   Files:"
        echo "$production_files" | xargs grep -l -i -E "(test.*password|admin.*password|123|password123)" 2>/dev/null | sed 's/^/     - /'
    else
        echo -e "${GREEN}✅ No test credentials found in production files${NC}"
    fi
else
    echo -e "${GREEN}✅ No production files to check${NC}"
fi

# Check 6: Verify .gitignore is protecting sensitive files
echo ""
echo "6. Verifying .gitignore protection..."
if [ -f .gitignore ]; then
    env_protected=false
    firebase_protected=false
    
    if grep -q "\.env" .gitignore; then
        env_protected=true
    fi
    
    if grep -q -E "firebase.*\.json|\*\.json" .gitignore; then
        firebase_protected=true
    fi
    
    if [ "$env_protected" = true ] && [ "$firebase_protected" = true ]; then
        echo -e "${GREEN}✅ .gitignore protects sensitive files${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: .gitignore may not adequately protect sensitive files${NC}"
        if [ "$env_protected" = false ]; then
            echo "   - Missing .env file protection"
        fi
        if [ "$firebase_protected" = false ]; then
            echo "   - Missing Firebase credential file protection"
        fi
        ISSUES_FOUND=1
    fi
else
    echo -e "${RED}🚨 CRITICAL: No .gitignore file found!${NC}"
    ISSUES_FOUND=1
fi

echo ""
echo "======================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed!${NC}"
    echo -e "${GREEN}✅ Safe to commit${NC}"
    exit 0
else
    echo -e "${RED}🚨 Security issues found!${NC}"
    echo -e "${RED}❌ Please fix the issues above before committing${NC}"
    echo ""
    echo "💡 Quick fixes:"
    echo "  - Remove sensitive files: git reset HEAD <file>"
    echo "  - Use environment variables instead of hardcoded credentials"
    echo "  - Ensure .env files are in .gitignore"
    echo "  - Use .example or .template versions for documentation"
    echo ""
    echo "🔒 Remember: Once committed to git, sensitive data is permanent in history!"
    exit 1
fi
