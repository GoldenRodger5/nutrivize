#!/usr/bin/env python3
"""
Script to start the analytics refresh background service
Run this alongside your main FastAPI server to enable daily AI insights refresh
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.analytics_refresh_service import analytics_refresh_service

async def main():
    """Start the analytics refresh service"""
    print("🚀 Starting Analytics Refresh Background Service...")
    print("📊 This service will automatically refresh AI insights daily at 6:00 AM")
    print("👥 Only active users (who logged food in the last 7 days) will be refreshed")
    print("⏰ Press Ctrl+C to stop the service\n")
    
    try:
        await analytics_refresh_service.start_background_service()
    except KeyboardInterrupt:
        print("\n🛑 Stopping analytics refresh service...")
        analytics_refresh_service.stop_background_service()
        print("✅ Service stopped successfully")
    except Exception as e:
        print(f"❌ Error running analytics refresh service: {e}")

if __name__ == "__main__":
    asyncio.run(main())
