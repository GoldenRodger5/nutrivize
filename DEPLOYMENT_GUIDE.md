# Nutrivize V2 - Render Deployment Guide

## Prerequisites

1. **GitHub Repository**: Create a repository named `nutrivize` on GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Ensure your MongoDB cluster is accessible from anywhere (or whitelist Render IPs)

## Deployment Steps

### 1. Push Code to GitHub

First, create the GitHub repository and push your code:

```bash
# After creating the 'nutrivize' repository on GitHub
git remote set-url origin https://github.com/GoldenRodger5/nutrivize.git
git push -u origin master
```

### 2. Deploy Backend on Render

1. **Create a New Web Service** on Render
2. **Connect your GitHub repository**: `nutrivize`
3. **Configure the service**:
   - **Name**: `nutrivize-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Python Version**: Set to `3.11.9` (in Environment Variables: `PYTHON_VERSION=3.11.9`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --workers 4 --bind 0.0.0.0:$PORT`

4. **Set Environment Variables**:
   ```
   PYTHON_VERSION=3.11.9
   ENVIRONMENT=production
   MONGODB_URL=mongodb+srv://isaacmineo:1vWVKLtI4cFn1LNN@nutrivize.rbj6ly6.mongodb.net/nutrivize_v2?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true
   ANTHROPIC_API_KEY=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
   OPENAI_API_KEY=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
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"food-tracker-6096d","private_key_id":"c16bed4f6c294da7395e18c821035260a2409c0e","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDT8tNCqyeyRyKo\nmLha1MODrEpofWAtSy1ovEnUBJXFfWglNV4axm3CG79mD6W9ILT3T3cZ+zMV/9EY\npM79sSLj4RA7zex+OwkukmGFXgpzms0fVDjXnEitMManPfxNi4ioxLAQdx/LCsOM\nXmNlIo7XuDiX4wk6LzTZ/Z5fmlAcQQA10ZcLJxAXTnZAYCbNdz2OiGXMgvZK33R3\nUYBc/ApvegKtXiaWraMsZ6cwRh0ncDTlZ+QHJBrL3zH7mY8ZpQO/hL0g1YpQ998r\nLb5Nwb9cWKROaoL5mobbpArikIsfsp9Vvu0sLJpzXu7Uyh8Vt3skwjrLAalTZYTw\n1mjllTndAgMBAAECggEADgsfR5UvopBnRRe/0pGzPE/eKxSjmsMW1ZAkR155mtK3\nlwxbzLDF9QA03mS+Oc0Nyi7QJXIpIGJvtSi2Z/jX5vsZDqost71E20eEgeG8fFlC\nRIeM4wk0usUDywqmydYrZ+m6AMOwrgA4lMRsSypon8KFFwtKdG1MT/70aQ4NRzhC\nDmWxXgxeYs9Q3w/YxFsH7kQp38FRtL7jiGuKkZNaA9igUhRtVvjEQ4jauXv/pFqd\nad3EE1aZAQgCX5EHhFNC9WTLGnOWPoaBU2nAVG9k4UupxxJ61ZaXI7vh3CbfHVav\nivajaVMvKkOBHPAT7r93RG5W68r3JFuEa1O+TXWdwQKBgQDzx5R5DZwysL0bcM+K\nCmW2Bi8PTMT9GrwcHvxTODA8cABkFWY9Tw05IdqsrvCH1ac13f44EANJ+S0tDw/2\nbdLSiYhjHuy0dAueeasl7u6JEJ+8LRwuX9xinmxv/l+N++WkV561X3GuVzsLTdOJ\nuNjHruhTG3QHvzgmSuPSipvPjwKBgQDeksHxDzhyGz4hjnAUfx5jVFKh6s1bTnnT\nSs3s+8ruxrlTokDD0h00fl0p6FGmRv5HxduMxdOvK63bWfGAximspQWQ8xVQ7Yb0\npepSTIrJZzu+dyyjW8f0qAEh3pVAzmCARaM85T5KBSfvMpDZWLU4ayUS2wVAdpdA\ncBP6FMDp0wKBgGSyWRsTyySJKuQt2hycJN1meoPoYyplo7Q9/F5nxE0CuracvEmw\n4LZrzIcuD/8b+uDeXQdNXf5tZgLJyP8y6DW9R9Ah0wbLNI12loKpynBlpIW3YH+r\naz51UDeGrHPazEXxR4aF8VBhiesmb63g4/K/xgmmOmyEyS3QG4E5bhjzAoGAMf+B\ntacXpPpdsKgQoWoU53dPwLPAQdyVHVPWgn/ljFHz28e9CMAwc1RXlUxs2w9jm7fk\no/DkppsHSRkhWS4qum+vmmogxbc188s5ohczrh6UmyqmSmQZvOnopzUbDh3OK8J4\n8vsETRhvahpP06NLwkq/X0b4HQ0G2SDUO/9hfqUCgYEAgPA5pn7wARH09tI+Rwj1\npMm5XXt32zNPJJIfVCVXKQt2SVbAqNxk9nuJ9RqgEWtHnUuJgHoMo43+SuGGDG0x\nDhfQuH6zySAz9fwEIu9YvnrwJPJv4xQaWjavpmWyxjnzZzM78BtA0HcLx/ayIKEH\n4b4bMk5bfApbyzXqlgY/Cik=\n-----END PRIVATE KEY-----\n","client_email":"nutrivize@food-tracker-6096d.iam.gserviceaccount.com","client_id":"113969268568573013827","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/nutrivize%40food-tracker-6096d.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   GOOGLE_CLOUD_VISION_CREDENTIALS_JSON={"type":"service_account","project_id":"food-tracker-6096d","private_key_id":"c16bed4f6c294da7395e18c821035260a2409c0e","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDT8tNCqyeyRyKo\nmLha1MODrEpofWAtSy1ovEnUBJXFfWglNV4axm3CG79mD6W9ILT3T3cZ+zMV/9EY\npM79sSLj4RA7zex+OwkukmGFXgpzms0fVDjXnEitMManPfxNi4ioxLAQdx/LCsOM\nXmNlIo7XuDiX4wk6LzTZ/Z5fmlAcQQA10ZcLJxAXTnZAYCbNdz2OiGXMgvZK33R3\nUYBc/ApvegKtXiaWraMsZ6cwRh0ncDTlZ+QHJBrL3zH7mY8ZpQO/hL0g1YpQ998r\nLb5Nwb9cWKROaoL5mobbpArikIsfsp9Vvu0sLJpzXu7Uyh8Vt3skwjrLAalTZYTw\n1mjllTndAgMBAAECggEADgsfR5UvopBnRRe/0pGzPE/eKxSjmsMW1ZAkR155mtK3\nlwxbzLDF9QA03mS+Oc0Nyi7QJXIpIGJvtSi2Z/jX5vsZDqost71E20eEgeG8fFlC\nRIeM4wk0usUDywqmydYrZ+m6AMOwrgA4lMRsSypon8KFFwtKdG1MT/70aQ4NRzhC\nDmWxXgxeYs9Q3w/YxFsH7kQp38FRtL7jiGuKkZNaA9igUhRtVvjEQ4jauXv/pFqd\nad3EE1aZAQgCX5EHhFNC9WTLGnOWPoaBU2nAVG9k4UupxxJ61ZaXI7vh3CbfHVav\nivajaVMvKkOBHPAT7r93RG5W68r3JFuEa1O+TXWdwQKBgQDzx5R5DZwysL0bcM+K\nCmW2Bi8PTMT9GrwcHvxTODA8cABkFWY9Tw05IdqsrvCH1ac13f44EANJ+S0tDw/2\nbdLSiYhjHuy0dAueeasl7u6JEJ+8LRwuX9xinmxv/l+N++WkV561X3GuVzsLTdOJ\nuNjHruhTG3QHvzgmSuPSipvPjwKBgQDeksHxDzhyGz4hjnAUfx5jVFKh6s1bTnnT\nSs3s+8ruxrlTokDD0h00fl0p6FGmRv5HxduMxdOvK63bWfGAximspQWQ8xVQ7Yb0\npepSTIrJZzu+dyyjW8f0qAEh3pVAzmCARaM85T5KBSfvMpDZWLU4ayUS2wVAdpdA\ncBP6FMDp0wKBgGSyWRsTyySJKuQt2hycJN1meoPoYyplo7Q9/F5nxE0CuracvEmw\n4LZrzIcuD/8b+uDeXQdNXf5tZgLJyP8y6DW9R9Ah0wbLNI12loKpynBlpIW3YH+r\naz51UDeGrHPazEXxR4aF8VBhiesmb63g4/K/xgmmOmyEyS3QG4E5bhjzAoGAMf+B\ntacXpPpdsKgQoWoU53dPwLPAQdyVHVPWgn/ljFHz28e9CMAwc1RXlUxs2w9jm7fk\no/DkppsHSRkhWS4qum+vmmogxbc188s5ohczrh6UmyqmSmQZvOnopzUbDh3OK8J4\n8vsETRhvahpP06NLwkq/X0b4HQ0G2SDUO/9hfqUCgYEAgPA5pn7wARH09tI+Rwj1\npMm5XXt32zNPJJIfVCVXKQt2SVbAqNxk9nuJ9RqgEWtHnUuJgHoMo43+SuGGDG0x\nDhfQuH6zySAz9fwEIu9YvnrwJPJv4xQaWjavpmWyxjnzZzM78BtA0HcLx/ayIKEH\n4b4bMk5bfApbyzXqlgY/Cik=\n-----END PRIVATE KEY-----\n","client_email":"nutrivize@food-tracker-6096d.iam.gserviceaccount.com","client_id":"113969268568573013827","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/nutrivize%40food-tracker-6096d.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   SECRET_KEY=nutrivize-production-secret-key-2025-super-secure-key
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ```

