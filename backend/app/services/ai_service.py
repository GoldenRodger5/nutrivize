import os
import logging
import json
import anthropic
from typing import Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_nutrition_text(raw_text: str) -> Dict[str, Any]:
    """
    Process raw OCR text from a nutrition label using Anthropic Claude to extract structured nutrition data
    
    Args:
        raw_text: The raw text from OCR processing
        
    Returns:
        A dictionary containing structured nutrition information
    """
    try:
        # Initialize the Claude client
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("Anthropic API key not found in environment variables")
            return {}
            
        client = anthropic.Anthropic(api_key=api_key)
        
        # Create the prompt for Claude
        prompt = f"""
You are an expert at extracting nutrition information from food labels. Your task is to extract structured data from OCR-processed text of a nutrition label.

Extract the following information:
- Brand (e.g., "Kellogg's", "Nature Valley")
- Food Name (e.g., "Corn Flakes", "Granola Bars")
- Serving Size (e.g., "1 cup (28g)", "2 bars (42g)")
- Calories (per serving)
- Total Fat (g)
- Saturated Fat (g)
- Trans Fat (g)
- Cholesterol (mg)
- Sodium (mg)
- Total Carbohydrates (g)
- Dietary Fiber (g)
- Total Sugars (g)
- Added Sugars (g)
- Protein (g)
- Any vitamins or minerals with percentages (e.g. Vitamin D 10%, Calcium 20%)

For the OCR text below, extract this information and format it as a valid JSON object with the keys:
"brand", "name", "serving_size", "calories", "total_fat", "saturated_fat", "trans_fat", "cholesterol", "sodium", "total_carbs", "dietary_fiber", "total_sugars", "added_sugars", "protein", "vitamins_minerals"

For fields you can't find, use null. Make sure the output is a valid JSON object.

OCR Text:
```
{raw_text}
```

JSON Output:
"""
        
        # Call Claude API
        message = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0.0,
            system="You analyze nutrition labels and extract structured information in JSON format.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract and parse the JSON response
        response_text = message.content[0].text
        
        # Try to extract JSON from the response
        try:
            # Look for JSON-like patterns in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                nutrition_data = json.loads(json_str)
                
                # Format the data for use with our food form
                formatted_data = {
                    "name": f"{nutrition_data.get('brand', '')} {nutrition_data.get('name', '')}".strip(),
                    "serving_size": extract_numeric_value(nutrition_data.get('serving_size', '')),
                    "serving_unit": extract_unit(nutrition_data.get('serving_size', '')),
                    "calories": to_number(nutrition_data.get('calories')),
                    "proteins": to_number(nutrition_data.get('protein')),
                    "carbs": to_number(nutrition_data.get('total_carbs')),
                    "fats": to_number(nutrition_data.get('total_fat')),
                    "fiber": to_number(nutrition_data.get('dietary_fiber')),
                    "sugars": to_number(nutrition_data.get('total_sugars')),
                    "saturated_fat": to_number(nutrition_data.get('saturated_fat')),
                    "trans_fat": to_number(nutrition_data.get('trans_fat')),
                    "cholesterol": to_number(nutrition_data.get('cholesterol')),
                    "sodium": to_number(nutrition_data.get('sodium')),
                    "added_sugars": to_number(nutrition_data.get('added_sugars')),
                    "vitamins_minerals": nutrition_data.get('vitamins_minerals', {})
                }
                
                return formatted_data
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Claude response: {e}")
        
        return {}
        
    except Exception as e:
        logger.error(f"Error in AI processing: {str(e)}")
        return {}

def to_number(value) -> float:
    """Convert a value to a number, returning 0 if conversion fails"""
    if value is None:
        return 0
    try:
        # Remove any non-numeric characters except decimal point
        if isinstance(value, str):
            # Keep only digits and decimal points
            numeric_str = ''.join(c for c in value if c.isdigit() or c == '.')
            return float(numeric_str) if numeric_str else 0
        return float(value)
    except (ValueError, TypeError):
        return 0

def extract_numeric_value(serving_size: str) -> float:
    """Extract the numeric portion from a serving size string"""
    if not serving_size:
        return 100  # Default to 100 if no serving size
        
    try:
        # Try to find any numeric values in the string
        import re
        numbers = re.findall(r'\d+\.?\d*', serving_size)
        if numbers:
            return float(numbers[0])
        return 100  # Default to 100 if no numbers found
    except Exception:
        return 100  # Default to 100 on error

def extract_unit(serving_size: str) -> str:
    """Extract the unit portion from a serving size string"""
    if not serving_size:
        return "g"  # Default to grams
        
    common_units = ["g", "mg", "ml", "oz", "cup", "tbsp", "tsp", "piece", "slice", "serving"]
    
    try:
        # Check for common units in the serving size
        for unit in common_units:
            if unit in serving_size.lower():
                return unit
                
        # If we find "grams", return "g"
        if "gram" in serving_size.lower():
            return "g"
            
        # Check for specific patterns
        if "ounce" in serving_size.lower() or "oz" in serving_size.lower():
            return "oz"
            
        return "g"  # Default to grams
    except Exception:
        return "g"  # Default to grams on error 