# Production Deployment Guide

This guide walks through deploying Nutrivize to production on Render.

## Pre-Deployment Checklist

### 1. Run Production Readiness Check
```bash
./production-readiness-check.sh
```

### 2. Environment Setup

#### Backend Environment Variables (Render)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-atlas-connection-string
REDIS_URL=redis://your-redis-instance
FIREBASE_PROJECT_ID=food-tracker-6096d
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
CORS_ORIGINS=https://your-frontend-domain.com
```

#### Frontend Environment Variables (if needed)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_FIREBASE_CONFIG=your-firebase-config
```

## Deployment Steps

### 1. Backend Deployment (Render)

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New Web Service"
   - Connect your GitHub repository
   - Select the repository root

2. **Configure Service**
   - **Name**: nutrivize-backend
   - **Environment**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Starter (can upgrade later)

3. **Environment Variables**
   - Add all the backend environment variables listed above
   - Use Render's environment variable interface

4. **Deploy**
   - Click "Create Web Service"
   - Wait for initial deployment to complete

### 2. Frontend Deployment

#### Option A: Render Static Site
1. **Create New Static Site**
   - Go to Render Dashboard
   - Click "New Static Site"
   - Connect repository

2. **Configure Build**
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

#### Option B: Vercel (Recommended for Frontend)
1. **Connect to Vercel**
   - Go to vercel.com
   - Import GitHub repository
   - Select frontend directory

2. **Configure Build**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## Post-Deployment Configuration

### 1. Custom Domain Setup
- Configure your custom domain in Render/Vercel
- Set up SSL certificate (automatic on both platforms)
- Update CORS origins in backend to include production domain

### 2. Database Optimization
- Set up MongoDB Atlas production cluster
- Configure connection pooling
- Set up database indexes for performance

### 3. Monitoring Setup

#### Error Tracking (Sentry)
```bash
npm install @sentry/react @sentry/tracing
```

Add to `frontend/src/index.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

#### Analytics (Google Analytics)
Add to `frontend/public/index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 4. Uptime Monitoring
- Set up UptimeRobot or similar service
- Monitor both frontend and backend endpoints
- Configure alert notifications

## Performance Optimization

### 1. CDN Setup
- Enable CDN on Render/Vercel for static assets
- Optimize images and compress assets

### 2. Database Performance
- Enable MongoDB Atlas performance monitoring
- Set up proper indexes
- Configure connection pooling

### 3. Caching Strategy
- Verify Redis is properly configured
- Set appropriate cache TTL values
- Monitor cache hit rates

## Security Checklist

### 1. SSL/TLS
- ✅ Automatic SSL on Render/Vercel
- Verify HTTPS redirect is enabled

### 2. CORS Configuration
- Restrict CORS to production domains only
- Remove localhost from production CORS

### 3. Environment Variables
- Never commit secrets to version control
- Use Render's encrypted environment variables
- Rotate API keys and secrets

### 4. Firebase Security
- Review Firebase security rules
- Ensure proper authentication flows
- Monitor for suspicious activity

## Launch Preparation

### 1. User Testing
- Conduct final user acceptance testing
- Test all critical user flows
- Verify mobile responsiveness

### 2. Content Preparation
- Update legal documents with correct contact info
- Prepare user onboarding materials
- Create help documentation

### 3. Support Setup
- Set up customer support email
- Create FAQ documentation
- Prepare troubleshooting guides

### 4. Marketing Preparation
- Prepare launch announcement
- Set up social media accounts
- Create product screenshots and videos

## Go-Live Process

### 1. Final Checks
```bash
# Run production readiness check
./production-readiness-check.sh

# Test all endpoints
curl https://your-backend.onrender.com/health
curl https://your-frontend.onrender.com
```

### 2. DNS Configuration
- Point your domain to Render/Vercel
- Configure subdomain for API if using separate domain

### 3. Launch Monitoring
- Monitor error rates in first 24 hours
- Watch for performance issues
- Monitor user registration flow

### 4. Post-Launch Tasks
- Announce launch to users
- Monitor user feedback
- Address any immediate issues
- Plan first post-launch update

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure secrets are properly encoded

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format
   - Verify database credentials

4. **CORS Errors**
   - Update backend CORS configuration
   - Verify frontend URL is correct
   - Check for protocol mismatches (http vs https)

## Support Contacts

For production deployment support:
- **Technical**: tech@nutrivize.com
- **Business**: support@nutrivize.com
- **Emergency**: [Emergency contact number]

---

*This deployment guide was created on July 28, 2025*
