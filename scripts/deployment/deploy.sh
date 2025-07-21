#!/bin/bash
# Deployment script for Nutrivize v2

# Run the hotfix deployment script
cd backend && ./hotfix_deploy.sh

# Run the final verification test
echo "Running final verification test..."
cd ..
python -c "
import sys
import traceback
try:
    sys.path.append('.')
    from backend.app.services.unified_ai_service import UnifiedAIService
    print('✅ UnifiedAIService imported successfully')
    
    from backend.app.routes import analytics
    print('✅ Analytics routes imported successfully')
    
    sys.exit(0)
except Exception as e:
    print(f'❌ Error: {str(e)}')
    traceback.print_exc()
    sys.exit(1)
"

# Check the exit code
if [ $? -ne 0 ]; then
    echo "❌ Verification failed. Fix errors and try again."
    exit 1
fi

echo "✅ Verification successful. Ready for deployment!"

# Reminder of deployment steps
echo "
DEPLOYMENT INSTRUCTIONS:
------------------------
1. Commit these changes with: git add . && git commit -m 'Fix deployment issues'
2. Push to your deployment branch: git push origin master
3. Ensure Render is set to deploy from this branch
4. Monitor the deployment logs on render.com
"
