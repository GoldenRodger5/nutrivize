from ..core.config import get_database
from ..models.user import UserResponse
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId
import uuid
from collections import defaultdict


class MealPlanningService:
    """Enhanced meal planning service with storage and shopping lists"""
    
    def __init__(self):
        self.db = get_database()
        self.meal_plans_collection = None
        self.shopping_lists_collection = None
        
        if self.db is not None:
            self.meal_plans_collection = self.db["meal_plans"]
            self.shopping_lists_collection = self.db["shopping_lists"]
            
            # Create indexes for efficient queries
            try:
                self.meal_plans_collection.create_index([("user_id", 1), ("created_at", -1)])
                self.shopping_lists_collection.create_index([("user_id", 1), ("created_at", -1)])
                self.meal_plans_collection.create_index([("user_id", 1), ("plan_id", 1), ("version", -1)])
                self.shopping_lists_collection.create_index([("user_id", 1), ("meal_plan_id", 1)])
            except:
                pass  # Indexes might already exist
        else:
            print("⚠️  MealPlanningService initialized without database connection")
    
    async def save_meal_plan(self, user_id: str, meal_plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a meal plan to the database with versioning support"""
        try:
            plan_id = meal_plan_data.get("plan_id", str(uuid.uuid4()))
            
            # Check if this is a new version of an existing plan
            existing_plan = self.meal_plans_collection.find_one({
                "user_id": user_id,
                "plan_id": plan_id
            })
            
            # Determine version number
            if existing_plan:
                # Get the highest version number for this plan
                max_version = self.meal_plans_collection.find({
                    "user_id": user_id,
                    "plan_id": plan_id
                }).sort("version", -1).limit(1)
                
                current_max = list(max_version)
                version = (current_max[0].get("version", 1) + 1) if current_max else 2
            else:
                version = 1
            
            meal_plan = {
                "user_id": user_id,
                "plan_id": plan_id,
                "version": version,
                "name": meal_plan_data.get("name", meal_plan_data.get("title", f"Meal Plan - {datetime.now().strftime('%Y-%m-%d')}")),
                "title": meal_plan_data.get("title", meal_plan_data.get("name", f"Meal Plan - {datetime.now().strftime('%Y-%m-%d')}")),  # Preserve user title
                "description": meal_plan_data.get("description", ""),
                "days": meal_plan_data.get("days", []),
                "total_days": meal_plan_data.get("total_days", len(meal_plan_data.get("days", []))),
                "dietary_restrictions": meal_plan_data.get("dietary_restrictions", []),
                "target_nutrition": meal_plan_data.get("target_nutrition", {}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": meal_plan_data.get("is_active", False),
                "is_current_version": True,  # Mark this as the current version
                "parent_version": existing_plan.get("version") if existing_plan else None,
                "tags": meal_plan_data.get("tags", [])
            }
            
            # If this is a new version, mark all previous versions as not current
            if existing_plan:
                self.meal_plans_collection.update_many(
                    {"user_id": user_id, "plan_id": plan_id},
                    {"$set": {"is_current_version": False}}
                )
            
            result = self.meal_plans_collection.insert_one(meal_plan)
            meal_plan["_id"] = str(result.inserted_id)
            
            return meal_plan
            
        except Exception as e:
            raise ValueError(f"Failed to save meal plan: {str(e)}")
    
    async def get_user_meal_plans(self, user_id: str, limit: int = 10, skip: int = 0, include_versions: bool = False) -> List[Dict[str, Any]]:
        """Get user's saved meal plans (current versions only by default)"""
        try:
            query = {"user_id": user_id}
            if not include_versions:
                query["is_current_version"] = True
                
            cursor = self.meal_plans_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            
            meal_plans = []
            for plan in cursor:
                plan["id"] = str(plan["_id"])
                del plan["_id"]
                meal_plans.append(plan)
            
            return meal_plans
            
        except Exception as e:
            raise ValueError(f"Failed to get meal plans: {str(e)}")

    async def get_meal_plan_versions(self, user_id: str, plan_id: str) -> List[Dict[str, Any]]:
        """Get all versions of a specific meal plan"""
        try:
            cursor = self.meal_plans_collection.find({
                "user_id": user_id,
                "plan_id": plan_id
            }).sort("version", -1)
            
            versions = []
            for plan in cursor:
                plan["id"] = str(plan["_id"])
                del plan["_id"]
                versions.append(plan)
            
            return versions
            
        except Exception as e:
            raise ValueError(f"Failed to get meal plan versions: {str(e)}")
    
    async def get_meal_plan_by_id(self, user_id: str, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific meal plan by ID"""
        try:
            plan = self.meal_plans_collection.find_one({
                "user_id": user_id,
                "plan_id": plan_id
            })
            
            if plan:
                plan["id"] = str(plan["_id"])
                del plan["_id"]
            
            return plan
            
        except Exception as e:
            return None
    
    async def update_meal_plan(self, user_id: str, plan_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a meal plan"""
        try:
            updates["updated_at"] = datetime.utcnow()
            
            result = self.meal_plans_collection.update_one(
                {"user_id": user_id, "plan_id": plan_id},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                return await self.get_meal_plan_by_id(user_id, plan_id)
            
            return None
            
        except Exception as e:
            return None
    
    async def delete_meal_plan(self, user_id: str, plan_id: str) -> bool:
        """Delete a meal plan"""
        try:
            result = self.meal_plans_collection.delete_one({
                "user_id": user_id,
                "plan_id": plan_id
            })
            
            # Also delete associated shopping lists
            self.shopping_lists_collection.delete_many({
                "user_id": user_id,
                "meal_plan_id": plan_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            return False
    
    async def generate_shopping_list(self, user_id: str, plan_id: str) -> Dict[str, Any]:
        """Generate shopping list with AI-powered pricing for a meal plan"""
        try:
            meal_plan = await self.get_meal_plan_by_id(user_id, plan_id)
            if not meal_plan:
                raise ValueError("Meal plan not found")
            
            # Aggregate ingredients across all days and meals
            ingredient_totals = defaultdict(lambda: {"amount": 0, "unit": "", "meals": []})
            
            for day in meal_plan.get("days", []):
                for meal in day.get("meals", []):
                    meal_name = meal.get("food_name", "Unknown meal")
                    
                    # Extract ingredients if available
                    ingredients = meal.get("ingredients", [])
                    if not ingredients:
                        # If no detailed ingredients, add the meal as a single item
                        ingredients = [{
                            "name": meal_name,
                            "amount": 1,
                            "unit": "serving"
                        }]
                    
                    for ingredient in ingredients:
                        name = ingredient.get("name", "")
                        amount = float(ingredient.get("amount", 1))
                        unit = ingredient.get("unit", "")
                        
                        ingredient_totals[name]["amount"] += amount
                        ingredient_totals[name]["unit"] = unit
                        ingredient_totals[name]["meals"].append(meal_name)
            
            # Prepare ingredients for AI pricing
            ingredients_for_ai = []
            for name, details in ingredient_totals.items():
                ingredients_for_ai.append({
                    "name": name,
                    "amount": details["amount"],
                    "unit": details["unit"]
                })
            
            # Get AI-powered pricing
            pricing_data = await self._get_ai_ingredient_pricing(ingredients_for_ai)
            
            # Build shopping list with AI pricing and nutrition data
            shopping_items = []
            for ai_ingredient in pricing_data.get("ingredients", []):
                ingredient_name = ai_ingredient["name"]
                meals_used = ingredient_totals.get(ingredient_name, {}).get("meals", [])
                
                # Try to find nutrition data for this ingredient
                food_id = None
                nutrition_data = None
                
                try:
                    from .food_service import food_service
                    
                    # Search for the food item by name
                    search_results = await food_service.search_foods(ingredient_name, limit=1)
                    
                    if search_results and len(search_results) > 0:
                        food_item = search_results[0]
                        food_id = food_item.get("id")
                        
                        # Get nutrition data for the specific amount and unit
                        nutrition_response = await food_service.get_food_nutrition(
                            food_id, 
                            ai_ingredient["amount_needed"], 
                            ai_ingredient["unit_needed"]
                        )
                        nutrition_data = nutrition_response.get("nutrition")
                        
                except Exception as e:
                    print(f"Could not fetch nutrition for {ingredient_name}: {e}")
                
                item = {
                    "item_id": str(uuid.uuid4()),  # Add unique ID for each item
                    "name": ai_ingredient["name"].title(),
                    "amount": ai_ingredient["amount_needed"],
                    "unit": ai_ingredient["unit_needed"],
                    "estimated_price": ai_ingredient["estimated_cost"],
                    "store_package_size": ai_ingredient["store_package_size"],
                    "store_package_price": ai_ingredient["store_package_price"],
                    "used_in_meals": list(set(meals_used)),
                    "category": ai_ingredient["category"],
                    "is_checked": False,  # Default to unchecked
                    "food_id": food_id,
                    "nutrition": nutrition_data,
                    "in_food_index": food_id is not None
                }
                
                shopping_items.append(item)
            
            # Sort by category for better organization
            shopping_items.sort(key=lambda x: (x["category"], x["name"]))
            
            # Calculate total cost from individual items
            total_cost = sum(item["estimated_price"] for item in shopping_items)
            
            # Save shopping list
            shopping_list = {
                "user_id": user_id,
                "meal_plan_id": plan_id,
                "shopping_list_id": str(uuid.uuid4()),
                "items": shopping_items,
                "total_estimated_cost": round(total_cost, 2),
                "generated_at": datetime.utcnow(),
                "store_location": "New England Average (AI Estimated)",
                "notes": pricing_data.get("pricing_notes", "AI-powered price estimates based on New England grocery store averages. Actual prices may vary by store, season, and brand.")
            }
            
            # Save to database
            result = self.shopping_lists_collection.insert_one(shopping_list)
            shopping_list["id"] = str(result.inserted_id)
            del shopping_list["_id"]
            
            return shopping_list
            
        except Exception as e:
            raise ValueError(f"Failed to generate shopping list: {str(e)}")

    def _clean_ai_json(self, json_text: str) -> str:
        """Simple JSON cleaning - just extract the JSON part"""
        # Remove markdown formatting
        json_text = json_text.replace('```json', '').replace('```', '').strip()
        
        # Find the JSON object
        start_idx = json_text.find('{')
        end_idx = json_text.rfind('}')
        
        if start_idx >= 0 and end_idx > start_idx:
            return json_text[start_idx:end_idx + 1]
        
        return json_text

    async def _get_ai_ingredient_pricing(self, ingredients_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Use AI to estimate pricing for ingredients based on New England averages"""
        try:
            import anthropic
            import os
            
            # Check if API key is available
            if not os.getenv("ANTHROPIC_API_KEY"):
                print("No Anthropic API key found, using fallback pricing")
                return self._fallback_pricing(ingredients_list)
            
            client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            
            # Prepare ingredient list for AI (limit to first 20 to avoid huge responses)
            limited_ingredients = ingredients_list[:20]
            ingredients_str = ""
            for ingredient in limited_ingredients:
                ingredients_str += f"- {ingredient['name']}: {ingredient['amount']} {ingredient['unit']}\n"
            
            prompt = f"""You are a grocery pricing expert for New England stores. Estimate costs for these ingredients:

{ingredients_str}

Return ONLY valid JSON:
{{
  "ingredients": [
    {{
      "name": "ingredient_name",
      "amount_needed": 1.0,
      "unit_needed": "unit",
      "estimated_cost": 2.99,
      "store_package_size": "package description",
      "store_package_price": 3.99,
      "category": "produce"
    }}
  ],
  "total_estimated_cost": 15.99
}}"""

            response = client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse the JSON response
            import json
            import re
            
            response_text = response.content[0].text
            print(f"AI pricing response: {response_text[:500]}...")
            
            # Simple JSON extraction
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                
                try:
                    pricing_data = json.loads(json_text)
                    print(f"✅ AI pricing successful: ${pricing_data.get('total_estimated_cost', 0):.2f}")
                    return pricing_data
                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {e}")
                    print(f"Trying fallback pricing...")
                    return self._fallback_pricing(ingredients_list)
            else:
                print("No JSON found in AI response, using fallback")
                return self._fallback_pricing(ingredients_list)
                
        except Exception as e:
            print(f"AI pricing failed: {e}")
            return self._fallback_pricing(ingredients_list)
    
    async def _get_simple_ai_pricing(self, ingredients_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Simple AI pricing with fewer ingredients and simpler format"""
        try:
            import anthropic
            import os
            
            client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            
            # Create a simpler prompt with fewer items
            items_str = ", ".join([f"{item['name']} ({item['amount']} {item['unit']})" for item in ingredients_list])
            
            prompt = f"""Estimate grocery costs for these items in New England: {items_str}

Return only JSON:
{{"total_estimated_cost": 25.99, "pricing_notes": "Estimated based on typical grocery store prices"}}"""

            response = client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = response.content[0].text
            cleaned_json = self._clean_ai_json(response_text)
            
            import json
            simple_data = json.loads(cleaned_json)
            
            # Convert simple response to full format
            total_cost = simple_data.get("total_estimated_cost", 0)
            per_item_cost = total_cost / len(ingredients_list) if ingredients_list else 0
            
            full_response = {
                "ingredients": [
                    {
                        "name": item["name"],
                        "amount_needed": item["amount"],
                        "unit_needed": item["unit"],
                        "estimated_cost": round(per_item_cost, 2),
                        "store_package_size": "Standard package",
                        "store_package_price": round(per_item_cost * 1.5, 2),
                        "category": "grocery"
                    }
                    for item in ingredients_list
                ],
                "total_estimated_cost": total_cost,
                "pricing_notes": simple_data.get("pricing_notes", "Simplified pricing estimate")
            }
            
            return full_response
            
        except Exception as e:
            print(f"Simple AI pricing failed: {e}")
            return None
    
    def _fallback_pricing(self, ingredients_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback pricing when AI fails - provides realistic estimates"""
        total_cost = 0
        ingredients_pricing = []
        
        # Better pricing estimates based on common grocery items
        price_mapping = {
            # Proteins
            'chicken': 6.99, 'beef': 9.99, 'salmon': 12.99, 'tuna': 8.99, 'tofu': 3.99,
            'eggs': 3.49, 'cheese': 5.99, 'greek yogurt': 4.49, 'milk': 3.99,
            # Vegetables
            'broccoli': 2.99, 'spinach': 3.49, 'carrots': 2.49, 'onions': 1.99,
            'bell peppers': 4.99, 'tomatoes': 3.99, 'cucumber': 2.49, 'lettuce': 2.99,
            # Fruits
            'apples': 3.99, 'bananas': 1.99, 'berries': 4.99, 'oranges': 3.49,
            # Grains/Pantry
            'rice': 2.99, 'quinoa': 5.99, 'bread': 2.99, 'pasta': 1.99, 'oats': 3.99,
            'olive oil': 6.99, 'coconut oil': 8.99, 'nuts': 7.99, 'seeds': 5.99,
            # Spices/Condiments
            'salt': 1.99, 'pepper': 3.99, 'garlic': 2.49, 'ginger': 4.99,
            'herbs': 2.99, 'spices': 3.99, 'vinegar': 2.99, 'sauce': 3.49
        }
        
        for ingredient in ingredients_list:
            name = ingredient['name'].lower()
            
            # Find best price match
            estimated_cost = 3.99  # Default price
            for keyword, price in price_mapping.items():
                if keyword in name:
                    estimated_cost = price
                    break
            
            # Adjust for amount (rough estimation)
            amount = ingredient.get('amount', 100)
            if amount < 50:  # Small amount
                estimated_cost *= 0.3
            elif amount < 200:  # Medium amount  
                estimated_cost *= 0.6
            # Large amounts use full package price
            
            estimated_cost = round(estimated_cost, 2)
            total_cost += estimated_cost
            
            ingredients_pricing.append({
                "name": ingredient['name'],
                "amount_needed": ingredient['amount'],
                "unit_needed": ingredient['unit'],
                "estimated_cost": estimated_cost,
                "store_package_size": "Standard package",
                "store_package_price": round(estimated_cost * 1.2, 2),
                "category": self._categorize_ingredient_type(ingredient['name'])
            })
        
        return {
            "ingredients": ingredients_pricing,
            "total_estimated_cost": round(total_cost, 2),
            "pricing_notes": "Pricing estimated using typical New England grocery store averages. Actual prices may vary by store and season."
        }
    
    def _categorize_ingredient_type(self, name: str) -> str:
        """Categorize ingredient for better organization"""
        name_lower = name.lower()
        
        if any(word in name_lower for word in ['meat', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna']):
            return "meat"
        elif any(word in name_lower for word in ['milk', 'cheese', 'yogurt', 'butter', 'cream']):
            return "dairy"
        elif any(word in name_lower for word in ['apple', 'banana', 'berry', 'orange', 'grape', 'fruit']):
            return "produce"
        elif any(word in name_lower for word in ['carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'pepper', 'vegetable']):
            return "produce"
        elif any(word in name_lower for word in ['rice', 'bread', 'pasta', 'quinoa', 'oats', 'flour']):
            return "grains"
        elif any(word in name_lower for word in ['oil', 'vinegar', 'sauce', 'dressing', 'condiment']):
            return "condiments"
        elif any(word in name_lower for word in ['herbs', 'spice', 'salt', 'pepper', 'garlic', 'ginger']):
            return "spices"
        else:
            return "pantry"
    
    def _categorize_ingredient(self, ingredient_name: str) -> str:
        """Categorize ingredients for shopping list organization"""
        categories = {
            "Proteins": ["chicken", "beef", "fish", "salmon", "eggs", "tofu", "yogurt", "cottage cheese"],
            "Vegetables": ["broccoli", "spinach", "carrots", "peppers", "onions", "tomatoes", 
                          "cucumber", "mushrooms", "avocado"],
            "Fruits": ["banana", "apple", "berries", "orange", "lemon"],
            "Grains & Carbs": ["rice", "quinoa", "oats", "bread", "pasta", "potato"],
            "Dairy": ["milk", "cheese", "butter"],
            "Pantry": ["oil", "honey", "nuts", "seeds", "beans", "lentils", "garlic", "ginger", 
                      "herbs", "spices"]
        }
        
        for category, ingredients in categories.items():
            if any(ing in ingredient_name for ing in ingredients):
                return category
        
        return "Other"
    
    async def get_shopping_lists(self, user_id: str, meal_plan_id: str = None) -> List[Dict[str, Any]]:
        """Get shopping lists for user"""
        try:
            query = {"user_id": user_id}
            if meal_plan_id:
                query["meal_plan_id"] = meal_plan_id
            
            cursor = self.shopping_lists_collection.find(query).sort("generated_at", -1)
            
            shopping_lists = []
            for list_doc in cursor:
                list_doc["id"] = str(list_doc["_id"])
                del list_doc["_id"]
                shopping_lists.append(list_doc)
            
            return shopping_lists
            
        except Exception as e:
            raise ValueError(f"Failed to get shopping lists: {str(e)}")
    
    async def get_cached_shopping_list(self, user_id: str, plan_id: str, max_age_hours: int = 24) -> Optional[Dict[str, Any]]:
        """Get cached shopping list if it exists and is not too old"""
        try:
            # Calculate cutoff time for cache expiration
            cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
            
            # Find the most recent shopping list for this meal plan
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "meal_plan_id": plan_id,
                "generated_at": {"$gte": cutoff_time}
            }, sort=[("generated_at", -1)])
            
            if shopping_list:
                shopping_list["id"] = str(shopping_list["_id"])
                del shopping_list["_id"]
                return shopping_list
            
            return None
            
        except Exception as e:
            print(f"Error retrieving cached shopping list: {e}")
            return None
    
    async def get_all_user_shopping_lists(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all shopping lists for a user"""
        try:
            cursor = self.shopping_lists_collection.find({
                "user_id": user_id
            }).sort("generated_at", -1).limit(limit)
            
            shopping_lists = []
            for shopping_list in cursor:
                shopping_list["id"] = str(shopping_list["_id"])
                del shopping_list["_id"]
                shopping_lists.append(shopping_list)
            
            return shopping_lists
            
        except Exception as e:
            print(f"Error retrieving shopping lists: {e}")
            return []
    
    async def delete_shopping_list(self, user_id: str, shopping_list_id: str) -> bool:
        """Delete a specific shopping list"""
        try:
            result = self.shopping_lists_collection.delete_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting shopping list: {e}")
            return False

    async def generate_shopping_list(self, user_id: str, plan_id: str, force_regenerate: bool = False) -> Dict[str, Any]:
        """Generate shopping list with AI-powered pricing for a meal plan"""
        try:
            # Check for cached shopping list first (unless forced to regenerate)
            if not force_regenerate:
                cached_list = await self.get_cached_shopping_list(user_id, plan_id, max_age_hours=24)
                if cached_list:
                    print(f"✅ Using cached shopping list from {cached_list['generated_at']}")
                    return cached_list
            
            print("🔄 Generating new shopping list...")
            meal_plan = await self.get_meal_plan_by_id(user_id, plan_id)
            if not meal_plan:
                raise ValueError("Meal plan not found")
            
            # Check if a recent cached shopping list exists
            cached_list = await self.get_cached_shopping_list(user_id, plan_id)
            if cached_list and not force_regenerate:
                print("Using cached shopping list")
                return cached_list
            
            # Aggregate ingredients across all days and meals
            ingredient_totals = defaultdict(lambda: {"amount": 0, "unit": "", "meals": []})
            
            for day in meal_plan.get("days", []):
                for meal in day.get("meals", []):
                    meal_name = meal.get("food_name", "Unknown meal")
                    
                    # Extract ingredients if available
                    ingredients = meal.get("ingredients", [])
                    if not ingredients:
                        # If no detailed ingredients, add the meal as a single item
                        ingredients = [{
                            "name": meal_name,
                            "amount": 1,
                            "unit": "serving"
                        }]
                    
                    for ingredient in ingredients:
                        name = ingredient.get("name", "")
                        amount = float(ingredient.get("amount", 1))
                        unit = ingredient.get("unit", "")
                        
                        ingredient_totals[name]["amount"] += amount
                        ingredient_totals[name]["unit"] = unit
                        ingredient_totals[name]["meals"].append(meal_name)
            
            # Prepare ingredients for AI pricing
            ingredients_for_ai = []
            for name, details in ingredient_totals.items():
                ingredients_for_ai.append({
                    "name": name,
                    "amount": details["amount"],
                    "unit": details["unit"]
                })
            
            # Get AI-powered pricing
            pricing_data = await self._get_ai_ingredient_pricing(ingredients_for_ai)
            
            # Build shopping list with AI pricing
            shopping_items = []
            for index, ai_ingredient in enumerate(pricing_data.get("ingredients", [])):
                ingredient_name = ai_ingredient["name"]
                meals_used = ingredient_totals.get(ingredient_name, {}).get("meals", [])
                
                item = {
                    "item_id": str(uuid.uuid4()),  # Add unique item ID
                    "name": ai_ingredient["name"].title(),
                    "amount": ai_ingredient["amount_needed"],
                    "unit": ai_ingredient["unit_needed"],
                    "estimated_price": ai_ingredient["estimated_cost"],
                    "store_package_size": ai_ingredient["store_package_size"],
                    "store_package_price": ai_ingredient["store_package_price"],
                    "used_in_meals": list(set(meals_used)),
                    "category": ai_ingredient["category"],
                    "is_checked": False,  # Add checkbox functionality
                    "food_id": None  # For linking to nutrition data
                }
                
                shopping_items.append(item)
            
            # Sort by category for better organization
            shopping_items.sort(key=lambda x: (x["category"], x["name"]))
            
            # Calculate total cost from individual items
            total_cost = sum(item["estimated_price"] for item in shopping_items)
            
            # Save shopping list
            shopping_list = {
                "user_id": user_id,
                "meal_plan_id": plan_id,
                "shopping_list_id": str(uuid.uuid4()),
                "items": shopping_items,
                "total_estimated_cost": round(total_cost, 2),
                "generated_at": datetime.utcnow(),
                "store_location": "New England Average (AI Estimated)",
                "notes": pricing_data.get("pricing_notes", "AI-powered price estimates based on New England grocery store averages. Actual prices may vary by store, season, and brand.")
            }
            
            # Save to database
            result = self.shopping_lists_collection.insert_one(shopping_list)
            shopping_list["id"] = str(result.inserted_id)
            del shopping_list["_id"]
            
            return shopping_list
            
        except Exception as e:
            raise ValueError(f"Failed to generate shopping list: {str(e)}")
    
    async def update_shopping_list(self, user_id: str, shopping_list_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a complete shopping list"""
        try:
            # Find the shopping list
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if not shopping_list:
                return None
            
            # Prepare update data
            update_fields = {}
            if "items" in update_data:
                # Add item IDs if not present and update is_checked status
                for item in update_data["items"]:
                    if "item_id" not in item:
                        item["item_id"] = str(uuid.uuid4())
                    # Set default values for missing fields
                    if "is_checked" not in item:
                        item["is_checked"] = False
                    if "estimated_price" not in item or item["estimated_price"] is None:
                        item["estimated_price"] = 0.0
                    # Ensure other optional fields have defaults
                    if "store_package_size" not in item:
                        item["store_package_size"] = None
                    if "store_package_price" not in item or item["store_package_price"] is None:
                        item["store_package_price"] = 0.0
                    if "category" not in item:
                        item["category"] = "other"
                    if "used_in_meals" not in item:
                        item["used_in_meals"] = []
                    if "food_id" not in item:
                        item["food_id"] = None
                update_fields["items"] = update_data["items"]
                
                # Recalculate total cost with safe float conversion
                total_cost = 0.0
                for item in update_data["items"]:
                    price = item.get("estimated_price", 0.0)
                    if price is not None:
                        total_cost += float(price)
                update_fields["total_estimated_cost"] = round(total_cost, 2)
            
            if "notes" in update_data:
                update_fields["notes"] = update_data["notes"]
            
            update_fields["updated_at"] = datetime.utcnow()
            
            # Update the shopping list
            result = self.shopping_lists_collection.update_one(
                {"user_id": user_id, "shopping_list_id": shopping_list_id},
                {"$set": update_fields}
            )
            
            if result.modified_count == 0:
                return None
            
            # Return updated shopping list
            updated_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if updated_list:
                updated_list["id"] = str(updated_list["_id"])
                del updated_list["_id"]
            
            return updated_list
            
        except Exception as e:
            raise ValueError(f"Failed to update shopping list: {str(e)}")

    async def update_shopping_list_item(self, user_id: str, shopping_list_id: str, item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a specific item in a shopping list"""
        try:
            # Find the shopping list
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if not shopping_list:
                return None
            
            # Find and update the specific item
            items = shopping_list.get("items", [])
            item_found = False
            
            for item in items:
                if item.get("item_id") == item_id:
                    # Update the item fields
                    if "is_checked" in update_data:
                        item["is_checked"] = update_data["is_checked"]
                    if "amount" in update_data:
                        item["amount"] = update_data["amount"]
                    if "notes" in update_data:
                        item["notes"] = update_data["notes"]
                    
                    item["updated_at"] = datetime.utcnow().isoformat()
                    item_found = True
                    break
            
            if not item_found:
                return None
            
            # Update the shopping list in database
            result = self.shopping_lists_collection.update_one(
                {"user_id": user_id, "shopping_list_id": shopping_list_id},
                {"$set": {"items": items, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count == 0:
                return None
            
            # Return the updated item
            for item in items:
                if item.get("item_id") == item_id:
                    return item
                    
            return None
            
        except Exception as e:
            raise ValueError(f"Failed to update shopping list item: {str(e)}")

    async def get_shopping_item_nutrition(self, user_id: str, shopping_list_id: str, item_id: str) -> Optional[Dict[str, Any]]:
        """Get nutrition information for a shopping list item"""
        try:
            # Find the shopping list
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if not shopping_list:
                return None
            
            # Find the specific item
            items = shopping_list.get("items", [])
            target_item = None
            
            for item in items:
                if item.get("item_id") == item_id:
                    target_item = item
                    break
            
            if not target_item:
                return None
            
            # Try to get nutrition data from food service
            try:
                from .food_service import food_service
                
                # Search for the food item by name
                search_results = await food_service.search_foods(target_item["name"], limit=1)
                
                if search_results and len(search_results) > 0:
                    food_item = search_results[0]
                    return {
                        "item_name": target_item["name"],
                        "amount": target_item["amount"],
                        "unit": target_item["unit"],
                        "nutrition": food_item.get("nutrition", {}),
                        "food_id": food_item.get("id"),
                        "food_name": food_item.get("name"),
                        "used_in_meals": target_item.get("used_in_meals", [])
                    }
                else:
                    # Return basic info if no nutrition data found
                    return {
                        "item_name": target_item["name"],
                        "amount": target_item["amount"],
                        "unit": target_item["unit"],
                        "nutrition": None,
                        "message": "Nutrition data not available for this item",
                        "used_in_meals": target_item.get("used_in_meals", [])
                    }
                    
            except Exception as nutrition_error:
                print(f"Error fetching nutrition data: {nutrition_error}")
                return {
                    "item_name": target_item["name"],
                    "amount": target_item["amount"],
                    "unit": target_item["unit"],
                    "nutrition": None,
                    "error": "Could not fetch nutrition data",
                    "used_in_meals": target_item.get("used_in_meals", [])
                }
            
        except Exception as e:
            raise ValueError(f"Failed to get nutrition data: {str(e)}")


# Global meal planning service instance
meal_planning_service = MealPlanningService()
