#!/bin/bash

echo "=== Installing Improved API Resilience and Meal Diversity ==="

# Make sure we're in the project root
cd "$(dirname "$0")"

# Install required dependencies
echo "Installing dependencies..."
pip install tenacity

# Create backup of original files
echo "Creating backups of original files..."
cp backend/app/meal_suggestions.py backend/app/meal_suggestions.py.bak
cp backend/app/main.py backend/app/main.py.bak

# Move our improved files to replace the originals
echo "Installing improved modules..."
cp backend/app/improved_resilience.py backend/app/improved_resilience.py
cp backend/app/meal_suggestions_improved.py backend/app/meal_suggestions.py
cp backend/app/main_improved.py backend/app/main.py

echo "Updating __init__.py..."
# Ensure our improved functions are properly imported
cat > backend/app/__init__.py << EOF
# Nutrivize backend app
# Import improved modules for API resilience and meal diversity
from .improved_resilience import (
    validate_and_parse_meal_response,
    generate_fallback_meal,
    get_meal_suggestions_from_ai_with_retry,
    MealDiversityTracker,
    build_enhanced_meal_prompt
)
EOF

echo "Installation complete!"
echo "The improved API with better resilience and meal diversity is now installed."
echo ""
echo "Key improvements:"
echo "1. Enhanced API resilience with retry logic and fallback meals"
echo "2. Improved meal diversity through tracking and constraints"
echo "3. More robust error handling for API responses"
echo ""
echo "To start the server, run: cd backend && python -m app.main"
echo "To restore the original version, run: ./restore_original_api.sh"

# Create a restore script
cat > restore_original_api.sh << EOF
#!/bin/bash
echo "Restoring original API files..."
cp backend/app/meal_suggestions.py.bak backend/app/meal_suggestions.py
cp backend/app/main.py.bak backend/app/main.py
echo "Original API restored."
EOF

chmod +x restore_original_api.sh

echo "=== Installation Complete ===" 