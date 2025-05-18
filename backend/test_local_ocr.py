#!/usr/bin/env python

import os
import sys
from google.cloud import vision
import io

# Set the credentials file path
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "../food-tracker-6096d-4007a1f2a2ab.json"

def test_vision_api(image_path):
    """Test Google Cloud Vision API directly."""
    print(f"Testing OCR on image: {image_path}")
    print(f"Using credentials: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}")
    
    # Check if credentials file exists
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not os.path.exists(creds_path):
        print(f"ERROR: Credentials file does not exist at: {creds_path}")
        return
    
    try:
        # Read the image file
        with open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        print(f"Read {len(content)} bytes from image file")
        
        # Create Vision client
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        
        # Perform text detection
        print("Sending request to Google Cloud Vision API...")
        response = client.text_detection(image=image)
        
        # Check for errors
        if response.error.message:
            print(f"Error from Vision API: {response.error.message}")
            return
        
        # Process the response
        texts = response.text_annotations
        print(f"Received {len(texts) if texts else 0} text annotations")
        
        if texts:
            # Print the first text annotation (full text)
            print("\nExtracted text:")
            print("------------------------------")
            print(texts[0].description)
            print("------------------------------")
        else:
            print("No text detected in the image")
    
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = "../NutritionLabel-Tortilla.png"
    
    test_vision_api(image_path) 