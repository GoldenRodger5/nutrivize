"""
Restaurant AI API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import logging
import base64
import os
import tempfile
from PyPDF2 import PdfReader
from PIL import Image
import io

from ..services.restaurant_ai_service import (
    restaurant_ai_service,
    MenuAnalysisRequest,
    MenuAnalysisResult,
    VisualNutritionRequest,
    VisualNutritionResult
)
from ..routes.auth import get_current_user
from ..models.user import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/restaurant-ai", tags=["restaurant-ai"])

@router.post("/analyze", response_model=MenuAnalysisResult)
async def analyze_menu(
    request: MenuAnalysisRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze a restaurant menu and get AI-powered recommendations"""
    try:
        result = await restaurant_ai_service.analyze_menu(request, current_user.uid)
        return result
    except Exception as e:
        logger.error(f"Error analyzing menu for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analyses", response_model=List[MenuAnalysisResult])
async def get_user_analyses(
    limit: Optional[int] = 20,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's previous menu analyses"""
    try:
        analyses = await restaurant_ai_service.get_user_analyses(current_user.uid, limit)
        return analyses
    except Exception as e:
        logger.error(f"Error getting analyses for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analyses")

@router.get("/analyses/{analysis_id}", response_model=MenuAnalysisResult)
async def get_analysis(
    analysis_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific menu analysis by ID"""
    try:
        analysis = await restaurant_ai_service.get_analysis_by_id(analysis_id, current_user.uid)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id} for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analysis")

@router.post("/visual-nutrition", response_model=VisualNutritionResult)
async def analyze_visual_nutrition(
    request: VisualNutritionRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze meal image for accurate portion-based nutrition estimation"""
    try:
        result = await restaurant_ai_service.analyze_visual_nutrition(request, current_user.uid)
        return result
    except Exception as e:
        logger.error(f"Error analyzing visual nutrition for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/visual-nutrition/{menu_analysis_id}/{item_id}", response_model=VisualNutritionResult)
async def get_cached_visual_nutrition(
    menu_analysis_id: str,
    item_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get cached visual nutrition analysis for a menu item"""
    try:
        result = await restaurant_ai_service.get_cached_visual_nutrition(
            current_user.uid, menu_analysis_id, item_id
        )
        if not result:
            raise HTTPException(status_code=404, detail="Visual nutrition analysis not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cached visual nutrition for user {current_user.uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get visual nutrition analysis")

@router.post("/analyze-upload", response_model=MenuAnalysisResult)
async def analyze_menu_upload(
    files: List[UploadFile] = File(...),
    restaurant_name: Optional[str] = Form(None),
    menu_name: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze restaurant menu from uploaded images or PDF files"""
    try:
        processed_files = []
        
        for file in files:
            # Check file type
            if file.content_type not in ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file.content_type}. Please upload images (JPEG, PNG, WebP) or PDF files."
                )
            
            # Read file content
            content = await file.read()
            
            if file.content_type == 'application/pdf':
                # Handle PDF
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                        tmp_file.write(content)
                        tmp_file.flush()
                        
                        # Extract text from PDF
                        pdf_reader = PdfReader(tmp_file.name)
                        text_content = ""
                        for page in pdf_reader.pages:
                            text_content += page.extract_text()
                        
                        processed_files.append({
                            'type': 'pdf',
                            'content': text_content,
                            'filename': file.filename
                        })
                        
                    # Clean up temp file
                    os.unlink(tmp_file.name)
                    
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
            else:
                # Handle image
                try:
                    # Validate image
                    image = Image.open(io.BytesIO(content))
                    
                    # Convert to base64
                    base64_content = base64.b64encode(content).decode('utf-8')
                    
                    processed_files.append({
                        'type': 'image',
                        'content': base64_content,
                        'filename': file.filename
                    })
                    
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
        
        # Create analysis request
        source_data = []
        source_type = 'multi_image' if all(f['type'] == 'image' for f in processed_files) else 'multi_pdf' if all(f['type'] == 'pdf' for f in processed_files) else 'mixed'
        
        for file_data in processed_files:
            if file_data['type'] == 'image':
                source_data.append(f"data:image/jpeg;base64,{file_data['content']}")
            else:
                source_data.append(file_data['content'])
        
        request = MenuAnalysisRequest(
            source_type=source_type,
            source_data=source_data,
            restaurant_name=restaurant_name,
            menu_name=menu_name
        )
        
        # Analyze the menu
        result = await restaurant_ai_service.analyze_menu(request, current_user.uid)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing uploaded menu for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze-camera", response_model=MenuAnalysisResult)
async def analyze_menu_camera(
    image_data: str = Form(...),  # Base64 encoded image from camera
    restaurant_name: Optional[str] = Form(None),
    menu_name: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """Analyze restaurant menu from camera capture"""
    try:
        # Validate base64 image data
        if not image_data.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Invalid image data format")
        
        # Create analysis request
        request = MenuAnalysisRequest(
            source_type='image',
            source_data=[image_data],
            restaurant_name=restaurant_name,
            menu_name=menu_name
        )
        
        # Analyze the menu
        result = await restaurant_ai_service.analyze_menu(request, current_user.uid)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing camera menu for user {current_user.uid}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
