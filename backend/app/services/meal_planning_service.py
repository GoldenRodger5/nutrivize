from ..core.config import get_database
from ..core.redis_client import redis_client
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
            try:
                self.meal_plans_collection = self.db["meal_plans"]
                self.shopping_lists_collection = self.db["shopping_lists"]
                
                # Create indexes for efficient queries
                try:
                    self.meal_plans_collection.create_index([("user_id", 1), ("created_at", -1)])
                    self.shopping_lists_collection.create_index([("user_id", 1), ("created_at", -1)])
                    self.meal_plans_collection.create_index([("user_id", 1), ("plan_id", 1), ("version", -1)])
                    self.shopping_lists_collection.create_index([("user_id", 1), ("meal_plan_id", 1)])
                    print("✅ MealPlanningService: Database indexes created successfully")
                except Exception as index_error:
                    print(f"⚠️  MealPlanningService: Index creation failed (may already exist): {index_error}")
                    
                print("✅ MealPlanningService: Successfully initialized with database connection")
            except Exception as collection_error:
                print(f"❌ MealPlanningService: Failed to access collections: {collection_error}")
                self.meal_plans_collection = None
                self.shopping_lists_collection = None
        else:
            print("⚠️  MealPlanningService: Initialized without database connection")
    
    async def save_meal_plan(self, user_id: str, meal_plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a meal plan to the database with versioning support"""
        try:
            print(f"DEBUG: Starting save_meal_plan for user_id: {user_id}")
            print(f"DEBUG: Meal plan data keys: {list(meal_plan_data.keys())}")
            
            # Check database connection with better error handling
            if self.meal_plans_collection is None:
                print("ERROR: No database collection available")
                
                # Try to reconnect to database
                print("🔄 Attempting to reconnect to database...")
                self.db = get_database()
                if self.db is not None:
                    try:
                        self.meal_plans_collection = self.db["meal_plans"]
                        self.shopping_lists_collection = self.db["shopping_lists"]
                        print("✅ Database reconnection successful")
                    except Exception as reconnect_error:
                        print(f"❌ Database reconnection failed: {reconnect_error}")
                        raise ValueError(f"Database connection not available: {str(reconnect_error)}")
                else:
                    raise ValueError("Database connection not available and reconnection failed")
            
            plan_id = meal_plan_data.get("plan_id", str(uuid.uuid4()))
            print(f"DEBUG: Using plan_id: {plan_id}")
            
            # Check if this is a new version of an existing plan
            existing_plan = None
            try:
                existing_plan = self.meal_plans_collection.find_one({
                    "user_id": user_id,
                    "plan_id": plan_id
                })
                print(f"DEBUG: Existing plan found: {existing_plan is not None}")
            except Exception as db_error:
                print(f"ERROR: Database query failed: {db_error}")
                # Try to handle specific MongoDB errors
                if "SSL" in str(db_error) or "TLS" in str(db_error):
                    raise ValueError(f"Database SSL/TLS connection error: {str(db_error)}")
                elif "timeout" in str(db_error).lower():
                    raise ValueError(f"Database timeout error: {str(db_error)}")
                else:
                    raise ValueError(f"Database query failed: {str(db_error)}")
            
            # Determine version number
            version = 1
            if existing_plan:
                try:
                    # Get the highest version number for this plan
                    max_version = self.meal_plans_collection.find({
                        "user_id": user_id,
                        "plan_id": plan_id
                    }).sort("version", -1).limit(1)
                    
                    current_max = list(max_version)
                    version = (current_max[0].get("version", 1) + 1) if current_max else 2
                    print(f"DEBUG: New version number: {version}")
                except Exception as version_error:
                    print(f"ERROR: Version query failed: {version_error}")
                    version = 2  # Default to version 2 if query fails
            
            # Prepare meal plan document with proper data handling
            try:
                # Use timezone-aware datetime
                from datetime import timezone
                current_time = datetime.now(timezone.utc)
                
                meal_plan = {
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "version": version,
                    "type": meal_plan_data.get("type", "ai_generated"),  # Add type field to distinguish manual vs AI plans
                    "name": meal_plan_data.get("name", meal_plan_data.get("title", f"Meal Plan - {current_time.strftime('%Y-%m-%d')}")),
                    "title": meal_plan_data.get("title", meal_plan_data.get("name", f"Meal Plan - {current_time.strftime('%Y-%m-%d')}")),  # Preserve user title
                    "description": meal_plan_data.get("description", ""),
                    "days": meal_plan_data.get("days", []),
                    "total_days": meal_plan_data.get("total_days", len(meal_plan_data.get("days", []))),
                    "dietary_restrictions": meal_plan_data.get("dietary_restrictions", []),
                    "target_nutrition": meal_plan_data.get("target_nutrition", {}),
                    "created_at": current_time,
                    "updated_at": current_time,
                    "is_active": meal_plan_data.get("is_active", False),
                    "is_current_version": True,  # Mark this as the current version
                    "parent_version": existing_plan.get("version") if existing_plan else None,
                    "tags": meal_plan_data.get("tags", []),
                    # Add additional fields from AI response
                    "variety_score": meal_plan_data.get("variety_score", ""),
                    "goal_alignment": meal_plan_data.get("goal_alignment", ""),
                    "shopping_tips": meal_plan_data.get("shopping_tips", ""),
                    # Add manual meal plan specific fields
                    "duration_days": meal_plan_data.get("duration_days", len(meal_plan_data.get("days", []))),
                    "start_date": meal_plan_data.get("start_date"),
                    "notes": meal_plan_data.get("notes", "")
                }
                print(f"DEBUG: Prepared meal plan document with {len(meal_plan)} fields")
            except Exception as prep_error:
                print(f"ERROR: Failed to prepare meal plan document: {prep_error}")
                raise ValueError(f"Failed to prepare meal plan data: {str(prep_error)}")
            
            # If this is a new version, mark all previous versions as not current
            if existing_plan:
                try:
                    update_result = self.meal_plans_collection.update_many(
                        {"user_id": user_id, "plan_id": plan_id},
                        {"$set": {"is_current_version": False}}
                    )
                    print(f"DEBUG: Updated {update_result.modified_count} previous versions")
                except Exception as update_error:
                    print(f"ERROR: Failed to update previous versions: {update_error}")
                    # Continue with insert even if update fails
            
            # Insert the new meal plan with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    result = self.meal_plans_collection.insert_one(meal_plan)
                    meal_plan["_id"] = str(result.inserted_id)
                    print(f"DEBUG: Successfully inserted meal plan with ID: {result.inserted_id}")
                    break
                except Exception as insert_error:
                    print(f"ERROR: Insert attempt {attempt + 1} failed: {insert_error}")
                    if attempt == max_retries - 1:
                        # Last attempt failed
                        if "SSL" in str(insert_error) or "TLS" in str(insert_error):
                            raise ValueError(f"Database SSL/TLS error during save: {str(insert_error)}")
                        elif "timeout" in str(insert_error).lower():
                            raise ValueError(f"Database timeout during save: {str(insert_error)}")
                        else:
                            raise ValueError(f"Failed to insert meal plan after {max_retries} attempts: {str(insert_error)}")
                    else:
                        # Wait a bit before retrying
                        import asyncio
                        await asyncio.sleep(1)
            
            # Remove non-serializable fields for response
            response_plan = meal_plan.copy()
            # Convert datetime objects to strings for JSON serialization
            if "created_at" in response_plan:
                response_plan["created_at"] = response_plan["created_at"].isoformat()
            if "updated_at" in response_plan:
                response_plan["updated_at"] = response_plan["updated_at"].isoformat()
            
            print(f"DEBUG: Successfully saved meal plan")
            return response_plan
            
        except Exception as e:
            print(f"ERROR: save_meal_plan failed: {e}")
            import traceback
            print(f"ERROR: Traceback: {traceback.format_exc()}")
            # Provide more specific error messages
            if "SSL" in str(e) or "TLS" in str(e):
                raise ValueError(f"Database connection SSL/TLS error: {str(e)}")
            elif "timeout" in str(e).lower():
                raise ValueError(f"Database operation timed out: {str(e)}")
            elif "connection" in str(e).lower():
                raise ValueError(f"Database connection error: {str(e)}")
            else:
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
                
                # Convert datetime objects to strings for JSON serialization
                if "created_at" in plan and hasattr(plan["created_at"], "isoformat"):
                    plan["created_at"] = plan["created_at"].isoformat()
                if "updated_at" in plan and hasattr(plan["updated_at"], "isoformat"):
                    plan["updated_at"] = plan["updated_at"].isoformat()
                
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
    
    def get_meal_plan_by_id(self, user_id: str, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific meal plan by ID"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"🔍 Looking for meal plan: user_id={user_id}, plan_id={plan_id}")
            
            # Use synchronous find_one (not await) since collection is sync
            plan = self.meal_plans_collection.find_one({
                "user_id": user_id,
                "plan_id": plan_id
            })
            
            if plan:
                logger.info(f"✅ Found meal plan: {plan.get('name', 'unnamed')}")
                plan["id"] = str(plan["_id"])
                del plan["_id"]
                
                # Convert datetime objects to strings for JSON serialization
                if "created_at" in plan and hasattr(plan["created_at"], "isoformat"):
                    plan["created_at"] = plan["created_at"].isoformat()
                if "updated_at" in plan and hasattr(plan["updated_at"], "isoformat"):
                    plan["updated_at"] = plan["updated_at"].isoformat()
            else:
                logger.warning(f"❌ Meal plan not found for user_id={user_id}, plan_id={plan_id}")
                
                # Check if plan exists for any user
                any_plan = self.meal_plans_collection.find_one({"plan_id": plan_id})
                if any_plan:
                    logger.warning(f"⚠️ Plan exists but for different user: {any_plan.get('user_id')}")
                else:
                    logger.warning(f"⚠️ Plan {plan_id} does not exist at all")
            
            return plan
            
        except Exception as e:
            logger.error(f"❌ Error getting meal plan: {e}")
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
    
    async def generate_shopping_list(self, user_id: str, plan_id: str, force_regenerate: bool = False) -> Dict[str, Any]:
        """Generate shopping list from meal plan food items with Redis caching"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"🛒 Starting shopping list generation for plan {plan_id}")
            
            # Check Redis cache first (unless force regenerating)
            cache_key = f"shopping_list:{plan_id}"
            if not force_regenerate and redis_client.is_connected():
                cached_list = redis_client.get_shopping_list(plan_id)
                if cached_list:
                    logger.info(f"✅ Found cached shopping list for plan {plan_id}")
                    return cached_list
            
            meal_plan = self.get_meal_plan_by_id(user_id, plan_id)
            if not meal_plan:
                raise ValueError("Meal plan not found")
            
            logger.info(f"✅ Found meal plan with {len(meal_plan.get('days', []))} days")
            logger.info(f"🔍 DEBUG: meal_plan type = {type(meal_plan)}")
            logger.info(f"🔍 DEBUG: meal_plan content = {str(meal_plan)[:200]}...")
            
            if not isinstance(meal_plan, dict):
                raise ValueError(f"Meal plan is not a dictionary, got {type(meal_plan)}")
            
            # Aggregate food items from ingredients in all meals
            food_totals = defaultdict(lambda: {"amount": 0, "unit": "", "meals": []})
            
            for day_index, day in enumerate(meal_plan.get("days", [])):
                logger.info(f"Processing day {day_index}: type={type(day)}")
                
                if not isinstance(day, dict):
                    logger.error(f"❌ Day is not a dict: {type(day)} - {day}")
                    continue
                
                day_meals = day.get("meals", [])
                logger.info(f"Day meals type: {type(day_meals)}")
                
                # Handle different meal structures
                meals_to_process = []
                
                if isinstance(day_meals, list):
                    # New structure: meals is a list of meal objects
                    meals_to_process = day_meals
                    logger.info(f"Processing {len(meals_to_process)} meals from list structure")
                elif isinstance(day_meals, dict):
                    # Old structure: meals is a dict with meal_type keys
                    logger.info(f"Processing meals from dict structure with keys: {list(day_meals.keys())}")
                    for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
                        if meal_type in day_meals and isinstance(day_meals[meal_type], list):
                            meals_to_process.extend(day_meals[meal_type])
                
                # Process each meal and extract ingredients
                for meal_index, food_item in enumerate(meals_to_process):
                    logger.info(f"Processing meal {meal_index}: type={type(food_item)}")
                    
                    if not isinstance(food_item, dict):
                        logger.error(f"❌ Food item is not a dict: {type(food_item)} - {food_item}")
                        continue
                    
                    # Extract ingredients from the meal
                    ingredients = food_item.get("ingredients", [])
                    meal_type = food_item.get("meal_type", "unknown")
                    meal_name = food_item.get("food_name", "Unknown meal")
                    
                    logger.info(f"Processing meal '{meal_name}' ({meal_type}) with {len(ingredients)} ingredients")
                    
                    for ingredient in ingredients:
                        if not isinstance(ingredient, dict):
                            continue
                            
                        try:
                            ingredient_name = ingredient.get("name", "Unknown ingredient")
                            amount = float(ingredient.get("amount", 1))
                            unit = ingredient.get("unit", "serving")
                            
                            logger.info(f"Adding ingredient: {ingredient_name} - {amount} {unit}")
                            
                            # Aggregate quantities for same ingredients
                            food_totals[ingredient_name]["amount"] += amount
                            food_totals[ingredient_name]["unit"] = unit  # Keep the last unit
                            food_totals[ingredient_name]["meals"].append(f"{meal_type.title()}")
                            
                        except Exception as ingredient_error:
                            logger.error(f"❌ Error processing ingredient: {ingredient_error}")
                            logger.error(f"Ingredient content: {ingredient}")
                            continue
            
            logger.info(f"✅ Processed {len(food_totals)} unique food items")
            
            # Prepare ingredients for pricing
            ingredients_for_pricing = []
            for food_name, details in food_totals.items():
                ingredients_for_pricing.append({
                    "name": food_name,
                    "amount": details["amount"],
                    "unit": details["unit"]
                })
            
            # Get AI pricing for ingredients
            try:
                pricing_result = await self._get_ai_ingredient_pricing(ingredients_for_pricing)
                ingredient_prices = pricing_result.get("ingredients", {})
                total_estimated_cost = pricing_result.get("total_cost", 0)
                logger.info(f"✅ Got AI pricing for {len(ingredient_prices)} ingredients")
            except Exception as pricing_error:
                logger.warning(f"⚠️ AI pricing failed, using fallback: {pricing_error}")
                pricing_result = self._fallback_pricing(ingredients_for_pricing)
                ingredient_prices = pricing_result.get("ingredients", {})
                total_estimated_cost = pricing_result.get("total_cost", 0)
            
            # Convert to shopping list format with realistic pricing
            shopping_items = []
            for food_name, details in food_totals.items():
                # Get price from AI/fallback pricing
                item_price = 3.99  # Default fallback
                for price_item in ingredient_prices:
                    if isinstance(price_item, dict) and price_item.get("name", "").lower() == food_name.lower():
                        item_price = price_item.get("estimated_cost", 3.99)
                        break
                
                shopping_items.append({
                    "item": food_name,
                    "amount": details["amount"],
                    "unit": details["unit"],
                    "estimated_cost": round(item_price, 2),
                    "category": "General",
                    "in_food_index": True
                })
            
            # Calculate actual total cost
            actual_total_cost = sum(item["estimated_cost"] for item in shopping_items)
            
            # Return in expected format
            result = {
                "shopping_list": shopping_items,
                "total_items": len(shopping_items),
                "estimated_total_cost": round(actual_total_cost, 2),
                "plan_id": plan_id,
                "generated_at": datetime.now().isoformat()
            }
            
            # Cache the result in Redis for 6 hours
            if redis_client.is_connected():
                redis_client.cache_shopping_list(plan_id, result, timedelta(hours=6))
                logger.info(f"✅ Cached shopping list for plan {plan_id}")
            
            logger.info(f"✅ Generated shopping list with {len(shopping_items)} items")
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to generate shopping list: {e}")
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
            
            client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                timeout=120.0  # 2 minute timeout for AI requests
            )
            
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
                model="claude-sonnet-4-20250514",
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
            
            client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                timeout=120.0  # 2 minute timeout for AI requests
            )
            
            # Create a simpler prompt with fewer items
            items_str = ", ".join([f"{item['name']} ({item['amount']} {item['unit']})" for item in ingredients_list])
            
            prompt = f"""Estimate grocery costs for these items in New England: {items_str}

Return only JSON:
{{"total_estimated_cost": 25.99, "pricing_notes": "Estimated based on typical grocery store prices"}}"""

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
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
        """Get cached shopping list from Redis first, then fallback to database"""
        try:
            # First check Redis cache
            if redis_client.is_connected():
                cached_list = redis_client.get_shopping_list(plan_id)
                if cached_list:
                    return cached_list
            
            # Fallback to database
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
                
                # Cache in Redis for future requests
                if redis_client.is_connected():
                    redis_client.cache_shopping_list(plan_id, shopping_list, timedelta(hours=6))
                
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
        """Delete a specific shopping list and clear Redis cache"""
        try:
            # First get the shopping list to find the meal_plan_id for cache invalidation
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            result = self.shopping_lists_collection.delete_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            # Clear Redis cache if the shopping list had a meal_plan_id
            if result.deleted_count > 0 and shopping_list and redis_client.is_connected():
                meal_plan_id = shopping_list.get("meal_plan_id")
                if meal_plan_id:
                    redis_client.delete(f"shopping_list:{meal_plan_id}")
            
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting shopping list: {e}")
            return False

    async def update_shopping_list(self, user_id: str, shopping_list_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an entire shopping list and clear Redis cache"""
        try:
            # First get the shopping list to find meal_plan_id for cache invalidation
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if not shopping_list:
                return None
            
            # Update the shopping list
            update_data["updated_at"] = datetime.utcnow()
            
            result = self.shopping_lists_collection.update_one(
                {"user_id": user_id, "shopping_list_id": shopping_list_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Clear Redis cache
                if redis_client.is_connected():
                    meal_plan_id = shopping_list.get("meal_plan_id")
                    if meal_plan_id:
                        redis_client.delete(f"shopping_list:{meal_plan_id}")
                
                # Return updated shopping list
                updated_list = self.shopping_lists_collection.find_one({
                    "user_id": user_id,
                    "shopping_list_id": shopping_list_id
                })
                
                if updated_list:
                    updated_list["id"] = str(updated_list["_id"])
                    del updated_list["_id"]
                    return updated_list
            
            return None
        except Exception as e:
            print(f"Error updating shopping list: {e}")
            return None

    async def update_shopping_list_item(self, user_id: str, shopping_list_id: str, item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a specific item in a shopping list and clear Redis cache"""
        try:
            # First get the shopping list to find meal_plan_id for cache invalidation
            shopping_list = self.shopping_lists_collection.find_one({
                "user_id": user_id,
                "shopping_list_id": shopping_list_id
            })
            
            if not shopping_list:
                return None
            
            # Update the specific item in the items array
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.shopping_lists_collection.update_one(
                {
                    "user_id": user_id,
                    "shopping_list_id": shopping_list_id,
                    "items.item_id": item_id
                },
                {"$set": {f"items.$.{key}": value for key, value in update_data.items()}}
            )
            
            if result.modified_count > 0:
                # Clear Redis cache
                if redis_client.is_connected():
                    meal_plan_id = shopping_list.get("meal_plan_id")
                    if meal_plan_id:
                        redis_client.delete(f"shopping_list:{meal_plan_id}")
                
                # Return updated shopping list
                updated_list = self.shopping_lists_collection.find_one({
                    "user_id": user_id,
                    "shopping_list_id": shopping_list_id
                })
                
                if updated_list:
                    updated_list["id"] = str(updated_list["_id"])
                    del updated_list["_id"]
                    
                    # Find and return the updated item
                    for item in updated_list.get("items", []):
                        if item.get("item_id") == item_id:
                            return item
            
            return None
        except Exception as e:
            print(f"Error updating shopping list item: {e}")
            return None

    
# Global meal planning service instance
meal_planning_service = MealPlanningService()
