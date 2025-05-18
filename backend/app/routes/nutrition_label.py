from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
import traceback
import os
from datetime import datetime, timezone
from bson import ObjectId

# Import both the real and mock services
from app.services.ocr_service import extract_text_from_image
from app.services.mock_ocr_service import extract_text_from_image_mock
from app.services.ai_service import parse_nutrition_text
from app.services.mock_ai_service import parse_nutrition_text_mock
from app.auth import get_current_user
from app.models import add_food_item, log_food

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a router for nutrition label endpoints
router = APIRouter(
    prefix="/nutrition-label",
    tags=["nutrition-label"],
    responses={404: {"description": "Not found"}}
)

@router.post("/upload")
async def upload_nutrition_label(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a nutrition label image, extract text using OCR, and then process the text
    to extract structured nutrition information
    
    Args:
        file: The uploaded image file
        current_user: The authenticated user
        
    Returns:
        A JSON response with raw text and extracted nutrition information
    """
    try:
        logger.info(f"Received image upload request from user: {current_user['uid']}")
        logger.info(f"File name: {file.filename}, Content type: {file.content_type}")
        
        # Validate the file type
        allowed_mime_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_mime_types:
            logger.warning(f"Unsupported file type: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Please upload an image in one of the following formats: {', '.join(allowed_mime_types)}"
            )
        
        # Read the file
        logger.info("Reading file contents...")
        contents = await file.read()
        logger.info(f"Read {len(contents)} bytes of image data")
        
        # Use the mock OCR service instead of the real one due to credential issues
        logger.info("Using mock OCR service instead of Google Cloud Vision API")
        raw_text = extract_text_from_image_mock(contents)  # Use mock instead of real OCR
        
        if not raw_text:
            logger.warning("No text extracted from the image")
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "No text could be extracted from the image. Please try a clearer image."
                }
            )
        
        logger.info(f"Text extracted successfully, length: {len(raw_text)}")
        logger.info(f"First 100 characters of extracted text: {raw_text[:100]}...")
        
        # Process the text to extract nutrition information using mock AI service
        logger.info("Using mock AI service to process the text")
        nutrition_info = parse_nutrition_text_mock(raw_text)  # Use mock instead of real AI service
        
        logger.info(f"Nutrition info extraction complete, found {len(nutrition_info)} fields")
        return {
            "raw_text": raw_text,
            "nutrition_info": nutrition_info
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        logger.warning(f"HTTP exception: {he.detail}")
        raise he
        
    except Exception as e:
        logger.error(f"Error processing nutrition label: {str(e)}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing nutrition label: {str(e)}"
        )

@router.post("/upload-and-log")
async def upload_nutrition_label_and_log(
    file: UploadFile = File(...),
    meal_type: str = Form(...),
    amount: float = Form(1.0),
    notes: str = Form(None),
    date: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a nutrition label image, process it, add the food item to the index,
    and create a food log entry - all in one operation.
    
    Args:
        file: The uploaded image file
        meal_type: Type of meal (breakfast, lunch, dinner, snack)
        amount: Amount of food consumed (default: 1.0)
        notes: Optional notes about the food or consumption
        date: Date of consumption (ISO format, default: current date)
        current_user: The authenticated user
        
    Returns:
        A JSON response with the created food item and log entry IDs
    """
    try:
        logger.info(f"Received upload-and-log request from user: {current_user['uid']}")
        logger.info(f"File: {file.filename}, Meal type: {meal_type}")
        
        # Validate the file type
        allowed_mime_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_mime_types:
            logger.warning(f"Unsupported file type: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Please upload an image in one of the following formats: {', '.join(allowed_mime_types)}"
            )
        
        # Read the file
        contents = await file.read()
        
        # Use mock OCR service
        raw_text = extract_text_from_image_mock(contents)
        
        if not raw_text:
            logger.warning("No text extracted from the image")
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "No text could be extracted from the image. Please try a clearer image."
                }
            )
        
        # Process the text to extract nutrition information using mock AI service
        nutrition_info = parse_nutrition_text_mock(raw_text)
        
        # Prepare food item data for storage
        food_data = {
            "name": nutrition_info.get("name", "Scanned Food Item"),
            "serving_size": nutrition_info.get("serving_size", 100),
            "serving_unit": nutrition_info.get("serving_unit", "g"),
            "calories": nutrition_info.get("calories", 0),
            "proteins": nutrition_info.get("proteins", 0),
            "carbs": nutrition_info.get("carbs", 0),
            "fats": nutrition_info.get("fats", 0),
            "fiber": nutrition_info.get("fiber", 0),
            "source": "scan",
            "created_by": current_user["uid"]
        }
        
        # Add food item to database
        logger.info(f"Adding new food item to index: {food_data['name']}")
        food_id = add_food_item(food_data)
        
        # Prepare log entry data
        if date:
            try:
                log_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except ValueError:
                log_date = datetime.now(timezone.utc)
        else:
            log_date = datetime.now(timezone.utc)
            
        log_data = {
            "date": log_date,
            "meal_type": meal_type,
            "food_id": str(food_id),
            "name": food_data["name"],
            "amount": amount,
            "unit": food_data["serving_unit"],
            "calories": food_data["calories"] * amount,
            "proteins": food_data["proteins"] * amount,
            "carbs": food_data["carbs"] * amount,
            "fats": food_data["fats"] * amount,
            "fiber": food_data["fiber"] * amount,
            "notes": notes,
            "user_id": current_user["uid"]
        }
        
        # Add log entry to database
        logger.info(f"Adding food log entry for: {log_data['name']}")
        log_id = log_food(log_data)
        
        return {
            "success": True,
            "food_item": {
                "id": str(food_id),
                **food_data
            },
            "log_entry": {
                "id": str(log_id),
                **log_data,
                "date": log_data["date"].isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error in upload-and-log process: {str(e)}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing nutrition label and creating log: {str(e)}"
        )

@router.post("/test-upload")
async def test_upload_nutrition_label(
    file: UploadFile = File(...)
):
    """
    Test endpoint for uploading a nutrition label without authentication requirement
    """
    try:
        logger.info(f"Received test image upload request")
        logger.info(f"File name: {file.filename}, Content type: {file.content_type}")
        
        # Validate the file type
        allowed_mime_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_mime_types:
            logger.warning(f"Unsupported file type: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Please upload an image in one of the following formats: {', '.join(allowed_mime_types)}"
            )
        
        # Read the file
        logger.info("Reading file contents...")
        contents = await file.read()
        logger.info(f"Read {len(contents)} bytes of image data")
        
        # Use the mock OCR service
        logger.info("Using mock OCR service")
        raw_text = extract_text_from_image_mock(contents)
        
        if not raw_text:
            logger.warning("No text extracted from the image")
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "No text could be extracted from the image. Please try a clearer image."
                }
            )
        
        logger.info(f"Text extracted successfully, length: {len(raw_text)}")
        logger.info(f"First 100 characters of extracted text: {raw_text[:100]}...")
        
        # Process the text to extract nutrition information using mock AI service
        logger.info("Using mock AI service to process the text")
        nutrition_info = parse_nutrition_text_mock(raw_text)
        
        logger.info(f"Nutrition info extraction complete, found {len(nutrition_info)} fields")
        return {
            "raw_text": raw_text,
            "nutrition_info": nutrition_info
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        logger.warning(f"HTTP exception: {he.detail}")
        raise he
        
    except Exception as e:
        logger.error(f"Error processing nutrition label: {str(e)}")
        logger.error(traceback.format_exc())
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing nutrition label: {str(e)}"
        ) 