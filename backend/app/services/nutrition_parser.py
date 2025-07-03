import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class NutritionTextParser:
    """Service for parsing nutrition text into structured data"""
    
    def parse_nutrition_text(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse raw OCR text from nutrition label into structured nutrition information
        
        Args:
            raw_text: The raw text extracted from nutrition label
            
        Returns:
            Dictionary containing structured nutrition information
        """
        try:
            logger.info(f"Parsing nutrition text of {len(raw_text)} characters")
            
            # Clean and normalize the text
            text = self._clean_text(raw_text)
            
            # Extract basic nutrition information
            nutrition_data = {
                "name": self._extract_product_name(text),
                "brand": self._extract_brand_name(text),
                "serving_size": self._extract_serving_size(text),
                "serving_unit": self._extract_serving_unit(text),
                "calories": self._extract_calories(text),
                "protein": self._extract_macronutrient(text, "protein"),
                "carbs": self._extract_macronutrient(text, ["total carbohydrate", "carbohydrate", "carbs"]),
                "fat": self._extract_macronutrient(text, ["total fat", "fat"]),
                "fiber": self._extract_macronutrient(text, ["dietary fiber", "fiber"]),
                "sugar": self._extract_macronutrient(text, ["sugars", "sugar"]),
                "sodium": self._extract_macronutrient(text, "sodium"),
                "saturated_fat": self._extract_macronutrient(text, ["saturated fat"]),
                "trans_fat": self._extract_macronutrient(text, ["trans fat"]),
                "cholesterol": self._extract_macronutrient(text, "cholesterol")
            }
            
            # Clean up None values and ensure proper types
            nutrition_data = self._clean_nutrition_data(nutrition_data)
            
            logger.info(f"Successfully parsed nutrition data with {len(nutrition_data)} fields")
            return nutrition_data
            
        except Exception as e:
            logger.error(f"Error parsing nutrition text: {e}")
            return self._get_default_nutrition_data()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize the raw text"""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        return text.lower()
    
    def _extract_product_name(self, text: str) -> str:
        """Extract product name from text (fallback to default)"""
        # Look for brand names or product names at the top
        lines = text.split('\n')
        for line in lines[:3]:  # Check first few lines
            line = line.strip()
            if line and 'nutrition facts' not in line and 'serving size' not in line:
                if len(line) > 3 and len(line) < 50:  # Reasonable product name length
                    return line.title()
        return "Scanned Food Item"
    
    def _extract_brand_name(self, text: str) -> Optional[str]:
        """Extract brand name from text"""
        # Look for brand patterns in the first few lines
        lines = text.split('\n')
        
        # Common brand patterns to look for
        brand_indicators = [
            r'brand[:\s]+([a-zA-Z\s&]+)',
            r'by[:\s]+([a-zA-Z\s&]+)',
            r'manufactured by[:\s]+([a-zA-Z\s&]+)',
            r'distributed by[:\s]+([a-zA-Z\s&]+)'
        ]
        
        # Check first few lines for brand indicators
        for line in lines[:5]:
            line_lower = line.lower().strip()
            for pattern in brand_indicators:
                match = re.search(pattern, line_lower)
                if match:
                    brand = match.group(1).strip().title()
                    if len(brand) > 1 and len(brand) < 30:
                        return brand
        
        # If no explicit brand indicators, check if first line could be a brand
        # (before product name but not nutrition facts)
        for i, line in enumerate(lines[:3]):
            line = line.strip()
            if line and 'nutrition facts' not in line.lower():
                # Look for common brand name patterns (all caps, known brand words)
                if line.isupper() and len(line) > 2 and len(line) < 25:
                    return line.title()
                # Check for known brand keywords
                brand_keywords = ['foods', 'company', 'corp', 'inc', 'ltd', 'organic', 'natural']
                if any(keyword in line.lower() for keyword in brand_keywords):
                    return line.title()
        
        return None
    
    def _extract_serving_size(self, text: str) -> float:
        """Extract serving size number"""
        # Look for patterns like "serving size 1 cup (240g)" or "1 container (170g)"
        patterns = [
            r'serving size[^\d]*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*(?:cup|container|piece|slice|tbsp|tsp|oz|g)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return 1.0  # Default serving size
    
    def _extract_serving_unit(self, text: str) -> str:
        """Extract serving unit"""
        # Look for common serving units
        units = ['cup', 'container', 'piece', 'slice', 'tbsp', 'tsp', 'oz', 'g', 'ml', 'serving']
        
        for unit in units:
            if re.search(rf'\\b{unit}\\b', text, re.IGNORECASE):
                return unit
        
        return "serving"  # Default unit
    
    def _extract_calories(self, text: str) -> float:
        """Extract calories value"""
        # Look for "calories XXX" pattern
        patterns = [
            r'calories\s+(\d+)',
            r'(\d+)\s+calories',
            r'calories[^\d]*(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return 0.0
    
    def _extract_macronutrient(self, text: str, nutrient_names) -> float:
        """Extract macronutrient value by name(s)"""
        if isinstance(nutrient_names, str):
            nutrient_names = [nutrient_names]
        
        for nutrient_name in nutrient_names:
            # Look for patterns like "Total Fat 8g" or "Protein 4g"
            patterns = [
                rf'{nutrient_name}\s+(\d+(?:\.\d+)?)g',
                rf'{nutrient_name}\s+(\d+(?:\.\d+)?)mg',
                rf'{nutrient_name}[^\d]*(\d+(?:\.\d+)?)g',
                rf'{nutrient_name}[^\d]*(\d+(?:\.\d+)?)mg'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        value = float(match.group(1))
                        # Convert mg to g for sodium, cholesterol
                        if 'mg' in match.group(0).lower():
                            value = value / 1000  # Convert mg to g
                        return value
                    except ValueError:
                        continue
        
        return 0.0
    
    def _clean_nutrition_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean up nutrition data and ensure proper types"""
        cleaned_data = {}
        
        for key, value in data.items():
            if value is None:
                cleaned_data[key] = 0.0 if key != "name" else "Scanned Food Item"
            elif isinstance(value, (int, float)):
                cleaned_data[key] = float(value)
            else:
                cleaned_data[key] = str(value)
        
        return cleaned_data
    
    def _get_default_nutrition_data(self) -> Dict[str, Any]:
        """Return default nutrition data when parsing fails"""
        return {
            "name": "Scanned Food Item",
            "serving_size": 1.0,
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

# Create singleton instance
nutrition_parser = NutritionTextParser()
