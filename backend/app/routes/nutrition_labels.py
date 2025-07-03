from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
import logging
from .auth import get_current_user
from ..models.user import UserResponse
from ..models.food import FoodItem
from ..services.ocr_service import OCRService
from ..services.enhanced_nutrition_parser import enhanced_nutrition_parser
from ..services.food_service import FoodService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/scan")
async def scan_nutrition_label(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Scan a nutrition label image and extract nutrition information
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Perform OCR
        ocr_service = OCRService()
        ocr_text = ocr_service.extract_text_from_image(image_data)
        
        if not ocr_text:
            raise HTTPException(status_code=400, detail="No text found in image")
        
        # Parse nutrition information using AI
        nutrition_info = await enhanced_nutrition_parser.parse_nutrition_text_with_ai(ocr_text)
        
        if not nutrition_info:
            raise HTTPException(status_code=400, detail="No nutrition information found in text")
        
        return {
            "success": True,
            "ocr_text": ocr_text,
            "nutrition_info": nutrition_info
        }
        
    except Exception as e:
        logger.error(f"Error scanning nutrition label: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scan nutrition label: {str(e)}")

@router.post("/scan-and-create")
async def scan_and_create_food(
    file: UploadFile = File(...),
    food_name: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Scan a nutrition label and create a food item from it
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Perform OCR
        ocr_service = OCRService()
        ocr_text = ocr_service.extract_text_from_image(image_data)
        
        if not ocr_text:
            raise HTTPException(status_code=400, detail="No text found in image")
        
        # Parse nutrition information using AI
        nutrition_info = await enhanced_nutrition_parser.parse_nutrition_text_with_ai(ocr_text)
        
        if not nutrition_info:
            raise HTTPException(status_code=400, detail="No nutrition information found in text")
        
        # Create food item
        food_service = FoodService()
        
        # Use provided name or try to extract from OCR text
        if not food_name:
            food_name = nutrition_info.get("name", "Scanned Food Item")
        
        # Create food data using the proper structure
        from ..models.food import FoodItemCreate, NutritionInfo
        
        nutrition_data = NutritionInfo(
            calories=nutrition_info.get("calories", 0),
            protein=nutrition_info.get("protein", 0),
            carbs=nutrition_info.get("carbs", 0),
            fat=nutrition_info.get("fat", 0),
            fiber=nutrition_info.get("fiber", 0),
            sugar=nutrition_info.get("sugar", 0),
            sodium=nutrition_info.get("sodium", 0)
        )
        
        food_create_data = FoodItemCreate(
            name=food_name,
            serving_size=1.0,  # Default serving size
            serving_unit=nutrition_info.get("serving_unit", "serving"),
            nutrition=nutrition_data
        )
        
        # Create the food item
        created_food = await food_service.create_food_item(food_create_data, current_user.uid)
        
        return {
            "success": True,
            "food": created_food,
            "ocr_text": ocr_text,
            "nutrition_info": nutrition_info
        }
        
    except Exception as e:
        logger.error(f"Error scanning and creating food: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scan and create food: {str(e)}")
