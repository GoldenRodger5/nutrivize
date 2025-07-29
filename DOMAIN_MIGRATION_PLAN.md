# 🌐 Domain Migration to nutrivize.app

## Overview
Migrating from localhost/render.com to **nutrivize.app** custom domain purchased from Cloudflare.

## Domain Structure Plan
- **Main App**: `https://nutrivize.app` (Frontend)
- **API Backend**: `https://api.nutrivize.app` (Backend API)
- **Status Page**: `https://status.nutrivize.app` 
- **Documentation**: `https://docs.nutrivize.app`
- **Help Center**: `https://help.nutrivize.app`

## Required Changes

### 1. Frontend Configuration
- [x] Update `.env.production` with new API URL
- [x] Update deployment settings for custom domain

### 2. Backend Configuration  
- [x] Update CORS origins for new domain
- [x] Update environment templates
- [x] Update API base URLs

### 3. Legal Documents
- [x] Update Privacy Policy contact emails
- [x] Update Terms of Service contact emails

### 4. Communication Plans
- [x] Update all email addresses to @nutrivize.app
- [x] Update domain references in documentation

### 5. Deployment Scripts
- [x] Update deployment templates
- [x] Update production readiness checks
- [x] Update testing endpoints

### 6. DNS Configuration (Cloudflare)
- [ ] Point nutrivize.app to frontend (Vercel/Netlify)
- [ ] Point api.nutrivize.app to backend (Render)
- [ ] Configure SSL certificates
- [ ] Set up email forwarding for support emails

## Migration Steps

### Phase 1: Update Codebase ✅
1. Update all configuration files
2. Update environment variables
3. Update documentation
4. Test locally

### Phase 2: DNS Setup (Next Steps)
1. Configure Cloudflare DNS
2. Point domains to hosting services
3. Configure SSL certificates
4. Set up email forwarding

### Phase 3: Deployment
1. Deploy backend with new CORS settings
2. Deploy frontend with new API URLs
3. Test production deployment
4. Switch DNS to go live

## Email Addresses Configured
- `support@nutrivize.app` - General support
- `privacy@nutrivize.app` - Privacy inquiries  
- `legal@nutrivize.app` - Legal matters
- `tech@nutrivize.app` - Technical issues
- `business@nutrivize.app` - Business inquiries
- `press@nutrivize.app` - Media inquiries
- `security@nutrivize.app` - Security reports

## Next Steps
1. **Configure DNS in Cloudflare** (requires manual setup)
2. **Deploy to production** with new domain settings
3. **Test end-to-end** functionality
4. **Update any external integrations** (analytics, monitoring)

---
*Updated: July 29, 2025*
