#!/bin/bash

# Script to deploy with hotfixes but without indentation fixing
echo "Starting modified deployment..."

# Create a timestamp for backups
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="/tmp/nutrivize_backup_${TIMESTAMP}"
mkdir -p $BACKUP_DIR
echo "Created backup directory: $BACKUP_DIR"

# Backend directory
BACKEND_DIR="./backend/app"

# 1. Apply analytics.py hotfix
echo "Backing up and replacing analytics.py..."
cp ${BACKEND_DIR}/routes/analytics.py $BACKUP_DIR/
cp hotfixes/analytics_fixed.py ${BACKEND_DIR}/routes/analytics.py
echo "Replaced analytics.py with hotfix version"

# Skip the indentation fix for unified_ai_service.py
echo "Skipping unified_ai_service.py indentation fix..."

# 3. Update main.py with safer imports
echo "Updating main.py with safer imports..."
cp ${BACKEND_DIR}/main.py $BACKUP_DIR/
cp hotfixes/main_fixed.py ${BACKEND_DIR}/main.py
echo "Updated main.py with safer imports"

echo "Modified deployment completed!"
echo "Backup files are in: $BACKUP_DIR"

# Run verification test
echo "Running final verification test..."
python -c "
try:
    import sys
    sys.path.append('./backend')
    from app.services.unified_ai_service import UnifiedAIService
    from app.routes.analytics import router as analytics_router
    from app.main import app
    print('✅ Verification successful! All modules loaded correctly.')
except Exception as e:
    print(f'❌ Error: {str(e)}')
    import traceback
    traceback.print_exc()
    print('❌ Verification failed. Fix errors and try again.')
    exit(1)
"