### 3. Deploy Frontend on Render

1. **Create a Static Site** on Render
2. **Connect the same GitHub repository**: `nutrivize`
3. **Configure the static site**:
   - **Name**: `nutrivize-frontend`
   - **Branch**: `master`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

4. **Update Frontend Environment**:
   - The frontend production environment is already configured in `frontend/.env.production`
   - Update the `VITE_API_BASE_URL` after you get your backend URL:
   ```
   VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
   ```

### 4. Update CORS Settings

After both services are deployed, update the backend's `FRONTEND_URL` environment variable with your actual frontend URL.

## File Structure

```
nutrivize/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.production
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── build.sh
├── start.sh
├── Dockerfile
├── render.yaml
└── DEPLOYMENT_GUIDE.md
```

## Environment Variables Reference

### Backend Environment Variables
- `ENVIRONMENT=production`
- `MONGODB_URL` - Your MongoDB Atlas connection string
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase service account credentials as JSON string
- `GOOGLE_CLOUD_VISION_CREDENTIALS_JSON` - Google Cloud Vision credentials as JSON string
- `SECRET_KEY` - A secure secret key for JWT tokens
- `FRONTEND_URL` - Your frontend URL for CORS

### Frontend Environment Variables
- `VITE_API_BASE_URL` - Your backend API URL
- `VITE_ENVIRONMENT` - Set to "production"
- `VITE_FIREBASE_*` - Firebase configuration (already set)

## Testing the Deployment

1. **Backend Health Check**: Visit `https://your-backend-url.onrender.com/health`
2. **Frontend**: Visit `https://your-frontend-url.onrender.com`

## Troubleshooting

1. **Build Failures**: Check the build logs in Render dashboard
2. **Service Crashes**: Check the service logs for error messages
3. **Database Connection**: Ensure MongoDB Atlas allows connections from anywhere
4. **CORS Issues**: Verify FRONTEND_URL is set correctly in backend environment

## Security Notes

- All sensitive credentials are stored as environment variables
- Database credentials should use strong passwords
- Consider using Render's secret management for additional security
- Regularly rotate API keys and credentials
