"""
Restaurant AI Service - Menu analysis and meal recommendations
"""

import logging
import uuid
import base64
import re
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import requests
from io import BytesIO
import PyPDF2
from PIL import Image
import openai

# Import AI service for menu analysis and OCR service for image text extraction
from .ai_service import AIService
from .ocr_service import ocr_service
from ..core.config import get_database

logger = logging.getLogger(__name__)

# Pydantic models for menu analysis
class MenuAnalysisRequest(BaseModel):
    source_type: str  # 'url', 'image', 'pdf', 'multi_image', 'multi_pdf'
    source_data: List[str]  # List of URLs or base64 encoded data for multiple files
    restaurant_name: Optional[str] = None
    menu_name: Optional[str] = None

class EstimatedNutrition(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    sugar: Optional[float] = None
    confidence_score: float  # 0-100

class MenuRecommendation(BaseModel):
    id: str
    name: str
    description: str
    category: str  # 'appetizer', 'main_course', 'side', 'dessert', 'beverage', 'other'
    estimated_nutrition: EstimatedNutrition
    dietary_attributes: Dict[str, List[str]]
    price: Optional[str] = None
    recommendations_score: float  # 0-100 based on user filters
    reasoning: str  # AI explanation for recommendation
    modifications_suggested: Optional[List[str]] = None

class MenuAnalysisResult(BaseModel):
    id: str
    restaurant_name: str
    menu_name: str
    source_type: str
    recommendations: List[MenuRecommendation]
    total_items_found: int
    analysis_confidence: float
    created_at: str
    user_id: str

class VisualNutritionRequest(BaseModel):
    item_id: str
    image_data: str  # base64 encoded image
    menu_analysis_id: str

class VisualNutritionResult(BaseModel):
    item_id: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    confidence_score: float  # 0-100
    portion_notes: str  # AI explanation of portion size estimation
    reference_objects: List[str]  # Objects used for scale reference

class RestaurantAIService:
    """Service for restaurant menu analysis and meal recommendations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db["restaurant_ai_analyses"] if self.db is not None else None
        self.ai_service = AIService()
        
        # Create indexes
        if self.collection is not None:
            try:
                self.collection.create_index([("user_id", 1), ("created_at", -1)])
                self.collection.create_index([("id", 1)])
            except Exception as e:
                logger.warning(f"Failed to create indexes: {e}")
    
    async def analyze_menu(self, request: MenuAnalysisRequest, user_id: str) -> MenuAnalysisResult:
        """Analyze a restaurant menu and provide recommendations"""
        try:
            # Extract menu text based on source type
            menu_text = await self._extract_menu_text(request)
            
            if not menu_text or len(menu_text.strip()) < 50:
                raise ValueError("Could not extract sufficient menu content. Please check your source and try again.")
            
            # Use AI to analyze menu and generate recommendations
            analysis_result = await self._analyze_menu_with_ai(menu_text, request)
            
            # Create result object
            result = MenuAnalysisResult(
                id=str(uuid.uuid4()),
                restaurant_name=request.restaurant_name or analysis_result.get('restaurant_name', 'Unknown Restaurant'),
                menu_name=request.menu_name or analysis_result.get('menu_name', 'Menu'),
                source_type=request.source_type,
                recommendations=analysis_result['recommendations'],
                total_items_found=len(analysis_result['recommendations']),
                analysis_confidence=analysis_result.get('confidence_score', 85),
                created_at=datetime.utcnow().isoformat(),
                user_id=user_id
            )
            
            # Save to database
            if self.collection is not None:
                await self._save_analysis(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing menu: {e}")
            raise Exception(f"Failed to analyze menu: {str(e)}")
    
    async def get_user_analyses(self, user_id: str, limit: int = 20) -> List[MenuAnalysisResult]:
        """Get user's previous menu analyses"""
        try:
            if self.collection is None:
                return []
            
            analyses = list(self.collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit))
            
            return [
                MenuAnalysisResult(**analysis) for analysis in analyses
            ]
            
        except Exception as e:
            logger.error(f"Error getting user analyses: {e}")
            return []
    
    async def get_analysis_by_id(self, analysis_id: str, user_id: str) -> Optional[MenuAnalysisResult]:
        """Get a specific analysis by ID"""
        try:
            if self.collection is None:
                return None
            
            analysis = self.collection.find_one({
                "id": analysis_id,
                "user_id": user_id
            })
            
            if analysis:
                return MenuAnalysisResult(**analysis)
            return None
            
        except Exception as e:
            logger.error(f"Error getting analysis: {e}")
            return None
    
    async def _extract_menu_text(self, request: MenuAnalysisRequest) -> str:
        """Extract text from different menu sources, including multiple files"""
        try:
            if request.source_type in ['url']:
                # Handle URLs (single URL)
                return await self._extract_from_url(request.source_data[0])
            elif request.source_type in ['image', 'multi_image']:
                # Handle single or multiple images
                all_text = ""
                for i, image_data in enumerate(request.source_data):
                    text = await self._extract_from_image(image_data)
                    all_text += f"\n--- PAGE {i+1} ---\n{text}"
                return all_text
            elif request.source_type in ['pdf', 'multi_pdf']:
                # Handle single or multiple PDFs
                all_text = ""
                for i, pdf_data in enumerate(request.source_data):
                    text = await self._extract_from_pdf(pdf_data)
                    all_text += f"\n--- DOCUMENT {i+1} ---\n{text}"
                return all_text
            else:
                raise ValueError(f"Unsupported source type: {request.source_type}")
                
        except Exception as e:
            logger.error(f"Error extracting menu text: {e}")
            raise Exception(f"Failed to extract menu content: {str(e)}")
    
    async def _extract_from_url(self, url: str) -> str:
        """Extract menu text from website URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=120)
            response.raise_for_status()
            
            # Basic HTML content extraction
            html_content = response.text
            
            # Remove script and style elements
            html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
            html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
            
            # Extract text content
            text_content = re.sub(r'<[^>]+>', ' ', html_content)
            text_content = re.sub(r'\s+', ' ', text_content)
            
            # Focus on likely menu content
            menu_keywords = ['menu', 'appetizer', 'entree', 'main', 'dessert', 'price', '$']
            menu_sections = []
            
            sentences = text_content.split('.')
            for sentence in sentences:
                if any(keyword.lower() in sentence.lower() for keyword in menu_keywords):
                    menu_sections.append(sentence.strip())
            
            if menu_sections:
                return '. '.join(menu_sections)
            
            # Fallback to first 3000 characters
            return text_content[:3000]
            
        except Exception as e:
            logger.error(f"Error extracting from URL: {e}")
            raise Exception(f"Failed to extract content from URL: {str(e)}")
    
    async def _extract_from_image(self, base64_data: str) -> str:
        """Extract text from image using Google Cloud Vision OCR"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 image
            image_data = base64.b64decode(base64_data)
            
            # Use Google Cloud Vision OCR service
            logger.info("Using Google Cloud Vision OCR for menu text extraction")
            text = ocr_service.extract_text_from_image(image_data)
            
            if not text or len(text.strip()) < 20:
                raise ValueError("Could not extract sufficient text from image. Please ensure the image is clear and contains menu text.")
            
            logger.info(f"Successfully extracted {len(text)} characters from menu image")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting from image: {e}")
            raise Exception(f"Failed to extract text from image: {str(e)}")
    
    async def _extract_from_pdf(self, base64_data: str) -> str:
        """Extract text from PDF"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 PDF
            pdf_data = base64.b64decode(base64_data)
            pdf_file = BytesIO(pdf_data)
            
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            if not text or len(text.strip()) < 20:
                raise ValueError("Could not extract text from PDF. Please ensure the PDF contains readable text.")
            
            return text
            
        except Exception as e:
            logger.error(f"Error extracting from PDF: {e}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    async def _analyze_menu_with_ai(self, menu_text: str, request: MenuAnalysisRequest) -> Dict[str, Any]:
        """Use AI to analyze menu text and generate recommendations with increased token limits"""
        try:
            # Increase content window significantly for large menus
            content_limit = 12000  # Increased from 4000 to handle multiple pages
            
            prompt = f"""Analyze the following comprehensive restaurant menu text and provide a detailed analysis with meal recommendations.

