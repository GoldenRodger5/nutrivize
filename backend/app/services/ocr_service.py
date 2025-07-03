from google.cloud import vision
import io
import os
import json
import logging
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRService:
    """Service for extracting text from images using Google Cloud Vision API"""
    
    def __init__(self):
        # Check if credentials are available
        self.credentials_available = False
        self.client = None
        
        # Try to initialize client with credentials from environment
        try:
            # First, try to get credentials from JSON environment variable (for production)
            google_creds_json = os.environ.get('GOOGLE_CLOUD_VISION_CREDENTIALS_JSON')
            
            if google_creds_json:
                # Parse JSON from environment variable and set up credentials
                creds_dict = json.loads(google_creds_json)
                
                # Create a temporary credentials file for the Google Cloud client
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    json.dump(creds_dict, f)
                    temp_creds_path = f.name
                
                # Set the environment variable for Google Cloud client
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_creds_path
                
                self.client = vision.ImageAnnotatorClient()
                self.credentials_available = True
                logger.info("Google Cloud Vision client initialized from environment variable")
                
                # Clean up the temporary file
                os.unlink(temp_creds_path)
                
            # Fallback to file-based credentials (for development)
            elif os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                self.client = vision.ImageAnnotatorClient()
                self.credentials_available = True
                logger.info("Google Cloud Vision client initialized from file")
                
            else:
                logger.warning("Google Cloud Vision credentials not found in environment variable or file")
                
        except Exception as e:
            logger.warning(f"Failed to initialize Google Cloud Vision client: {e}")
            self.credentials_available = False
    
    def extract_text_from_image(self, image_bytes: bytes) -> Optional[str]:
        """
        Extract text from an image using Google Cloud Vision API
        
        Args:
            image_bytes: The image data in bytes
            
        Returns:
            A string containing all the text detected in the image, or None if error
        """
        if not self.credentials_available:
            logger.warning("Google Cloud Vision not available, using mock response")
            return self._get_mock_text()
        
        try:
            logger.info(f"Processing image of size: {len(image_bytes)} bytes")
            
            image = vision.Image(content=image_bytes)
            
            logger.info("Sending request to Google Cloud Vision API...")
            response = self.client.text_detection(image=image)
            
            if response.error.message:
                logger.error(f"Error from Vision API: {response.error.message}")
                return None
                
            texts = response.text_annotations
            
            logger.info(f"Received {len(texts)} text annotations from Vision API")
            
            if texts:
                # Return the first text annotation which contains all detected text
                extracted_text = texts[0].description
                logger.info(f"Extracted {len(extracted_text)} characters of text")
                return extracted_text
            
            logger.warning("No text detected in the image")
            return None
            
        except Exception as e:
            logger.error(f"Error in OCR processing: {str(e)}")
            return None
    
    def _get_mock_text(self) -> str:
        """Mock nutrition label text for testing when Google Cloud Vision is not available"""
        return """
        Nutrition Facts
        Serving Size 1 container (170g)
        Servings Per Container 1
        
        Amount Per Serving
        Calories 150        Calories from Fat 70
        
                                        % Daily Value*
        Total Fat 8g                       12%
        Saturated Fat 5g                   25%
        Trans Fat 0g
        Cholesterol 30mg                   10%
        Sodium 85mg                        4%
        Total Carbohydrate 16g             5%
        Dietary Fiber 0g                   0%
        Sugars 15g
        Protein 4g
        
        Vitamin A 6%     •     Vitamin C 0%
        Calcium 15%      •     Iron 0%
        
        * Percent Daily Values are based on a 2,000
        calorie diet.
        """

# Create singleton instance
ocr_service = OCRService()
