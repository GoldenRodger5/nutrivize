#!/bin/bash

# Fix import paths for components moved to subdirectories

echo "Fixing import paths after component reorganization..."

# Fix imports from components/food/* to ../../
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../utils/|from '../../utils/|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../types'|from '../../types'|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../hooks/|from '../../hooks/|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../contexts/|from '../../contexts/|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../services/|from '../../services/|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../constants/|from '../../constants/|g" {} \;

# Fix imports from components/ui/* to ../../
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../utils/|from '../../utils/|g" {} \;
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../types'|from '../../types'|g" {} \;
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../hooks/|from '../../hooks/|g" {} \;
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../contexts/|from '../../contexts/|g" {} \;
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../services/|from '../../services/|g" {} \;
find frontend/src/components/ui -name "*.tsx" -exec sed -i '' "s|from '../constants/|from '../../constants/|g" {} \;

# Fix imports from components/nutrition/* to ../../
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../utils/|from '../../utils/|g" {} \;
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../types'|from '../../types'|g" {} \;
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../hooks/|from '../../hooks/|g" {} \;
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../contexts/|from '../../contexts/|g" {} \;
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../services/|from '../../services/|g" {} \;
find frontend/src/components/nutrition -name "*.tsx" -exec sed -i '' "s|from '../constants/|from '../../constants/|g" {} \;

# Fix imports from components/dashboard/* to ../../
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../utils/|from '../../utils/|g" {} \;
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../types'|from '../../types'|g" {} \;
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../hooks/|from '../../hooks/|g" {} \;
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../contexts/|from '../../contexts/|g" {} \;
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../services/|from '../../services/|g" {} \;
find frontend/src/components/dashboard -name "*.tsx" -exec sed -i '' "s|from '../constants/|from '../../constants/|g" {} \;

# Fix imports from components/auth/* to ../../
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../utils/|from '../../utils/|g" {} \;
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../types'|from '../../types'|g" {} \;
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../hooks/|from '../../hooks/|g" {} \;
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../contexts/|from '../../contexts/|g" {} \;
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../services/|from '../../services/|g" {} \;
find frontend/src/components/auth -name "*.tsx" -exec sed -i '' "s|from '../constants/|from '../../constants/|g" {} \;

# Fix cross-component imports that need to reference other organized components
# Fix QuantityUnitInput imports in food components
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from './QuantityUnitInput'|from '../ui/QuantityUnitInput'|g" {} \;
find frontend/src/components/food -name "*.tsx" -exec sed -i '' "s|from '../QuantityUnitInput'|from '../ui/QuantityUnitInput'|g" {} \;

echo "Import path fixes completed!"
