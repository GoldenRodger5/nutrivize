#!/bin/bash

# Fix and deploy script for final deployment
# This script fixes indentation issues and deploys to Render

echo "===== FIXING INDENTATION AND SYNTAX ERRORS ====="

# Timestamps for logs
timestamp=$(date +"%Y-%m-%d-%H-%M-%S")
log_file="deployment_log_${timestamp}.txt"

echo "Starting deployment at $(date)" | tee -a $log_file

# Ensure we're in the right directory
cd /Users/isaacmineo/Main/projects/nutrivize-v2 || { echo "Failed to cd to project directory"; exit 1; }

echo "Current directory: $(pwd)" | tee -a $log_file

echo "===== PUSHING CHANGES TO REPOSITORY ====="
git add backend/app/services/unified_ai_service.py backend/app/routes/analytics.py
git commit -m "Fix indentation error in unified_ai_service.py and syntax error in analytics.py"
git push origin main | tee -a $log_file

echo "===== WAITING FOR RENDER TO DEPLOY ====="
echo "Giving Render time to detect changes and begin deployment..."
sleep 30  # Wait for Render to detect changes

echo "===== VERIFY DEPLOYMENT ====="
echo "Waiting for 4 minutes to allow deployment to complete..."
sleep 240  # Wait for deployment to complete

# Run verification script
echo "Running verification tests..."
python verify_deployment.py | tee -a $log_file

# Run comprehensive API tests
echo "Running comprehensive API tests..."
python comprehensive_api_test.py | tee -a $log_file

echo "===== DEPLOYMENT COMPLETE ====="
echo "Check logs for any errors or issues."
echo "Deployment process completed at $(date)" | tee -a $log_file
