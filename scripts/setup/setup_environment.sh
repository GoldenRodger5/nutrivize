#!/bin/bash
# Environment setup script for Nutrivize v2 with OCR functionality

echo "🚀 Setting up Nutrivize v2 environment..."

# Set Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS="/Users/isaacmineo/Main/projects/nutrivize-v2/food-tracker-6096d-c16bed4f6c29.json"

# Set Anthropic API key for AI-powered nutrition parsing
export ANTHROPIC_API_KEY="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"

echo "✅ Google Cloud Vision API credentials set"
echo "📍 Credentials path: $GOOGLE_APPLICATION_CREDENTIALS"
echo "✅ Anthropic API key set for AI nutrition parsing"

# Check if the credentials file exists
if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "✅ Credentials file found"
else
    echo "❌ Credentials file not found at $GOOGLE_APPLICATION_CREDENTIALS"
    exit 1
fi

echo ""
echo "🎯 Environment ready! You can now:"
echo "1. Backend: cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "2. Frontend: cd frontend && npm run dev" 
echo "3. Test OCR: python test_ocr_functionality.py"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:5174"
echo "- Backend API: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"
