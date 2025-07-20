#!/usr/bin/env python3
"""
Fix Indentation Errors in unified_ai_service.py
"""

import re
import sys
import os

def fix_indentation_errors():
    """Fix indentation errors in unified_ai_service.py file"""
    
    service_path = "./backend/app/services/unified_ai_service.py"
    
    if not os.path.exists(service_path):
        print(f"Error: File not found: {service_path}")
        return False
    
    try:
        # Read the file
        with open(service_path, 'r') as f:
            content = f.read()
        
        # Create backup
        backup_path = f"{service_path}.bak"
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"Created backup at {backup_path}")
        
        # Fix specific indentation issues identified
        print("Fixing specific indentation errors...")
        
        # 1. Fix the chat_with_context method
        chat_method_pattern = re.compile(
            r'(    async def chat_with_context\(self, request: ChatRequest, user_id: str\) -> ChatResponse:\n'
            r'        """\n'
            r'        Enhanced chat with full context awareness and smart operations\n'
            r'        """\n'
            r'        try:\n'
            r'            # Get user context for personalized responses\n'
            r'            # Check if the message is about the food index\n'
            r'            if any\(term in processed_request\.message\.lower\(\) for term in \["food index", "my foods", "foods i have", "foods in my"\]\):\n'
            r'                # Update the food index summary for immediate use\n'
            r'                user_context\["food_index_summary"\] = await self\.get_food_index_summary\(user_id\)\n'
            r'                logger\.info\(f"Food index query detected\. Retrieved food index for user {user_id}"\)\n'
            r'            \n'
            r'                        user_context = await self\._get_comprehensive_user_context\(user_id\))',
            re.DOTALL
        )
        
        replacement = (
            '    async def chat_with_context(self, request: ChatRequest, user_id: str) -> ChatResponse:\n'
            '        """\n'
            '        Enhanced chat with full context awareness and smart operations\n'
            '        """\n'
            '        try:\n'
            '            # Get user context for personalized responses\n'
            '            user_context = await self._get_comprehensive_user_context(user_id)\n'
            '            \n'
            '            # Process any embedded operations in the message\n'
            '            processed_request, operations_results = await self._process_smart_operations(\n'
            '                request, user_id, user_context\n'
            '            )\n'
            '            \n'
            '            # Check if the message is about the food index\n'
            '            if any(term in processed_request.message.lower() for term in ["food index", "my foods", "foods i have", "foods in my"]):\n'
            '                # Update the food index summary for immediate use\n'
            '                user_context["food_index_summary"] = await self.get_food_index_summary(user_id)\n'
            '                logger.info(f"Food index query detected. Retrieved food index for user {user_id}")'
        )
        
        content = chat_method_pattern.sub(replacement, content)
        
        # 2. Fix the _build_contextual_system_prompt method indentation
        build_prompt_pattern = re.compile(r'        async def _build_contextual_system_prompt\(self, user_context: Dict\[str, Any\]\) -> str:')
        content = build_prompt_pattern.sub('    async def _build_contextual_system_prompt(self, user_context: Dict[str, Any]) -> str:', content)
        
        # Write the fixed content back
        with open(service_path, 'w') as f:
            f.write(content)
        
        print("✅ Fixed indentation errors in unified_ai_service.py")
        return True
        
    except Exception as e:
        print(f"Error fixing unified_ai_service.py: {e}")
        return False

if __name__ == "__main__":
    # Run the fix
    if fix_indentation_errors():
        print("✅ Successfully fixed indentation errors")
        sys.exit(0)
    else:
        print("❌ Failed to fix indentation errors")
        sys.exit(1)
