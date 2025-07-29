"""
Apply a precise fix for the unified_ai_service.py file
"""

import re

def fix_chat_with_context_function():
    """Fix the specific function with indentation issues"""
    service_file = "unified_ai_service.py"
    
    # Read the file
    with open(service_file, "r") as f:
        content = f.read()
    
    # Define the fixed function
    fixed_function = """    async def chat_with_context(self, request: ChatRequest, user_id: str) -> ChatResponse:
        \"\"\"
        Enhanced chat with full context awareness and smart operations
        \"\"\"
        try:
            # Get user context for personalized responses
            user_context = await self._get_comprehensive_user_context(user_id)
            
            # Process any embedded operations in the message
            processed_request, operations_results = await self._process_smart_operations(
                request, user_id, user_context
            )
            
            # Check if the message is about the food index
            if any(term in processed_request.message.lower() for term in ["food index", "my foods", "foods i have", "foods in my"]):
                # Update the food index summary for immediate use
                user_context["food_index_summary"] = await self.get_food_index_summary(user_id)
                logger.info(f"Food index query detected. Retrieved food index for user {user_id}")"""
    
    # Find the starting point of the function
    pattern = r"async def chat_with_context.*?try:.*?user_context = await.*?if any\(term in processed_request\.message\.lower\(\).*?user_context\[\"food_index_summary\"\].*?logger\.info\(f\"Food index"
    
    # Replace the problematic part with the fixed version
    fixed_content = re.sub(pattern, fixed_function, content, flags=re.DOTALL)
    
    # Write back to the file
    with open(service_file, "w") as f:
        f.write(fixed_content)
    
    print("Applied specific fix to chat_with_context function")

if __name__ == "__main__":
    fix_chat_with_context_function()
