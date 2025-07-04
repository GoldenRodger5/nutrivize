#!/bin/bash

# Script to deploy endpoint fixes to production
echo "Deploying endpoint fixes to Nutrivize API..."

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️ Warning: Not on main branch. Current branch: $CURRENT_BRANCH"
  read -p "Continue with deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment canceled."
    exit 1
  fi
fi

# Create timestamp for backup and logs
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_DIR="backups/endpoint_fixes_$TIMESTAMP"
mkdir -p $BACKUP_DIR
mkdir -p logs

# Backup current code
echo "Creating backup of current code..."
cp -r backend/app/routes/ai_health.py $BACKUP_DIR/
cp -r backend/app/routes/ai_dashboard.py $BACKUP_DIR/
cp -r backend/app/routes/analytics*.py $BACKUP_DIR/
cp backend/app/main.py $BACKUP_DIR/
echo "✅ Backup created in $BACKUP_DIR"

# Use our transition version that supports both old and new endpoints
echo "Applying smoother endpoint transition..."
cp backend/app/routes/ai_health_transition.py backend/app/routes/ai_health.py
echo "✅ Transition-friendly endpoint fixes applied"

# Build the backend
echo "Building backend..."
cd backend
pip install -r requirements.txt
cd ..
echo "✅ Backend built"

# Run tests
echo "Running endpoint tests (requires authentication)..."
echo "Note: You'll need to run test_endpoints.py manually with an auth token:"
echo "python test_endpoints.py <your_auth_token>"

echo "Deployment complete! Please verify the following:"
echo "1. Start the API server: cd backend && uvicorn app.main:app --reload"
echo "2. Run the endpoint tests with authentication"
echo "3. Check for any errors in the logs"

echo "If everything looks good, commit and push the changes:"
echo "git add ."
echo "git commit -m 'Fix duplicate endpoints'"
echo "git push origin main"
