# Nutrivize Production Deployment

This directory contains all files needed for production deployment.

## Contents

- `frontend/` - Built frontend assets
- `backend/` - Backend application code
- `render.yaml` - Render deployment configuration
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `.env.template` - Environment variables template

## Quick Start

1. Follow the checklist in `DEPLOYMENT_CHECKLIST.md`
2. Set up environment variables using `.env.template`
3. Deploy using Render or your preferred platform
4. Run health checks to verify deployment

## Verification

After deployment, run:
```bash
python backend/health_check.py
```

## Support

For deployment issues, contact: [your-email@domain.com]

---
Generated on: Mon Jul 28 18:32:39 EDT 2025
