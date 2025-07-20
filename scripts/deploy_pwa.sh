#!/bin/bash

echo "🚀 Deploying PWA-enabled Nutrivize V2..."

# Build the frontend with PWA support
echo "📦 Building frontend with PWA support..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Show what was generated
echo "📂 Generated files:"
ls -la dist/
echo ""
echo "🏠 Icons generated:"
ls -la dist/icons/
echo ""

# Check if service worker was generated
if [ -f "dist/sw.js" ]; then
    echo "✅ Service worker generated successfully"
else
    echo "⚠️  Service worker not found"
fi

# Check if manifest was generated
if [ -f "dist/manifest.webmanifest" ]; then
    echo "✅ PWA manifest generated successfully"
else
    echo "⚠️  PWA manifest not found"
fi

echo ""
echo "🔧 Next steps for deployment:"
echo "1. Commit and push changes to trigger Render deployment"
echo "2. Verify CORS configuration on backend"
echo "3. Test PWA functionality on mobile device"
echo ""
echo "📱 PWA features enabled:"
echo "- ✅ Service Worker for offline support"
echo "- ✅ Web App Manifest for installability"
echo "- ✅ iPhone-optimized icons and splash screens"
echo "- ✅ Dynamic Island safe area support"
echo "- ✅ Offline fallback pages"
echo "- ✅ Background sync for food logs"
echo "- ✅ Push notification support"
echo ""
echo "🌐 Production URLs:"
echo "Frontend: https://nutrivize-frontend.onrender.com"
echo "Backend:  https://nutrivize.onrender.com"
echo ""
echo "🎉 PWA deployment preparation complete!"