MENU TEXT (May contain multiple pages/documents):
{menu_text[:content_limit]}

Please provide your analysis in the following JSON format:

{{
  "restaurant_name": "Restaurant name if mentioned, otherwise use provided name",
  "menu_name": "Menu name if mentioned (e.g., 'Dinner Menu', 'Lunch Specials')",
  "confidence_score": 85,
  "recommendations": [
    {{
      "id": "unique_id",
      "name": "Dish name",
      "description": "Detailed description of the dish",
      "category": "appetizer|main_course|side|dessert|beverage|other",
      "estimated_nutrition": {{
        "calories": 450,
        "protein": 25,
        "carbs": 35,
        "fat": 20,
        "fiber": 8,
        "sodium": 650,
        "sugar": 5,
        "confidence_score": 75
      }},
      "dietary_attributes": {{
        "dietary_restrictions": ["vegetarian", "gluten-free", "high-protein"],
        "allergens": ["dairy", "nuts"],
        "food_categories": ["protein", "vegetables"]
      }},
      "price": "$12.99",
      "recommendations_score": 85,
      "reasoning": "This dish is recommended because it provides high protein content with moderate calories, includes vegetables, and can be made gluten-free upon request.",
      "modifications_suggested": [
        "Ask for dressing on the side to reduce calories",
        "Request extra vegetables for more fiber"
      ]
    }}
  ]
}}

