import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_image_mock(image_bytes: bytes) -> str:
    """
    Mock implementation of text extraction for testing
    
    Args:
        image_bytes: The image data in bytes
        
    Returns:
        A string containing mock nutrition facts data
    """
    logger.info(f"MOCK OCR: Processing {len(image_bytes)} bytes of image data")
    
    # For testing purposes, return a mock nutrition label text
    mock_text = """
    Nutrition Facts
    Serving Size 1 tortilla (36g)
    Servings Per Container 10
    
    Amount Per Serving
    Calories 110        Calories from Fat 25
    
                                % Daily Value*
    Total Fat 3g                   5%
    Saturated Fat 1g               5%
    Trans Fat 0g
    Polyunsaturated Fat 0.5g
    Monounsaturated Fat 1g
    Cholesterol 0mg                0%
    Sodium 160mg                   7%
    Total Carbohydrate 19g         6%
    Dietary Fiber 3g              12%
    Sugars 1g
    Protein 3g
    
    Vitamin A 0%     •     Vitamin C 0%
    Calcium 4%       •     Iron 6%
    
    * Percent Daily Values are based on a 2,000
    calorie diet. Your daily values may be higher
    or lower depending on your calorie needs.
    """
    
    logger.info(f"MOCK OCR: Returning {len(mock_text)} characters of text")
    return mock_text 