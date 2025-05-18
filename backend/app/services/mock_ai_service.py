import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_nutrition_text_mock(raw_text: str) -> Dict[str, Any]:
    """
    Mock implementation of nutrition text parsing
    
    Args:
        raw_text: The raw text from OCR processing
        
    Returns:
        A dictionary containing structured nutrition information
    """
    logger.info(f"MOCK AI: Processing {len(raw_text)} characters of text")
    
    # Return predefined nutrition info for tortillas
    mock_nutrition_info = {
        "name": "Flour Tortilla",
        "serving_size": 36,
        "serving_unit": "g",
        "calories": 110,
        "proteins": 3,
        "carbs": 19,
        "fats": 3,
        "fiber": 3,
        "sugars": 1,
        "saturated_fat": 1,
        "trans_fat": 0,
        "cholesterol": 0,
        "sodium": 160,
        "vitamins_minerals": {
            "vitamin_a": "0%",
            "vitamin_c": "0%",
            "calcium": "4%",
            "iron": "6%"
        }
    }
    
    logger.info(f"MOCK AI: Returning nutrition info with {len(mock_nutrition_info)} fields")
    return mock_nutrition_info 