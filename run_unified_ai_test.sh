#!/bin/bash

# Run the comprehensive end-to-end test for the Unified AI system
# Tests decimal/float handling in all operations

echo "🧪 Running Unified AI End-to-End Test..."
python3 test_unified_ai_e2e.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Check the output above for details."
fi

exit $exit_code
