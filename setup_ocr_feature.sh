#!/bin/bash

# Setup script for the OCR nutrition label scanner feature

echo "=== Setting up Nutrition Label OCR Feature ==="

# Change to the backend directory
echo "=== Installing backend dependencies ==="
cd backend 

# Install Python dependencies
pip install google-cloud-vision anthropic python-jose[cryptography]

# Create necessary directories
mkdir -p app/services
mkdir -p app/routes

echo "=== Ensure Google Cloud credentials are set up ==="
echo "Make sure your Google Cloud credentials are set in the environment variable:"
echo "export GOOGLE_APPLICATION_CREDENTIALS=/path/to/food-tracker-6096d-4007a1f2a2ab.json"

echo "=== Ensure Anthropic API key is set up ==="
echo "Make sure your Anthropic API key is set in the environment variable:"
echo "export ANTHROPIC_API_KEY=your_anthropic_api_key"

echo "=== Setup complete! ==="
echo "To use the OCR feature, run the backend server with the required environment variables and use the Add Food modal in the frontend." 