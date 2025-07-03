#!/usr/bin/env python3
"""
Test Google Cloud Vision OCR on the actual menu image
"""

import asyncio
import base64
from backend.app.services.restaurant_ai_service import restaurant_ai_service, MenuAnalysisRequest

async def test_menu_ocr():
    """Test OCR extraction on the actual menu image"""
    
    print("🔍 Testing Google Cloud Vision OCR on menu1.png...")
    
    try:
        # Load the menu image
        with open("nutrition_labels/resturant_menus/menu1.png", "rb") as f:
            image_data = f.read()
        
        # Convert to base64
        base64_data = base64.b64encode(image_data).decode()
        
        print(f"📁 Image size: {len(image_data)} bytes")
        print(f"📊 Base64 size: {len(base64_data)} characters")
        
        # Create a test request
        request = MenuAnalysisRequest(
            source_type="image",
            source_data=f"data:image/png;base64,{base64_data}",
            restaurant_name="Test Restaurant",
            menu_name="Test Menu"
        )
        
        # Extract text using the service
        print("🤖 Extracting text using Google Cloud Vision...")
        extracted_text = await restaurant_ai_service._extract_from_image(base64_data)
        
        print(f"✅ Successfully extracted {len(extracted_text)} characters")
        print("\n" + "="*60)
        print("EXTRACTED TEXT:")
        print("="*60)
        print(extracted_text[:1000])  # First 1000 characters
        if len(extracted_text) > 1000:
            print(f"\n... (showing first 1000 of {len(extracted_text)} total characters)")
        print("="*60)
        
        # Test if it looks like menu content
        menu_indicators = ["menu", "appetizer", "entree", "main", "dessert", "price", "$"]
        found_indicators = [word for word in menu_indicators if word.lower() in extracted_text.lower()]
        
        print(f"\n📋 Menu indicators found: {found_indicators}")
        
        if found_indicators:
            print("✅ Text appears to contain menu content!")
        else:
            print("⚠️  Text doesn't appear to contain typical menu content")
        
        return extracted_text
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(test_menu_ocr())
