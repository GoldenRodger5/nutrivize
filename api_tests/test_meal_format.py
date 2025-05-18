"""
Test different meal suggestion JSON formats to find the issue.
"""
import os
import sys
import json
import asyncio

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

def analyze_json(json_str):
    """Analyze a JSON string character by character"""
    print(f"Analyzing JSON string: {json_str}")
    print("Character by character analysis:")
    for i, char in enumerate(json_str):
        if i >= 150 and i <= 160:  # Focus on the problem area
            print(f"Position {i}: '{char}' (ASCII: {ord(char)})")
    
    # Try to parse manually
    try:
        # Try with relaxed parsing using demjson if available
        try:
            import demjson
            parsed = demjson.decode(json_str)
            print(f"Parsed with demjson: {parsed}")
        except ImportError:
            print("demjson not available")
        except Exception as e:
            print(f"demjson error: {e}")
            
        # Try fixing common issues
        fixed = json_str.replace("'", '"')
        # Ensure all field names have quotes
        for field in ["protein", "carbs", "fat"]:
            if f'"{field}' in fixed and not f'"{field}"' in fixed:
                fixed = fixed.replace(f'"{field}', f'"{field}"')
                
        # Make sure there's a closing brace for the nested object
        open_braces = fixed.count('{')
        close_braces = fixed.count('}')
        if open_braces > close_braces:
            fixed += '}' * (open_braces - close_braces)
            
        print(f"Fixed JSON: {fixed}")
        parsed = json.loads(fixed)
        print(f"Successfully parsed fixed JSON: {parsed}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")

async def main():
    # Different formats to test
    json_formats = [
        # Format 1: Original format that causes issues
        """{"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}""",
        
        # Format 2: With spaces after colons
        """{"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": 600, "protein": 40, "carbs": 50, "fat": 20}}""",
        
        # Format 3: With string values for numbers
        """{"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "remaining_macros": {"calories": "600", "protein": "40", "carbs": "50", "fat": "20"}}""",
        
        # Format 4: Simplified format with fewer nesting
        """{"meal_type": "dinner", "time_of_day": "evening", "preference": "high-protein", "calories": 600, "protein": 40, "carbs": 50, "fat": 20}"""
    ]
    
    for i, json_format in enumerate(json_formats, 1):
        print(f"\n===== Format {i} =====")
        analyze_json(json_format)

if __name__ == "__main__":
    asyncio.run(main()) 