#!/usr/bin/env python3
"""
Debug the vector context generation
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up environment
os.environ.setdefault('ENVIRONMENT', 'development')

from app.services.vector_ai_service import vector_ai_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_context_generation():
    """
    Debug what context is being generated
    """
    try:
        user_id = "GME7nGpJQRc2v9T057vJ4oyqAJN2"
        query = "What high protein meal plans have I created before?"
        
        logger.info(f"🧪 Debug Context Generation")
        logger.info("=" * 60)
        
        # Get the vector context
        context = await vector_ai_service.get_relevant_context(
            user_id=user_id,
            query=query,
            context_type="all"
        )
        
        logger.info(f"📊 Context Statistics: {context['context_stats']}")
        logger.info(f"📝 Context Summary:")
        logger.info("-" * 40)
        logger.info(context['context_summary'])
        logger.info("-" * 40)
        
        logger.info(f"🗂️ Raw Context Categories:")
        for category, items in context['raw_context'].items():
            logger.info(f"  {category}: {len(items)} items")
            for i, item in enumerate(items[:2]):  # Show first 2 items
                logger.info(f"    {i+1}. {item}")
        
        logger.info("\n✅ Debug complete!")
        
    except Exception as e:
        logger.error(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_context_generation())
