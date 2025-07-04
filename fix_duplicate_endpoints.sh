#!/bin/bash

# Script to fix duplicate endpoints in Nutrivize API
echo "Fixing duplicate endpoints in Nutrivize API..."

# Make backup of main.py
cp backend/app/main.py backend/app/main.py.bak
echo "✅ Created backup of main.py"

# Rename original ai_health.py
mv backend/app/routes/ai_health.py backend/app/routes/ai_health_original.py
echo "✅ Renamed original ai_health.py to ai_health_original.py"

# Move the fixed ai_health file
mv backend/app/routes/ai_health_fix.py backend/app/routes/ai_health.py
echo "✅ Installed new ai_health.py with renamed endpoint"

# Consolidate analytics files
if [ -f "backend/app/routes/analytics_fixed.py" ]; then
  echo "Found analytics_fixed.py - consolidating analytics routes"
  mv backend/app/routes/analytics.py backend/app/routes/analytics_original.py
  mv backend/app/routes/analytics_fixed.py backend/app/routes/analytics.py
  echo "✅ Consolidated analytics routes"
fi

echo "Creating documentation of endpoint fixes..."
cat > ENDPOINT_FIXES.md << EOL
# Nutrivize API Endpoint Fixes

## Duplicate Endpoint Fixes - July 3, 2025

### Fixed Issues:

1. **AI Health Score Duplicate Endpoints**
   - Problem: Both \`ai_dashboard.py\` and \`ai_health.py\` had a \`/health-score\` endpoint
   - Solution: Renamed endpoint in \`ai_health.py\` to \`/user-health-score\`
   - Original files preserved as \`ai_health_original.py\`

2. **Analytics Route Consolidation**
   - Problem: Multiple analytics route files with duplicate endpoints
   - Solution: Consolidated to use the most updated version (\`analytics_fixed.py\`)
   - Original files preserved as \`analytics_original.py\`

3. **Meal Planning & AI Overlap**
   - Note: The \`/ai/meal-plan\` and \`/meal-planning/generate-plan\` endpoints are similar but not exact duplicates.
   - They serve different client needs with different request/response models.

### ShoppingListItemUpdateRequest:
- No changes needed - the model correctly omits \`item_id\` since it's provided in the URL path

### Next Steps:
- Test all endpoints to ensure they're functioning correctly
- Consider further consolidation of similar functionality
- Review frontend code to ensure it's using the correct endpoints
EOL

echo "✅ Created ENDPOINT_FIXES.md documentation"
echo "All fixes complete!"