ANALYSIS GUIDELINES:

1. NUTRITION ESTIMATION:
   - Estimate calories, protein, carbs, fat, fiber, sodium, and sugar per serving
   - Base estimates on typical restaurant portions and ingredients
   - Set confidence_score (0-100) based on how certain you are about the nutrition
   - Consider cooking methods (fried = higher calories/fat, grilled = lower)

2. CATEGORIZATION:
   - appetizer: Starters, apps, small plates
   - main_course: Entrees, main dishes, large meals
   - side: Side dishes, accompaniments
   - dessert: Sweets, desserts
   - beverage: Drinks, cocktails, etc.
   - other: Items that don't fit other categories

3. DIETARY ATTRIBUTES:
   - dietary_restrictions: vegetarian, vegan, pescatarian, gluten-free, dairy-free, keto, paleo, low-carb, high-protein, etc.
   - allergens: nuts, peanuts, dairy, eggs, soy, shellfish, fish, wheat, sesame
   - food_categories: meat, seafood, vegetable, fruit, grain, dairy, etc.

4. RECOMMENDATION SCORING (0-100):
   - 90-100: Exceptional choice (healthy, balanced, great ingredients)
   - 80-89: Very good choice (mostly healthy with minor concerns)
   - 70-79: Good choice (balanced but may have some less healthy aspects)
   - 60-69: Okay choice (some health concerns but not terrible)
   - 50-59: Poor choice (high calories, sodium, or unhealthy preparation)
   - Below 50: Very poor choice (avoid for health reasons)

5. MODIFICATIONS:
   - Suggest realistic modifications that restaurants can typically accommodate
   - Focus on health improvements (reduce calories, increase nutrition)
   - Consider common substitutions and preparation changes

6. PRICING:
   - Extract exact prices if mentioned in the menu
   - If no price, leave as null

IMPORTANT: This menu may contain multiple pages or documents. Analyze ALL items found across all sections comprehensively. Pay attention to section headers like "PAGE 1", "PAGE 2", "DOCUMENT 1", etc.

