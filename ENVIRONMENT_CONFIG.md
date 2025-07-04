# Nutrivize V2 Environment Configuration

## Local Development

For local development, the application uses `.env.local` configuration. This file is not tracked in git and should contain your local development environment variables.

### Setting up local environment

1. Make a copy of the `.env.local` template:
```bash
cp backend/.env.local.example backend/.env.local
```

2. Edit the `.env.local` file with your actual values:
```properties
# Local development environment variables
MONGODB_URL="your_local_mongodb_url"
ANTHROPIC_API_KEY="your_anthropic_api_key"
FIREBASE_PROJECT_ID="nutrivize-dev"
ENVIRONMENT="local"
DEBUG=true
```

3. Start the development environment using the script:
```bash
./start-nutrivize.sh
```

## Production Deployment (Render)

For production deployment on Render, environment variables are set directly in the Render dashboard:

1. Go to your Render dashboard
2. Select your service
3. Navigate to "Environment" tab
4. Add the following environment variables:
   - `ENVIRONMENT=production`
   - `MONGODB_URL=your_production_mongodb_url`
   - `ANTHROPIC_API_KEY=your_production_anthropic_api_key`
   - `FIREBASE_PROJECT_ID=your_production_firebase_project`
   - `DEBUG=false`
   - `SECRET_KEY=your_production_secret_key`
   - Any other required API keys or configuration

## Environment Variables

### Required Variables
- `MONGODB_URL`: MongoDB connection string
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude AI
- `ENVIRONMENT`: Set to "local", "development", or "production"

### Optional Variables
- `DEBUG`: Set to "true" for detailed logging (default: false in production)
- `ADDITIONAL_CORS_ORIGINS`: Comma-separated list of additional CORS origins
- `FRONTEND_URL`: URL of the frontend application

## File Hierarchy

- `.env`: Base environment file (production defaults)
- `.env.local`: Local development overrides (not committed to git)

The application will load `.env.local` first if it exists, then fall back to `.env`.
