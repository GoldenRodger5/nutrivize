import re
import logging
import json
from typing import Dict, Any, Optional
from .ai_service import AIService
from .nutrition_parser import NutritionTextParser

logger = logging.getLogger(__name__)

class EnhancedNutritionParser:
    """Enhanced service for parsing nutrition text using AI"""
    
    def __init__(self):
        self.fallback_parser = NutritionTextParser()
        self.ai_service = AIService()
    
    async def parse_nutrition_text_with_ai(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse raw OCR text using AI for better accuracy
        
        Args:
            raw_text: The raw text extracted from nutrition label
            
        Returns:
            Dictionary containing structured nutrition information
        """
        try:
            logger.info(f"Parsing nutrition text with AI: {len(raw_text)} characters")
            
            # Use AI to parse the nutrition information
            ai_result = await self._parse_with_ai(raw_text)
            
            if ai_result:
                logger.info("Successfully parsed nutrition data with AI")
                return self._validate_and_clean_ai_result(ai_result)
            else:
                logger.warning("AI parsing failed, falling back to regex parser")
                return self.fallback_parser.parse_nutrition_text(raw_text)
                
        except Exception as e:
            logger.error(f"Error in AI parsing: {e}, falling back to regex parser")
            return self.fallback_parser.parse_nutrition_text(raw_text)
    
    async def _parse_with_ai(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """Use AI to extract nutrition information from OCR text"""
        try:
            prompt = f"""
            You are an expert at reading nutrition labels. Extract nutrition information from the following OCR text from a nutrition label and return it as a JSON object.
            
            OCR Text:
            {raw_text}
            
            Please carefully analyze the text and extract the following information. Return it as a valid JSON object:
            
            {{
                "name": "product name from the label (look at the top of the label, brand names, product titles)",
                "brand": "brand name if identifiable (e.g., 'Great Value', 'Kellogg's', 'Organic Valley'), or null if not found",
                "serving_size": "serving size as text (e.g., '1 cup', '2 tbsp', '100g')",
                "serving_unit": "just the unit part (e.g., 'cup', 'tbsp', 'g', 'serving')",
                "calories": numeric_value_or_0,
                "protein": numeric_value_or_0,
                "carbs": numeric_value_or_0,
                "fat": numeric_value_or_0,
                "fiber": numeric_value_or_0,
                "sugar": numeric_value_or_0,
                "sodium": numeric_value_or_0,
                "saturated_fat": numeric_value_or_0,
                "trans_fat": numeric_value_or_0,
                "cholesterol": numeric_value_or_0
            }}
            
            CRITICAL INSTRUCTIONS:
            - For "name": Look for product names, brand names, or food descriptions at the top of the label. Examples: "Great Value Whole Wheat Bread", "Organic Chicken Breast", "Cheerios Cereal"
            - For "brand": Look for brand names separately from product names. Common patterns:
              * Brand names often appear at the very top or in larger fonts
              * Look for "Brand:", "By:", "Manufactured by:", "Distributed by:" indicators
              * Common brand patterns: all caps text, company names with "Foods", "Corp", "Inc"
              * Examples: "KELLOGG'S", "Great Value", "Organic Valley", "Dannon"
              * If brand is part of product name, separate them (e.g., "Kellogg's Cheerios" → brand: "Kellogg's", name: "Cheerios")
            - Extract ALL numeric values as pure numbers (no units like 'g', 'mg' in the JSON values)
            - If a value is not found or unclear, use 0
            - For serving_size: Include the full text like "1 cup (240ml)" or "2 tablespoons (30g)"
            - For serving_unit: Extract just the main unit like "cup", "tablespoons", "g", "oz"
            - Common nutrition label patterns:
              * "Total Carbohydrate" → carbs field
              * "Total Fat" → fat field  
              * "Dietary Fiber" → fiber field
              * "Total Sugars" or "Sugars" → sugar field
              * Sodium is usually in mg
              * Protein might be labeled as "Protein"
            - Return ONLY the JSON object, no additional text or explanation
            
            Analyze this nutrition label text carefully and extract the data:
            """
            
            result = await self.ai_service.generate_response(prompt)
            
            if result and result.strip():
                logger.info(f"AI response: {result[:200]}...")  # Debug log
                # Try to extract JSON from the response
                json_str = self._extract_json_from_response(result)
                if json_str:
                    logger.info(f"Extracted JSON: {json_str[:200]}...")  # Debug log
                    return json.loads(json_str)
            
            return None
            
        except Exception as e:
            logger.error(f"Error in AI nutrition parsing: {e}")
            return None
    
    def _extract_json_from_response(self, response: str) -> Optional[str]:
        """Extract JSON object from AI response"""
        try:
            # Look for JSON object in the response
            start = response.find('{')
            if start == -1:
                return None
                
            # Find the matching closing brace
            brace_count = 0
            end = start
            for i in range(start, len(response)):
                if response[i] == '{':
                    brace_count += 1
                elif response[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end = i + 1
                        break
            
            if end > start:
                return response[start:end]
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting JSON: {e}")
            return None
    
    def _validate_and_clean_ai_result(self, ai_result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean the AI parsing result"""
        try:
            # Ensure all required fields exist with proper types
            cleaned_result = {
                "name": str(ai_result.get("name", "Scanned Food Item")).strip(),
                "serving_size": str(ai_result.get("serving_size", "1 serving")),
                "serving_unit": str(ai_result.get("serving_unit", "serving")),
                "calories": float(ai_result.get("calories", 0)),
                "protein": float(ai_result.get("protein", 0)),
                "carbs": float(ai_result.get("carbs", 0)),
                "fat": float(ai_result.get("fat", 0)),
                "fiber": float(ai_result.get("fiber", 0)),
                "sugar": float(ai_result.get("sugar", 0)),
                "sodium": float(ai_result.get("sodium", 0)),
                "saturated_fat": float(ai_result.get("saturated_fat", 0)),
                "trans_fat": float(ai_result.get("trans_fat", 0)),
                "cholesterol": float(ai_result.get("cholesterol", 0))
            }
            
            # If name is empty or just whitespace, use default
            if not cleaned_result["name"] or cleaned_result["name"].isspace():
                cleaned_result["name"] = "Scanned Food Item"
            
            logger.info(f"AI extracted: {cleaned_result['name']}, {cleaned_result['calories']} cal, {cleaned_result['protein']}g protein")
            return cleaned_result
            
        except Exception as e:
            logger.error(f"Error validating AI result: {e}")
            # Return default structure if validation fails
            return {
                "name": "Scanned Food Item",
                "serving_size": "1 serving",
                "serving_unit": "serving",
                "calories": 0.0,
                "protein": 0.0,
                "carbs": 0.0,
                "fat": 0.0,
                "fiber": 0.0,
                "sugar": 0.0,
                "sodium": 0.0,
                "saturated_fat": 0.0,
                "trans_fat": 0.0,
                "cholesterol": 0.0
            }

# Import the fallback parser
from .nutrition_parser import NutritionTextParser

# Create singleton instance
enhanced_nutrition_parser = EnhancedNutritionParser()