Please analyze all identifiable menu items and provide detailed, accurate recommendations.
Return ONLY the JSON object, no additional text."""

            # Use enhanced AI service with higher token limit
            response = await self.ai_service.generate_response(
                prompt, 
                max_tokens=12000,  # Increased for comprehensive menu analysis
                model="claude-sonnet-4-20250514"  # Use Claude-4 Sonnet for best analysis quality
            )
            
            # Clean and parse the JSON response
            try:
                # Extract JSON from response if wrapped in text
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    json_str = response
                
                analysis_data = json.loads(json_str)
                
                # Validate and enhance the analysis
                analysis_data = self._validate_and_enhance_analysis(analysis_data, request)
                
                return analysis_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response JSON: {e}")
                # Return fallback analysis
                return self._create_fallback_analysis(menu_text, request)
                
        except Exception as e:
            logger.error(f"Error in AI menu analysis: {e}")
            return self._create_fallback_analysis(menu_text, request)
    
    def _validate_and_enhance_analysis(self, analysis_data: Dict[str, Any], request: MenuAnalysisRequest) -> Dict[str, Any]:
        """Validate and enhance the AI analysis results"""
        try:
            # Use provided names if AI didn't find them
            if not analysis_data.get('restaurant_name') and request.restaurant_name:
                analysis_data['restaurant_name'] = request.restaurant_name
            
            if not analysis_data.get('menu_name') and request.menu_name:
                analysis_data['menu_name'] = request.menu_name
            
            # Ensure all recommendations have required fields
            valid_recommendations = []
            for i, rec in enumerate(analysis_data.get('recommendations', [])):
                try:
                    # Add ID if missing
                    if not rec.get('id'):
                        rec['id'] = f"item_{i+1}_{uuid.uuid4().hex[:8]}"
                    
                    # Validate nutrition
                    nutrition = rec.get('estimated_nutrition', {})
                    if not isinstance(nutrition, dict):
                        nutrition = {}
                    
                    # Ensure all nutrition fields exist
                    nutrition.setdefault('calories', 400)
                    nutrition.setdefault('protein', 15)
                    nutrition.setdefault('carbs', 30)
                    nutrition.setdefault('fat', 18)
                    nutrition.setdefault('confidence_score', 70)
                    
                    rec['estimated_nutrition'] = nutrition
                    
                    # Validate dietary attributes
                    dietary_attrs = rec.get('dietary_attributes', {})
                    if not isinstance(dietary_attrs, dict):
                        dietary_attrs = {}
                    
                    dietary_attrs.setdefault('dietary_restrictions', [])
                    dietary_attrs.setdefault('allergens', [])
                    dietary_attrs.setdefault('food_categories', [])
                    
                    rec['dietary_attributes'] = dietary_attrs
                    
                    # Set defaults for missing fields
                    rec.setdefault('name', f'Menu Item {i+1}')
                    rec.setdefault('description', 'Restaurant menu item')
                    rec.setdefault('category', 'other')
                    rec.setdefault('recommendations_score', 75)
                    rec.setdefault('reasoning', 'Standard restaurant menu item')
                    
                    valid_recommendations.append(rec)
                    
                except Exception as e:
                    logger.warning(f"Skipping invalid recommendation {i}: {e}")
                    continue
            
            analysis_data['recommendations'] = valid_recommendations
            analysis_data.setdefault('confidence_score', 80)
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Error validating analysis: {e}")
            return analysis_data
    
    def _create_fallback_analysis(self, menu_text: str, request: MenuAnalysisRequest) -> Dict[str, Any]:
        """Create a basic fallback analysis when AI fails"""
        try:
            # Simple text-based item extraction
            lines = menu_text.split('\n')
            items = []
            
            for i, line in enumerate(lines[:20]):  # Limit to first 20 lines
                line = line.strip()
                if len(line) > 10 and len(line) < 100:  # Reasonable item length
                    # Try to detect prices
                    price_match = re.search(r'\$[\d.,]+', line)
                    price = price_match.group() if price_match else None
                    
                    # Remove price from name
                    name = re.sub(r'\s*\$[\d.,]+\s*', '', line).strip()
                    
                    if name:
                        items.append({
                            'id': f"fallback_{i}_{uuid.uuid4().hex[:8]}",
                            'name': name,
                            'description': 'Menu item - nutritional information estimated',
                            'category': 'other',
                            'estimated_nutrition': {
                                'calories': 450,
                                'protein': 20,
                                'carbs': 35,
                                'fat': 22,
                                'confidence_score': 50
                            },
                            'dietary_attributes': {
                                'dietary_restrictions': [],
                                'allergens': [],
                                'food_categories': []
                            },
                            'price': price,
                            'recommendations_score': 70,
                            'reasoning': 'Basic menu item - consider asking restaurant about ingredients and preparation methods'
                        })
            
            return {
                'restaurant_name': request.restaurant_name or 'Restaurant',
                'menu_name': request.menu_name or 'Menu',
                'confidence_score': 50,
                'recommendations': items[:10]  # Limit to 10 items
            }
            
        except Exception as e:
            logger.error(f"Error creating fallback analysis: {e}")
            return {
                'restaurant_name': request.restaurant_name or 'Restaurant',
                'menu_name': request.menu_name or 'Menu',
                'confidence_score': 30,
                'recommendations': []
            }
    
    async def analyze_visual_nutrition(self, request: VisualNutritionRequest, user_id: str) -> VisualNutritionResult:
        """Analyze meal image for more accurate portion-based nutrition estimation using GPT-4 Vision"""
        try:
            # Get the original menu item analysis
            analysis = await self.get_analysis_by_id(request.menu_analysis_id, user_id)
            if not analysis:
                raise ValueError("Menu analysis not found")
            
            # Find the specific menu item
            menu_item = None
            for item in analysis.recommendations:
                if item.id == request.item_id:
                    menu_item = item
                    break
            
            if not menu_item:
                raise ValueError("Menu item not found in analysis")
            
            # Initialize OpenAI client
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                raise ValueError("OpenAI API key not configured")
            
            client = openai.OpenAI(api_key=openai_api_key)
            
            # Prepare the image data for OpenAI
            image_data = request.image_data
            if ',' in image_data:
                # Remove data URL prefix if present
                image_data = image_data.split(',')[1]
            
            # Create the visual analysis prompt
            prompt = f"""Analyze this meal image for accurate portion size and nutrition estimation.

