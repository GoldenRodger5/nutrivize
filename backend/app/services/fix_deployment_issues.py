"""
Fix for analytics endpoints and potential indentation errors
"""

import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fix_analytics_routes():
    """Fix analytics routes to ensure they handle errors gracefully"""
    routes_file = os.path.join(os.path.dirname(__file__), '../routes/analytics.py')
    
    if os.path.exists(routes_file):
        with open(routes_file, 'r') as f:
            content = f.read()
        
        # Add better error handling to all routes
        new_content = content.replace('@router.get("/nutrition-trends")', 
                                     '@router.get("/nutrition-trends")\n@handle_analytics_error')
        new_content = new_content.replace('@router.get("/goal-progress")', 
                                     '@router.get("/goal-progress")\n@handle_analytics_error')
        new_content = new_content.replace('@router.get("/food-patterns")', 
                                     '@router.get("/food-patterns")\n@handle_analytics_error')
        new_content = new_content.replace('@router.get("/macro-breakdown")', 
                                     '@router.get("/macro-breakdown")\n@handle_analytics_error')
        new_content = new_content.replace('@router.get("/insights")', 
                                     '@router.get("/insights")\n@handle_analytics_error')
        
        # Write back to file if changes were made
        if content != new_content:
            with open(routes_file, 'w') as f:
                f.write(new_content)
            logger.info(f"Applied fixes to {routes_file}")
        else:
            logger.info(f"No changes needed for {routes_file}")

def fix_unified_ai_service():
    """Fix any indentation issues in unified_ai_service.py"""
    service_file = os.path.join(os.path.dirname(__file__), 'unified_ai_service.py')
    
    if os.path.exists(service_file):
        with open(service_file, 'r') as f:
            content = f.read()
        
        # Fix specific indentation issues that may be causing problems
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if "user_context = await self._get_comprehensive_user_context(user_id)" in line:
                # Make sure there's no unexpected whitespace
                strip_line = line.strip()
                lines[i] = "            " + strip_line  # 12 spaces for indentation (standard for try block)
        
        new_content = '\n'.join(lines)
        
        # Write back to file if changes were made
        if content != new_content:
            with open(service_file, 'w') as f:
                f.write(new_content)
            logger.info(f"Applied fixes to {service_file}")
        else:
            logger.info(f"No changes needed for {service_file}")

def main():
    # Fix analytics routes
    fix_analytics_routes()
    
    # Fix unified_ai_service.py
    fix_unified_ai_service()
    
    logger.info("Fixes applied successfully")

if __name__ == "__main__":
    main()
