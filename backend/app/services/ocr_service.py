from google.cloud import vision
import io
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from an image using Google Cloud Vision API
    
    Args:
        image_bytes: The image data in bytes
        
    Returns:
        A string containing all the text detected in the image
    """
    try:
        # Ensure credentials are set
        creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        logger.info(f"Using Google Cloud credentials from: {creds_path}")
        
        if not creds_path:
            logger.warning("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
            return ""
        
        # Log the size of the image
        logger.info(f"Processing image of size: {len(image_bytes)} bytes")
            
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        
        logger.info("Sending request to Google Cloud Vision API...")
        response = client.text_detection(image=image)
        
        if response.error.message:
            logger.error(f"Error from Vision API: {response.error.message}")
            return ""
            
        texts = response.text_annotations
        
        logger.info(f"Received {len(texts)} text annotations from Vision API")
        
        if texts:
            # Return the first text annotation which contains all detected text
            logger.info(f"First {min(50, len(texts[0].description))} chars of extracted text: {texts[0].description[:50]}...")
            return texts[0].description
        
        logger.warning("No text detected in the image")
        return ""
        
    except Exception as e:
        logger.error(f"Error in OCR processing: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return "" 