ORIGINAL MENU ITEM DETAILS:
• Name: {menu_item.name}
• Description: {menu_item.description}
• Category: {menu_item.category}
• Original Nutrition Estimates (standard restaurant portion):
  - Calories: {menu_item.estimated_nutrition.calories}
  - Protein: {menu_item.estimated_nutrition.protein}g
  - Carbs: {menu_item.estimated_nutrition.carbs}g
  - Fat: {menu_item.estimated_nutrition.fat}g

VISUAL ANALYSIS INSTRUCTIONS:

1. PORTION SIZE ASSESSMENT:
   - Compare this actual portion to typical restaurant servings
   - Look for reference objects (utensils, plate, hands, coins) for scale
   - Estimate if portion is larger/smaller than standard (give percentage)

2. INGREDIENT IDENTIFICATION:
   - Identify all visible food components
   - Estimate the quantity/weight of each component
   - Note any cooking methods visible (grilled, fried, etc.)
   - Look for added fats, sauces, or oils

3. NUTRITIONAL ADJUSTMENT:
   - Adjust calories, protein, carbs, and fat based on actual portion
   - Consider cooking methods that affect nutrition
   - Account for any visible modifications

4. CONFIDENCE ASSESSMENT:
   - Rate your confidence (60-95%) based on image quality and detail
   - Consider lighting, angle, and visibility of food components

Provide your analysis in this exact JSON format:
{{
  "calories": 380,
  "protein": 22,
  "carbs": 28,
  "fat": 15,
  "fiber": 5,
  "sodium": 620,
  "confidence_score": 82,
  "portion_notes": "Portion appears to be about 80% of typical restaurant serving. Grilled chicken breast estimated at 3.5oz, vegetables appear generous (~1 cup), rice portion is smaller than usual (~0.4 cup). Minimal visible oil or sauce.",
  "reference_objects": ["fork", "dinner plate"],
  "portion_size_factor": 0.8,
  "adjustments_made": [
    "Reduced overall portion by 20% based on visual comparison",
    "Increased vegetable content due to generous serving",
    "Reduced fat content due to minimal visible oil/sauce"
  ]
}}

