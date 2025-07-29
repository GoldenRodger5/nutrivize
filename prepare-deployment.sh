#!/bin/bash

# Deployment preparation script
# This script prepares the application for production deployment

echo "🚀 Preparing Nutrivize for Production Deployment"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create deployment directory
echo "📁 Creating deployment artifacts..."
mkdir -p deployment
mkdir -p deployment/frontend
mkdir -p deployment/backend

# Frontend build
echo "🔨 Building frontend for production..."
cd frontend
if npm run build; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    cp -r build/* ../deployment/frontend/
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

# Backend preparation
echo "📦 Preparing backend for deployment..."
cp -r backend/* deployment/backend/
cp requirements.txt deployment/backend/ 2>/dev/null || true

# Create render.yaml for deployment
echo "⚙️ Creating Render deployment configuration..."
cat > deployment/render.yaml << EOF
services:
  - type: web
    name: nutrivize-backend
    env: python
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port \$PORT
    envVars:
      - key: NODE_ENV
        value: production
      - key: PYTHON_VERSION
        value: 3.11.0
    autoDeploy: false

  - type: static
    name: nutrivize-frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./build
    pullRequestPreviewsEnabled: false
    envVars: []
EOF

# Create environment template
echo "🔧 Creating environment configuration template..."
cat > deployment/backend/.env.template << EOF
# Production Environment Variables
# Copy this file to .env and fill in the actual values

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nutrivize?retryWrites=true&w=majority

# Redis Cache
REDIS_URL=redis://default:password@host:port

# Firebase Configuration
FIREBASE_PROJECT_ID=food-tracker-6096d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@food-tracker-6096d.iam.gserviceaccount.com

# CORS Configuration
CORS_ORIGINS=https://nutrivize.app,https://www.nutrivize.app

# API Configuration
API_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Features
ENABLE_VECTOR_SEARCH=true
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=true
EOF

# Create deployment checklist
echo "📋 Creating deployment checklist..."
cat > deployment/DEPLOYMENT_CHECKLIST.md << EOF
# Nutrivize Production Deployment Checklist

## Pre-Deployment (Complete these first)

### Backend Environment Setup
- [ ] Set up MongoDB Atlas production cluster
- [ ] Configure Redis cache instance
- [ ] Set up Firebase project with production settings
- [ ] Generate and configure API keys
- [ ] Set environment variables in Render dashboard

### Frontend Environment Setup
- [ ] Configure production API endpoints
- [ ] Set up custom domain (if applicable)
- [ ] Configure Firebase client settings
- [ ] Set up analytics tracking

### Security & Legal
- [ ] Review and finalize Privacy Policy
- [ ] Review and finalize Terms of Service
- [ ] Set up SSL certificates (automatic on Render)
- [ ] Configure CORS for production domains only
- [ ] Review Firebase security rules

## Deployment Steps

### 1. Backend Deployment
- [ ] Connect GitHub repository to Render
- [ ] Create new Web Service
- [ ] Configure build and start commands
- [ ] Set all environment variables
- [ ] Deploy and verify health endpoint

### 2. Frontend Deployment
- [ ] Deploy to Render Static Site or Vercel
- [ ] Configure build settings
- [ ] Set custom domain (optional)
- [ ] Verify SSL certificate

### 3. DNS Configuration
- [ ] Point domain to deployment platform
- [ ] Configure subdomains if needed
- [ ] Verify DNS propagation

## Post-Deployment

### Testing & Verification
- [ ] Run API endpoint tests: \`python test_api_endpoints.py\`
- [ ] Test user registration and login flow
- [ ] Verify all major features work
- [ ] Test mobile responsiveness
- [ ] Check performance and loading times

### Monitoring Setup
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up analytics (Google Analytics)
- [ ] Configure alert notifications

### Documentation
- [ ] Update README with production URLs
- [ ] Create user onboarding guide
- [ ] Document admin procedures
- [ ] Prepare customer support materials

### Launch Preparation
- [ ] Plan soft launch with limited users
- [ ] Prepare announcement materials
- [ ] Set up customer support channels
- [ ] Create backup and recovery procedures

## Production URLs
- Frontend: https://your-app.onrender.com
- Backend API: https://your-api.onrender.com
- Documentation: https://your-app.onrender.com/docs

## Support Contacts
- Technical Lead: [Your Email]
- DevOps: [DevOps Email]
- Business: [Business Email]

---
Deployment prepared on: $(date)
EOF

# Create production health check
echo "🏥 Creating production health check..."
cat > deployment/backend/health_check.py << EOF
#!/usr/bin/env python3
"""
Production health check script
Run this after deployment to verify all systems are working
"""

import requests
import sys
import os
from datetime import datetime

BACKEND_URL = os.getenv('BACKEND_URL', 'https://your-backend.onrender.com')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://your-frontend.onrender.com')

def check_backend():
    """Check backend health"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {str(e)}")
        return False

def check_frontend():
    """Check frontend availability"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {str(e)}")
        return False

def check_database():
    """Check database connectivity through API"""
    try:
        response = requests.get(f"{BACKEND_URL}/health/database", timeout=10)
        if response.status_code == 200:
            print("✅ Database connection is healthy")
            return True
        else:
            print(f"❌ Database check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🏥 Production Health Check")
    print("=" * 30)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Check time: {datetime.now()}")
    print()
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    database_ok = check_database()
    
    print()
    if backend_ok and frontend_ok and database_ok:
        print("🎉 All systems are healthy!")
        sys.exit(0)
    else:
        print("⚠️  Some systems are not healthy. Please investigate.")
        sys.exit(1)
EOF

chmod +x deployment/backend/health_check.py

# Create README for deployment
echo "📖 Creating deployment README..."
cat > deployment/README.md << EOF
# Nutrivize Production Deployment

This directory contains all files needed for production deployment.

## Contents

- \`frontend/\` - Built frontend assets
- \`backend/\` - Backend application code
- \`render.yaml\` - Render deployment configuration
- \`DEPLOYMENT_CHECKLIST.md\` - Step-by-step deployment guide
- \`.env.template\` - Environment variables template

## Quick Start

1. Follow the checklist in \`DEPLOYMENT_CHECKLIST.md\`
2. Set up environment variables using \`.env.template\`
3. Deploy using Render or your preferred platform
4. Run health checks to verify deployment

## Verification

After deployment, run:
\`\`\`bash
python backend/health_check.py
\`\`\`

## Support

For deployment issues, contact: [your-email@domain.com]

---
Generated on: $(date)
EOF

echo ""
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo "📁 Deployment artifacts created in ./deployment/"
echo "📋 Next steps:"
echo "   1. Review deployment/DEPLOYMENT_CHECKLIST.md"
echo "   2. Configure environment variables"
echo "   3. Deploy to your hosting platform"
echo "   4. Run health checks after deployment"
echo ""
echo "🔗 Key files created:"
echo "   - deployment/render.yaml (Render configuration)"
echo "   - deployment/backend/.env.template (Environment setup)"
echo "   - deployment/DEPLOYMENT_CHECKLIST.md (Step-by-step guide)"
echo "   - deployment/backend/health_check.py (Post-deployment verification)"
