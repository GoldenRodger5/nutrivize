#!/usr/bin/env python3
"""
Fix for AI Chat Food Index Access
This script adds improved food index access to the unified_ai_service.py file
"""

import os
import sys
import re

def fix_unified_ai_service():
    """Fix the unified_ai_service.py file to properly access the food index"""
    
    service_path = "./backend/app/services/unified_ai_service.py"
    
    if not os.path.exists(service_path):
        print(f"Error: File not found: {service_path}")
        return False
    
    try:
        # Read the file
        with open(service_path, 'r') as f:
            content = f.read()
        
        # Check if the file already has the fix
        if "async def get_food_index_summary" in content:
            print("Food index access function already exists. Skipping fix.")
            return True
        
        # Find the class UnifiedAIService methods section
        class_def_match = re.search(r'class UnifiedAIService.*?:.*?\n', content, re.DOTALL)
        if not class_def_match:
            print("Error: Could not find UnifiedAIService class definition")
            return False
        
        # Find a good location to insert our new method
        # Look for the _get_comprehensive_user_context method
        context_method_match = re.search(r'async def _get_comprehensive_user_context.*?\n    \n', content, re.DOTALL)
        if not context_method_match:
            print("Warning: Could not find _get_comprehensive_user_context method. Will try another approach.")
            
            # Try to find another suitable insertion point
            methods_match = re.search(r'async def chat_with_context.*?\n    \n', content, re.DOTALL)
            if not methods_match:
                print("Error: Could not find suitable insertion point")
                return False
            
            # Insert after this method
            insert_pos = methods_match.end()
        else:
            # Insert after the _get_comprehensive_user_context method
            insert_pos = context_method_match.end()
        
        # Our new method to add
        new_method = """    async def get_food_index_summary(self, user_id: str, limit: int = 30) -> str:
        \"\"\"Get a summary of the user's food index items\"\"\"
        try:
            if not self.db:
                return "Unable to access food database."
            
            # Get user foods collection
            user_foods_collection = self.db.user_foods
            
            # Query for user's foods
            user_foods = list(user_foods_collection.find({"user_id": user_id}).limit(limit))
            
            if not user_foods:
                # Check the main food index if user doesn't have personal foods
                foods_collection = self.db.foods
                foods = list(foods_collection.find().limit(limit))
                
                if not foods:
                    return "No foods found in your food index."
                
                # Format foods from main index
                foods_summary = "Here are some foods from the main food index:\\n"
                for i, food in enumerate(foods[:20], 1):
                    name = food.get("name", "Unknown food")
                    category = food.get("category", "Uncategorized")
                    foods_summary += f"{i}. {name} ({category})\\n"
                
                if len(foods) > 20:
                    foods_summary += f"...and {len(foods) - 20} more foods.\\n"
                
                foods_summary += "\\nNote: These are from the main food index. You haven't added any personal foods yet."
                return foods_summary
            
            # Format user foods
            foods_summary = "Here are foods in your personal food index:\\n"
            for i, food in enumerate(user_foods[:20], 1):
                name = food.get("name", "Unknown food")
                category = food.get("category", "Uncategorized")
                date_added = food.get("date_added", "Unknown date")
                if isinstance(date_added, datetime):
                    date_str = date_added.strftime("%Y-%m-%d")
                else:
                    date_str = str(date_added)
                foods_summary += f"{i}. {name} ({category}) - Added: {date_str}\\n"
            
            if len(user_foods) > 20:
                foods_summary += f"...and {len(user_foods) - 20} more foods.\\n"
                
            return foods_summary
            
        except Exception as e:
            logger.error(f"Error getting food index summary: {e}")
            return f"Unable to retrieve food index data. Error: {str(e)}"
    
    """
        
        # Insert the new method into the file
        modified_content = content[:insert_pos] + new_method + content[insert_pos:]
        
        # Now modify the _get_comprehensive_user_context method to include food index data
        # Find the method
        context_method_pattern = r'async def _get_comprehensive_user_context\(self, user_id: str\).*?return user_context'
        context_method_match = re.search(context_method_pattern, modified_content, re.DOTALL)
        
        if not context_method_match:
            print("Warning: Could not find _get_comprehensive_user_context method to update")
        else:
            context_method = context_method_match.group(0)
            
            # Check if food index is already included
            if "food_index_summary" not in context_method:
                # Find the return statement
                return_match = re.search(r'return user_context', context_method)
                if return_match:
                    # The position just before the return statement
                    insert_pos = context_method_match.start() + return_match.start()
                    
                    # The code to add before the return
                    food_index_code = """
                # Get food index summary for quick access in chat
                food_index_summary = await self.get_food_index_summary(user_id)
                user_context["food_index_summary"] = food_index_summary
            
            """
                    
                    # Insert the food index code
                    modified_content = modified_content[:insert_pos] + food_index_code + modified_content[insert_pos:]
        
        # Now also modify the _build_contextual_system_prompt method to include food index info
        prompt_method_pattern = r'async def _build_contextual_system_prompt\(self, user_context: Dict\[str, Any\]\).*?return system_prompt'
        prompt_method_match = re.search(prompt_method_pattern, modified_content, re.DOTALL)
        
        if not prompt_method_match:
            print("Warning: Could not find _build_contextual_system_prompt method to update")
        else:
            prompt_method = prompt_method_match.group(0)
            
            # Check if food index is already included
            if "food_index_summary" not in prompt_method:
                # Find a good spot to insert the food index information
                # This is typically before the final system prompt construction
                insert_match = re.search(r'system_prompt = f', prompt_method)
                if insert_match:
                    # Position just before the system prompt construction
                    insert_pos = prompt_method_match.start() + insert_match.start()
                    
                    # Code to add before the system prompt construction
                    food_index_prompt_code = """
            # Add food index information to system prompt
            food_index_info = user_context.get("food_index_summary", "No food index data available")
            """
                    
                    # Insert the food index prompt code
                    modified_content = modified_content[:insert_pos] + food_index_prompt_code + modified_content[insert_pos:]
                    
                    # Now find the closing """ of the system prompt template
                    prompt_end_match = re.search(r'"""', modified_content[insert_pos + len(food_index_prompt_code):])
                    if prompt_end_match:
                        # Position just before the closing """
                        prompt_insert_pos = insert_pos + len(food_index_prompt_code) + prompt_end_match.start()
                        
                        # Food index information to add to the prompt
                        food_index_section = """

Food Index Data:
{food_index_info}

"""
                        # Insert the food index section
                        modified_content = modified_content[:prompt_insert_pos] + food_index_section + modified_content[prompt_insert_pos:]
        
        # Finally, update the chat_with_context method to check for food index related queries
        chat_method_pattern = r'async def chat_with_context.*?return ChatResponse'
        chat_method_match = re.search(chat_method_pattern, modified_content, re.DOTALL)
        
        if not chat_method_match:
            print("Warning: Could not find chat_with_context method to update")
        else:
            chat_method = chat_method_match.group(0)
            
            # Check if food index query detection is already included
            if "food index" not in chat_method.lower():
                # Find a good spot to insert food index query detection
                # This is typically after getting user context but before building system prompt
                match_pos = re.search(r'# Get user context for personalized responses.*?\n', chat_method)
                if match_pos:
                    insert_pos = chat_method_match.start() + match_pos.end()
                    
                    # Code to add after getting user context
                    food_index_query_code = """            # Check if the message is about the food index
            if any(term in processed_request.message.lower() for term in ["food index", "my foods", "foods i have", "foods in my"]):
                # Update the food index summary for immediate use
                user_context["food_index_summary"] = await self.get_food_index_summary(user_id)
                logger.info(f"Food index query detected. Retrieved food index for user {user_id}")
            
            """
                    
                    # Insert the food index query detection code
                    modified_content = modified_content[:insert_pos] + food_index_query_code + modified_content[insert_pos:]
        
        # Write the modified content back to the file
        with open(service_path, 'w') as f:
            f.write(modified_content)
        
        print("Successfully added food index access to unified_ai_service.py")
        return True
    
    except Exception as e:
        print(f"Error fixing unified_ai_service.py: {e}")
        return False


if __name__ == "__main__":
    # Run the fix
    if fix_unified_ai_service():
        print("✅ Successfully applied the AI chat food index access fix")
        sys.exit(0)
    else:
        print("❌ Failed to apply the AI chat food index access fix")
        sys.exit(1)