IMPORTANT: 
- Be precise with nutritional estimates
- Use reference objects for accurate scaling
- Set confidence based on image clarity (60-95%)
- Provide helpful portion analysis in portion_notes
- Return ONLY the JSON object, no other text"""

            try:
                # Call GPT-4 Vision API
                response = client.chat.completions.create(
                    model="gpt-4o",  # Latest GPT-4 Vision model
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}",
                                        "detail": "high"  # High detail for accurate analysis
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1000,
                    temperature=0.1  # Low temperature for consistent analysis
                )
                
                vision_response = response.choices[0].message.content
                logger.info(f"GPT-4 Vision response received: {len(vision_response)} characters")
                
            except Exception as e:
                logger.error(f"GPT-4 Vision API error: {e}")
                # Fallback to text-based AI analysis
                logger.info("Falling back to text-based AI analysis")
                vision_response = await self.ai_service.generate_response(prompt)
            
            try:
                # Parse JSON response
                json_match = re.search(r'\{.*\}', vision_response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    json_str = vision_response
                
                visual_data = json.loads(json_str)
                
                # Create result with validation
                result = VisualNutritionResult(
                    item_id=request.item_id,
                    calories=max(50, float(visual_data.get('calories', menu_item.estimated_nutrition.calories))),
                    protein=max(0, float(visual_data.get('protein', menu_item.estimated_nutrition.protein))),
                    carbs=max(0, float(visual_data.get('carbs', menu_item.estimated_nutrition.carbs))),
                    fat=max(0, float(visual_data.get('fat', menu_item.estimated_nutrition.fat))),
                    fiber=visual_data.get('fiber'),
                    sodium=visual_data.get('sodium'),
                    confidence_score=min(95, max(60, float(visual_data.get('confidence_score', 75)))),
                    portion_notes=visual_data.get('portion_notes', 'Visual portion analysis completed with GPT-4 Vision'),
                    reference_objects=visual_data.get('reference_objects', [])
                )
                
                logger.info(f"Visual nutrition analysis completed for item {request.item_id}: {result.calories} cal, {result.confidence_score}% confidence")
                
                # Save/cache the visual nutrition analysis
                await self._save_visual_nutrition(result, user_id, request.menu_analysis_id)
                
                return result
                
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                logger.error(f"Failed to parse visual nutrition response: {e}")
                logger.debug(f"Raw response: {vision_response}")
                
                # Return conservative estimate based on original
                return VisualNutritionResult(
                    item_id=request.item_id,
                    calories=menu_item.estimated_nutrition.calories * 0.85,  # Slightly conservative
                    protein=menu_item.estimated_nutrition.protein * 0.85,
                    carbs=menu_item.estimated_nutrition.carbs * 0.85,
                    fat=menu_item.estimated_nutrition.fat * 0.85,
                    confidence_score=65,
                    portion_notes="Visual analysis had parsing issues, using conservative estimate based on typical portions",
                    reference_objects=[]
                )
                
        except Exception as e:
            logger.error(f"Error in visual nutrition analysis: {e}")
            raise Exception(f"Failed to analyze meal image: {str(e)}")
    
    async def _save_analysis(self, result: MenuAnalysisResult):
        """Save analysis result to database"""
        try:
            if self.collection is not None:
                self.collection.insert_one(result.dict())
                logger.info(f"Saved menu analysis {result.id} for user {result.user_id}")
        except Exception as e:
            logger.error(f"Error saving analysis: {e}")

    async def _save_visual_nutrition(self, result: VisualNutritionResult, user_id: str, menu_analysis_id: str):
        """Save visual nutrition analysis to database for caching"""
        try:
            if self.db is not None:
                visual_collection = self.db["visual_nutrition_analyses"]
                
                # Create visual nutrition document
                visual_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "menu_analysis_id": menu_analysis_id,
                    "item_id": result.item_id,
                    "visual_nutrition": result.dict(),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Upsert (update if exists, insert if not) based on user, menu analysis, and item
                visual_collection.replace_one(
                    {
                        "user_id": user_id,
                        "menu_analysis_id": menu_analysis_id,
                        "item_id": result.item_id
                    },
                    visual_doc,
                    upsert=True
                )
                
                logger.info(f"Saved visual nutrition analysis for item {result.item_id}")
        except Exception as e:
            logger.error(f"Error saving visual nutrition analysis: {e}")

    async def get_cached_visual_nutrition(self, user_id: str, menu_analysis_id: str, item_id: str) -> Optional[VisualNutritionResult]:
        """Get cached visual nutrition analysis"""
        try:
            if self.db is not None:
                visual_collection = self.db["visual_nutrition_analyses"]
                
                doc = visual_collection.find_one({
                    "user_id": user_id,
                    "menu_analysis_id": menu_analysis_id,
                    "item_id": item_id
                })
                
                if doc and doc.get("visual_nutrition"):
                    return VisualNutritionResult(**doc["visual_nutrition"])
                    
            return None
        except Exception as e:
            logger.error(f"Error getting cached visual nutrition: {e}")
            return None

# Create singleton instance
restaurant_ai_service = RestaurantAIService()
