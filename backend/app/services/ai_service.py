import anthropic
import os
import logging
from typing import List, Dict, Any
from datetime import datetime, date, timedelta
from ..models.chat import ChatMessage, ChatRequest, ChatResponse, MealSuggestionRequest, MealSuggestionResponse
import json
import re
import uuid

logger = logging.getLogger(__name__)


class AIService:
    """AI service for chatbot and meal suggestions"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            timeout=90.0  # 90 second timeout for AI requests
        )
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Handle chatbot conversation"""
        try:
            # Prepare messages for Claude
            messages = []
            for msg in request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": request.message
            })
            
            # System prompt for nutrition assistant
            system_prompt = """You are a helpful nutrition and wellness assistant. You provide evidence-based advice about nutrition, healthy eating, meal planning, and general wellness. 

Guidelines:
- Give practical, actionable advice
- Always recommend consulting healthcare professionals for medical issues
- Focus on balanced, sustainable approaches
- Be encouraging and supportive
- Keep responses concise but informative
- If asked about specific calorie counts or nutritional values, provide reasonable estimates but mention that actual values may vary"""
            
            # Call Claude API with optimized settings
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Use faster model
                max_tokens=2000,
                system=system_prompt,
                messages=messages,
                timeout=30.0  # Shorter timeout for chat
            )
            
            assistant_response = response.content[0].text
            
            # Update conversation history
            updated_history = request.conversation_history.copy()
            updated_history.append(ChatMessage(role="user", content=request.message))
            updated_history.append(ChatMessage(role="assistant", content=assistant_response))
            
            return ChatResponse(
                response=assistant_response,
                conversation_history=updated_history
            )
            
        except Exception as e:
            # Log the actual error for debugging
            print(f"AI Service Error: {str(e)}")
            print(f"Error type: {type(e)}")
            # Fallback response
            return ChatResponse(
                response=f"Error: {str(e)}",  # Show actual error for debugging
                conversation_history=request.conversation_history
            )
    
    async def get_meal_suggestions(self, request: MealSuggestionRequest, user_id: str = None) -> MealSuggestionResponse:
        """Generate meal suggestions based on requirements with enhanced preference integration"""
        try:
            # Get user preferences and active goal for enhanced context
            enhanced_context = await self._get_enhanced_user_context(user_id) if user_id else {}
            
            # Build comprehensive prompt based on requirements and user context
            prompt = f"""Create 3 diverse and creative {request.meal_type} suggestions with enhanced personalization.

VARIETY REQUIREMENTS:
- Use DIFFERENT cooking methods (grilled, steamed, roasted, raw, sautéed, etc.)
- Include DIFFERENT protein sources (plant-based, seafood, poultry, etc.)
- Vary cuisines and flavor profiles (Mediterranean, Asian, Mexican, American, etc.)
- Mix preparation styles (one-pot meals, salads, hearty dishes, light options)
- Ensure each suggestion is UNIQUE and creative

USER CONTEXT:"""
            
            # Add goal-based context
            if enhanced_context.get("goal_context"):
                goal_ctx = enhanced_context["goal_context"]
                prompt += f"\n- Health Goal: {enhanced_context.get('goal_type', 'maintenance').replace('_', ' ').title()}"
                prompt += f"\n- Focus Areas: {goal_ctx.get('focus', '')}"
                prompt += f"\n- Emphasize: {goal_ctx.get('emphasize', '')}"
                if goal_ctx.get('avoid'):
                    prompt += f"\n- Minimize: {goal_ctx.get('avoid', '')}"

            # Add nutrition targets from active goal
            if enhanced_context.get("nutrition_targets"):
                targets = enhanced_context["nutrition_targets"]
                prompt += f"\n- Daily Targets: {targets.get('calories', 'N/A')} cal, {targets.get('protein', 'N/A')}g protein"

            # Add user dietary preferences
            if enhanced_context.get("dietary_preferences"):
                diet_prefs = enhanced_context["dietary_preferences"]
                if diet_prefs.get("dietary_restrictions"):
                    prompt += f"\n- Dietary Style: {', '.join(diet_prefs['dietary_restrictions'])}"
                if diet_prefs.get("preferred_cuisines"):
                    prompt += f"\n- Preferred Cuisines: {', '.join(diet_prefs['preferred_cuisines'])}"
                if diet_prefs.get("cooking_skill_level"):
                    prompt += f"\n- Cooking Level: {diet_prefs['cooking_skill_level']}"
                if diet_prefs.get("max_prep_time"):
                    prompt += f"\n- Max Prep Time: {diet_prefs['max_prep_time']} minutes"

            prompt += f"\n\nMEAL REQUIREMENTS:"
            
            if request.remaining_calories:
                prompt += f"\n- Target around {request.remaining_calories} calories each"
            if request.remaining_protein:
                prompt += f"\n- Target around {request.remaining_protein}g protein each"
            if request.dietary_preferences:
                for pref in request.dietary_preferences:
                    prompt += f"\n- Must be {pref}"
            if request.allergies:
                for allergy in request.allergies:
                    prompt += f"\n- STRICT: No {allergy} (allergy)"
            
            # Add prep time preference
            if request.prep_time_preference:
                prep_time_map = {
                    "quick": "STRICT REQUIREMENT: Maximum 15 minutes preparation time only",
                    "moderate": "STRICT REQUIREMENT: Between 15-45 minutes preparation time only",  
                    "complex": "STRICT REQUIREMENT: Minimum 45 minutes preparation time only"
                }
                prep_desc = prep_time_map.get(request.prep_time_preference, request.prep_time_preference)
                prompt += f"\n- {prep_desc}"
            
            # Add main ingredients focus
            if request.main_ingredients and len(request.main_ingredients) > 0:
                ingredients_list = ", ".join(request.main_ingredients[:3])  # Limit to 3
                prompt += f"\n- MANDATORY: Every single suggestion MUST prominently feature ALL of these main ingredients: {ingredients_list}"
                prompt += f"\n- MANDATORY: These ingredients must appear in the ingredients list of every suggestion"
                prompt += f"\n- MANDATORY: Do not suggest meals that don't include ALL specified main ingredients"
            
            prompt += """

STRICT COMPLIANCE REQUIREMENTS:
- ALL prep time constraints are MANDATORY and must be followed exactly
- ALL main ingredients specified are MANDATORY and must appear in EVERY suggestion
- ALL dietary preferences and allergies are MANDATORY restrictions
- Do NOT provide suggestions that violate any of these constraints

CREATIVITY GUIDELINES:
- At least one meal suggestion should be innovative. Think beyond basic combinations.
- At least one meal suggestion should be comforting and familiar.
- If main ingredients are specified, make them the star of each dish
- Include seasonal ingredients when possible
- Mix textures and temperatures for interest
- Consider global flavors and spice profiles
- Keep descriptions concise but appealing (1-2 sentences max)
- Respect prep time constraints EXACTLY - no flexibility

CRITICAL: If any constraint cannot be met, do not provide that suggestion. Quality over quantity - better to have fewer suggestions that perfectly meet all requirements than suggestions that violate constraints.

Return valid JSON only (no additional text):
{"suggestions":[{"name":"Creative and specific name","description":"Brief description highlighting unique aspects","ingredients":[{"name":"item","amount":100,"unit":"g","calories":50,"protein":5,"carbs":10,"fat":2}],"instructions":["step1","step2","step3"],"prep_time":15,"nutrition":{"calories":300,"protein":25,"carbs":30,"fat":10},"goal_alignment":"Brief note on goal support"}]}"""
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Use faster model
                max_tokens=6000,  # Reduced for faster processing 
                messages=[{"role": "user", "content": prompt}],
                timeout=45.0  # Timeout for meal suggestions
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            print(f"Enhanced Claude response: {response_text}")  # Debug output
            
            # Extract JSON from response (Claude sometimes adds extra text)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                print(f"Extracted JSON: {json_str}")  # Debug output
                try:
                    suggestions_data = json.loads(json_str)
                    return MealSuggestionResponse(**suggestions_data)
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    print(f"Problematic JSON: {json_str}")
                    # Try to clean up common JSON issues
                    cleaned_json = self._clean_json_response(json_str)
                    try:
                        suggestions_data = json.loads(cleaned_json)
                        return MealSuggestionResponse(**suggestions_data)
                    except:
                        # Fall back to fallback suggestions if JSON is still malformed
                        return self._get_fallback_meal_suggestions(request.meal_type)
            else:
                print(f"No JSON found in response: {response_text}")  # Debug output
                return self._get_fallback_meal_suggestions(request.meal_type)
                
        except Exception as e:
            print(f"Error generating meal suggestions: {e}")
            # No fallback - raise error instead of returning fallback data
            raise Exception(f"AI meal suggestion service failed: {str(e)}")

    async def _get_enhanced_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user context for AI enhancement"""
        try:
            from ..services.user_service import user_service
            from ..services.goals_service import goals_service
            
            context = {}
            
            # Get user preferences
            try:
                user_preferences = await user_service.get_user_preferences(user_id)
                context["dietary_preferences"] = user_preferences.get("dietary", {})
                context["nutrition_preferences"] = user_preferences.get("nutrition", {})
                context["app_preferences"] = user_preferences.get("app", {})
            except Exception as e:
                print(f"Could not get user preferences: {e}")
            
            # Get active goal context
            try:
                goal_preferences = await goals_service.get_active_goal_preferences(user_id)
                context.update(goal_preferences) 
            except Exception as e:
                print(f"Could not get goal preferences: {e}")
            
            return context
            
        except Exception as e:
            print(f"Error getting enhanced user context: {e}")
            return {}
    
    async def generate_meal_plan(self, meal_plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive meal plan using AI with enhanced variety and user context"""
        try:
            user_id = meal_plan_data.get("user_id")
            days = meal_plan_data.get("days", 7)
            nutrition_targets = meal_plan_data.get("nutrition_targets", {})
            dietary_restrictions = meal_plan_data.get("dietary_restrictions", [])
            preferred_cuisines = meal_plan_data.get("preferred_cuisines", [])
            exclude_foods = meal_plan_data.get("exclude_foods", [])  # Add this line
            meal_types = meal_plan_data.get("meal_types", ["breakfast", "lunch", "dinner"])
            complexity_level = meal_plan_data.get("complexity_level", "any")  # Add complexity level
            user_title = meal_plan_data.get("name", "")  # Get the user-provided title
            use_food_index_only = meal_plan_data.get("use_food_index_only", False)
            special_requests = meal_plan_data.get("special_requests", "")  # Add special requests
            
            # Get enhanced user context
            enhanced_context = await self._get_enhanced_user_context(user_id) if user_id else {}
            
            # Get user's food index if the filter is enabled
            user_food_index = []
            if use_food_index_only and user_id:
                try:
                    from ..services.food_service import FoodService
                    food_service = FoodService()
                    user_food_index = await food_service.get_user_food_index(user_id)
                except Exception as e:
                    print(f"Error getting user food index: {e}")
                    user_food_index = []
            
            # Extract daily nutrition targets for strict compliance
            daily_calories = nutrition_targets.get("calories")
            daily_protein = nutrition_targets.get("protein") 
            daily_carbs = nutrition_targets.get("carbs")
            daily_fat = nutrition_targets.get("fat")
            
            # Prepare comprehensive prompt for AI with strict requirements
            prompt = f"""
            Create a {days}-day meal plan that STRICTLY adheres to nutritional targets and meal requirements.
            
            USER CONTEXT:"""
            
            # Add goal-based context
            if enhanced_context.get("goal_context"):
                goal_ctx = enhanced_context["goal_context"]
                prompt += f"\n- Health Goal: {enhanced_context.get('goal_type', 'maintenance').replace('_', ' ').title()}"
                prompt += f"\n- Goal Focus: {goal_ctx.get('focus', '')}"
                prompt += f"\n- Meal Strategy: {goal_ctx.get('meal_frequency', '')}"

            # Add enhanced preferences
            if enhanced_context.get("dietary_preferences"):
                diet_prefs = enhanced_context["dietary_preferences"]
                if diet_prefs.get("cooking_skill_level"):
                    prompt += f"\n- Cooking Skill: {diet_prefs['cooking_skill_level']}"
                if diet_prefs.get("max_prep_time"):
                    prompt += f"\n- Max Prep Time: {diet_prefs['max_prep_time']} minutes per meal"
                if diet_prefs.get("budget_preference"):
                    prompt += f"\n- Budget Level: {diet_prefs['budget_preference']}"

            prompt += f"""
            
            STRICT NUTRITIONAL REQUIREMENTS (MANDATORY COMPLIANCE):
            - Daily calories: {daily_calories if daily_calories else 'Not specified'}
            - Daily protein: {daily_protein if daily_protein else 'Not specified'}g
            - Daily carbs: {daily_carbs if daily_carbs else 'Not specified'}g
            - Daily fat: {daily_fat if daily_fat else 'Not specified'}g
            
            CRITICAL: If nutritional targets are specified, the daily totals MUST be within ±50 calories and ±5g for macros.
            Each day's total nutrition must add up to meet these targets precisely.
            
            MANDATORY MEAL REQUIREMENTS:
            - Required meal types for EVERY DAY: {', '.join(meal_types)}
            - EVERY SINGLE DAY must include ALL specified meal types
            - No day can be missing any of the required meal types
            - All meal types are MANDATORY, not optional
            
            PLAN REQUIREMENTS:
            - Dietary restrictions: {', '.join(dietary_restrictions) if dietary_restrictions else 'None'}
            - Preferred cuisines: {', '.join(preferred_cuisines) if preferred_cuisines else 'Varied international'}
            - Foods to AVOID: {', '.join(exclude_foods) if exclude_foods else 'None'}
            
            SPECIAL REQUESTS: {special_requests if special_requests else 'None - follow standard meal planning guidelines'}
            
            MEAL COMPLEXITY LEVEL: {complexity_level.upper()}
            """
            
            # Add complexity level instructions
            if complexity_level == "simple":
                prompt += """
            - Focus on simple meals with 3-5 ingredients maximum
            - Quick preparation (under 15 minutes for most meals)
            - Minimal cooking techniques (no complex sauces, advanced techniques)
            - Examples: sandwiches, salads, simple protein + vegetable + starch
            - Prefer foods that require minimal prep (pre-cooked, canned, frozen options are fine)
            """
            elif complexity_level == "moderate":
                prompt += """
            - Moderate complexity with 5-8 ingredients per meal
            - 15-30 minute preparation time
            - Basic cooking techniques (sautéing, roasting, steaming)
            - Examples: stir-fries, grain bowls, simple pasta dishes, sheet pan meals
            - Some meal prep steps are acceptable
            """
            elif complexity_level == "complex":
                prompt += """
            - Complex meals with 8+ ingredients and multiple components
            - 30+ minute preparation time acceptable
            - Advanced cooking techniques welcome (braising, marinating, complex sauces)
            - Examples: traditional ethnic dishes, elaborate grain bowls, homemade soups
            - Multi-step recipes and longer cooking times are fine
            """
            else:  # "any"
                prompt += """
            - Mix of simple, moderate, and complex meals for variety
            - Balance quick meals for busy days with more elaborate options
            - Consider different complexity levels across different meal types
            """
            
            # Add food index instructions if enabled
            if use_food_index_only and user_food_index:
                prompt += f"""
            
            FOOD INDEX RESTRICTION (CRITICAL):
            - ONLY use foods from the user's personal food index for main ingredients
            - User's available foods: {[food.get('name', '') for food in user_food_index if food.get('name')]}
            - You MAY assume the user has basic pantry staples (oil, salt, pepper, basic spices, garlic, onions, vinegar, lemon/lime juice)
            - For main ingredients (proteins, grains, vegetables, fruits), ONLY use items from the food index above
            - This provides realistic nutrition results using foods the user has already logged
            - If you cannot create a balanced meal plan with only these foods, suggest adding variety to their food index"""
            elif use_food_index_only and not user_food_index:
                prompt += f"""
            
            FOOD INDEX RESTRICTION (CRITICAL):
            - User requested to use only their food index, but no foods found in their index
            - Please create a meal plan with basic, common foods and suggest they log more foods to build their personal food index
            - Focus on simple, whole foods that most people have access to"""
            
            prompt += f"""
            
            VARIETY REQUIREMENTS:
            - Each day should have different meal combinations
            - Rotate protein sources throughout the week
            - Include variety in cooking methods (grilled, baked, raw, etc.)
            - Mix different cuisines across days
            - Ensure no ingredient repeats more than 2-3 times per week
            - Include seasonal and fresh ingredients
            
            CRITICAL COMPLIANCE RULES:
            1. NUTRITION TARGETS: If daily nutrition targets are provided, they are MANDATORY. Calculate each meal's nutrition to ensure the daily total matches the targets within ±50 calories and ±5g macros.
            2. MEAL TYPES: Every day MUST include ALL specified meal types. No exceptions.
            3. TITLE PRESERVATION: Use the exact title provided by the user. Do not modify, enhance, or replace it.
            
            For each day, provide:
            1. ALL required meal types: {', '.join(meal_types)}
            2. Each meal should include:
               - Detailed ingredient list with amounts
               - Complete step-by-step cooking instructions
               - Estimated calories, protein, carbs, fat, fiber
               - Prep time and cooking method
               - Why this meal fits the user's goals
            3. Verify that daily totals match the nutrition targets
            
            Return as JSON with structure (preserve exact user title):"""
            
            # Prepare title string
            plan_title = user_title if user_title else f"Personalized {days}-Day Meal Plan"
            
            prompt += f"""
            {{
                "plan_id": "unique_id",
                "user_id": "{user_id}",
                "title": "{plan_title}",
                "name": "{plan_title}",
                "description": "Tailored to your health goals and preferences",
                "days": [
                    {{
                        "day": 1,
                        "date": "YYYY-MM-DD",
                        "theme": "Day theme (e.g., Mediterranean Monday)",
                        "meals": [
                            {{
                                "meal_type": "breakfast",
                                "food_name": "...",
                                "description": "Brief description",
                                "ingredients": [
                                    {{"name": "ingredient", "amount": 100, "unit": "g"}}
                                ],
                                "instructions": ["step1", "step2", "step3"],
                                "prep_time": 15,
                                "cooking_method": "method",
                                "portion_size": "1 serving",
                                "calories": 0,
                                "protein": 0,
                                "carbs": 0,
                                "fat": 0,
                                "fiber": 0,
                                "goal_alignment": "How this supports user's goals"
                            }}
                        ],
                        "total_nutrition": {{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}},
                        "day_notes": "Special notes for this day"
                    }}
                ],
                "variety_score": "Assessment of meal variety",
                "goal_alignment": "How this plan supports the user's health goals",
                "shopping_tips": "Tips for efficient shopping and prep"
            }}
            
            FINAL VERIFICATION CHECKLIST:
            - Every day includes ALL required meal types: {', '.join(meal_types)}
            - Daily nutrition totals match targets within acceptable ranges
            - User title is preserved exactly as provided
            - All meals include detailed cooking instructions
            - Ingredient amounts are realistic and specific
            """
            
            # Use AI service to generate meal plan with optimized settings
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Use faster model for better response times
                max_tokens=6000,  # Reduced for faster processing
                messages=[{"role": "user", "content": prompt}],
                timeout=60.0  # Shorter timeout for individual API calls
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            print(f"DEBUG: AI Response: {response_text[:500]}...")  # Debug output
            
            # Extract JSON from response (Claude sometimes adds extra text)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                print(f"DEBUG: Extracted JSON: {json_str[:300]}...")  # Debug output
                try:
                    meal_plan_data = json.loads(json_str)
                    print(f"DEBUG: Successfully parsed JSON with keys: {list(meal_plan_data.keys())}")
                    return meal_plan_data
                except json.JSONDecodeError as e:
                    print(f"DEBUG: JSON decode error: {e}")
                    print(f"DEBUG: Problematic JSON: {json_str[:200]}...")
                    # Try to clean up the JSON
                    print(f"DEBUG: Attempting to clean JSON...")
                    cleaned_json = self._clean_json_response(json_str)
                    try:
                        meal_plan_data = json.loads(cleaned_json)
                        print(f"DEBUG: Successfully parsed cleaned JSON with keys: {list(meal_plan_data.keys())}")
                        return meal_plan_data
                    except json.JSONDecodeError as e2:
                        print(f"DEBUG: Still failed after cleaning: {e2}")
                        print(f"DEBUG: Cleaned JSON: {cleaned_json[:200]}...")
                        return self._generate_fallback_meal_plan(days, meal_types, dietary_restrictions)
            else:
                print(f"DEBUG: No JSON found in response")
                return self._generate_fallback_meal_plan(days, meal_types, dietary_restrictions)
                
        except Exception as e:
            print(f"Error generating meal plan: {e}")
            return self._generate_fallback_meal_plan(days, meal_types, dietary_restrictions)

    async def get_quick_meal_suggestion(self, meal_context: Dict[str, Any]) -> Dict[str, Any]:
        """Get a quick meal suggestion for a specific meal type"""
        try:
            meal_type = meal_context.get("meal_type", "lunch")
            dietary_restrictions = meal_context.get("dietary_restrictions", [])
            cuisine_preference = meal_context.get("cuisine_preference")
            max_prep_time = meal_context.get("max_prep_time", 30)
            ingredients_on_hand = meal_context.get("ingredients_on_hand", [])
            
            # Prepare prompt
            prompt = f"""
            Suggest a quick {meal_type} meal with these requirements:
            
            - Dietary restrictions: {', '.join(dietary_restrictions) if dietary_restrictions else 'None'}
            - Cuisine preference: {cuisine_preference or 'Any'}
            - Maximum prep time: {max_prep_time} minutes
            - Ingredients available: {', '.join(ingredients_on_hand) if ingredients_on_hand else 'Standard pantry items'}
            
            Provide:
            1. Meal name and description
            2. Ingredient list with amounts
            3. Step-by-step instructions
            4. Estimated nutrition (calories, protein, carbs, fat)
            5. Actual prep time
            
            Return as JSON:
            {{
                "meal_name": "...",
                "description": "...",
                "prep_time": 0,
                "ingredients": [
                    {{"name": "...", "amount": "...", "unit": "..."}}
                ],
                "instructions": ["step1", "step2"],
                "nutrition": {{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}
            }}
            """
            
            # Generate suggestion
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                suggestion_data = json.loads(json_str)
                return suggestion_data
            else:
                return self._generate_fallback_quick_meal(meal_type, dietary_restrictions)
            
        except Exception as e:
            print(f"Error getting quick meal suggestion: {e}")
            return self._generate_fallback_quick_meal(meal_type, dietary_restrictions)

    async def get_meal_recommendations(self, user_id: str, meal_type: str, consider_recent_meals: bool = True) -> Dict[str, Any]:
        """Get personalized meal recommendations based on user's history and preferences"""
        try:
            # Get user's recent meal history if requested
            recent_meals_context = ""
            if consider_recent_meals:
                # In a full implementation, we'd fetch recent meals from food_log_service
                recent_meals_context = "Consider variety from recent meals."
            
            prompt = f"""
            Recommend 3-5 {meal_type} options for a user with these considerations:
            
            - Meal type: {meal_type}
            - {recent_meals_context}
            - Focus on nutritious, balanced options
            - Include variety in cuisines and cooking methods
            
            For each recommendation, provide:
            1. Meal name and brief description
            2. Why it's a good choice for this meal type
            3. Estimated prep time
            4. Key nutritional benefits
            5. Approximate nutrition values
            
            Return as JSON:
            {{
                "recommendations": [
                    {{
                        "name": "...",
                        "description": "...",
                        "prep_time": 0,
                        "benefits": ["benefit1", "benefit2"],
                        "nutrition": {{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}},
                        "why_recommended": "..."
                    }}
                ]
            }}
            """
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                recommendations_data = json.loads(json_str)
                return recommendations_data
            else:
                return self._generate_fallback_recommendations(meal_type)
            
        except Exception as e:
            print(f"Error getting meal recommendations: {e}")
            return self._generate_fallback_recommendations(meal_type)

    async def generate_insights(self, insights_prompt: str) -> Dict[str, Any]:
        """Generate AI insights from a formatted prompt"""
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": insights_prompt}]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                insights_data = json.loads(json_str)
                return insights_data
            else:
                return {"insights": []}
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            return {"insights": []}

    async def generate_comprehensive_insights(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive MyFitnessPal-style insights about user's nutrition and progress"""
        try:
            # Extract user data components
            timeframe = user_data.get("timeframe", "week")
            food_logs = user_data.get("food_logs", [])
            goals = user_data.get("goals", {})
            weight_logs = user_data.get("weight_logs", [])
            nutrition_stats = user_data.get("nutrition_stats", {})
            food_patterns = user_data.get("food_patterns", {})
            
            # Create comprehensive prompt for AI analysis
            prompt = f"""
            You are an expert nutrition AI analyst creating personalized insights for a health-conscious user. 
            Analyze their {timeframe} nutrition data and generate 5-8 innovative, actionable insights.
            
            USER DATA ANALYSIS:
            ===================
            
            NUTRITION STATISTICS ({timeframe}):
            - Average daily calories: {nutrition_stats.get('avg_calories', 0)}
            - Average daily protein: {nutrition_stats.get('avg_protein', 0)}g
            - Average daily carbs: {nutrition_stats.get('avg_carbs', 0)}g 
            - Average daily fat: {nutrition_stats.get('avg_fat', 0)}g
            - Total logged meals: {nutrition_stats.get('total_meals', 0)}
            - Most active meal time: {nutrition_stats.get('most_active_meal_time', 'Unknown')}
            - Logging consistency: {nutrition_stats.get('logging_consistency', 0)}%
            
            GOALS & TARGETS:
            - Active goal: {goals.get('goal_type', 'None set')}
            - Calorie target: {goals.get('calorie_target', 'Not set')}
            - Protein target: {goals.get('protein_target', 'Not set')}g
            - Weight goal: {goals.get('weight_target', 'Not set')}
            
            FOOD PATTERNS:
            - Most eaten foods: {food_patterns.get('top_foods', [])}
            - Preferred meal types: {food_patterns.get('meal_type_distribution', {})}
            - Cuisine preferences: {food_patterns.get('cuisine_patterns', [])}
            - Eating schedule patterns: {food_patterns.get('timing_patterns', {})}
            
            WEIGHT PROGRESS:
            - Current weight trend: {weight_logs[:3] if weight_logs else 'No recent data'}
            - Weight change this period: {nutrition_stats.get('weight_change', 'No data')}
            
            RECENT MEAL EXAMPLES:
            {json.dumps(food_logs[:10], indent=2) if food_logs else 'No recent meals logged'}
            
            INSIGHT GENERATION REQUIREMENTS:
            ===============================
            
            Create 5-8 insights that are:
            1. SPECIFIC and DATA-DRIVEN (reference actual numbers from their data)
            2. ACTIONABLE (provide clear next steps)
            3. PERSONALIZED (based on their unique patterns)
            4. VARIED across categories:
               - "progress": Goal achievement and trends
               - "nutrition": Macro/micro nutrient analysis  
               - "habits": Eating patterns and behaviors
               - "recommendation": Specific improvement suggestions
            
            INSIGHT INNOVATION GUIDELINES:
            - Find interesting correlations in their data
            - Identify hidden patterns they might not notice
            - Provide "aha moments" about their nutrition
            - Reference specific foods/meals when relevant
            - Compare current period to targets and patterns
            - Suggest creative, practical improvements
            
            TONE & STYLE:
            - Encouraging but honest
            - Use specific numbers and percentages
            - MyFitnessPal-style insights (data-driven, motivational)
            - Avoid generic advice - make it personal
            
            Return ONLY valid JSON with this exact structure:
            {{
                "insights": [
                    {{
                        "id": "unique_id_1",
                        "title": "Specific insight title (5-8 words)",
                        "content": "Detailed explanation with specific data points and actionable advice (2-3 sentences)",
                        "category": "progress|nutrition|habits|recommendation",
                        "importance": 1|2|3
                    }}
                ],
                "summary": "One sentence overview of their overall progress this {timeframe}",
                "key_achievement": "Their biggest win this period",
                "main_opportunity": "The most impactful improvement they could make"
            }}
            
            CRITICAL: Base insights on ACTUAL user data. Don't make assumptions about data not provided.
            """
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,  # Increased for detailed comprehensive insights
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            print(f"AI Insights Response: {response_text[:500]}...")  # Debug
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    insights_data = json.loads(json_str)
                    return insights_data
                except json.JSONDecodeError as e:
                    print(f"JSON decode error in insights: {e}")
                    # Try to clean the JSON
                    cleaned_json = self._clean_json_response(json_str)
                    try:
                        insights_data = json.loads(cleaned_json)
                        return insights_data
                    except:
                        return self._generate_fallback_insights(timeframe)
            else:
                print("No JSON found in AI response")
                return self._generate_fallback_insights(timeframe)
            
        except Exception as e:
            print(f"Error generating comprehensive insights: {e}")
            return self._generate_fallback_insights(timeframe)

    def _generate_fallback_insights(self, timeframe: str) -> Dict[str, Any]:
        """Generate fallback insights when AI is unavailable"""
        return {
            "insights": [
                {
                    "id": "fallback_start",
                    "title": "Ready to Begin Your Journey",
                    "content": f"Start logging your meals consistently this {timeframe} to unlock personalized insights about your nutrition patterns and progress toward your goals.",
                    "category": "recommendation",
                    "importance": 3
                },
                {
                    "id": "fallback_consistency",
                    "title": "Build a Logging Habit", 
                    "content": "Consistent food logging is the foundation of understanding your nutrition. Aim to log at least 2-3 meals daily for meaningful insights.",
                    "category": "habits",
                    "importance": 2
                }
            ],
            "summary": f"Your nutrition journey is just beginning this {timeframe}.",
            "key_achievement": "Taking the first step toward better health",
            "main_opportunity": "Start consistent meal logging to unlock detailed insights"
        }

    def _get_fallback_meal_suggestions(self, meal_type: str) -> MealSuggestionResponse:
        """Provide fallback meal suggestions"""
        fallback_meals = {
            "breakfast": [
                {
                    "name": "Greek Yogurt with Berries",
                    "description": "Protein-rich breakfast with antioxidants",
                    "ingredients": [
                        {"name": "Greek yogurt", "amount": 150, "unit": "g", "calories": 100, "protein": 15, "carbs": 8, "fat": 0},
                        {"name": "Mixed berries", "amount": 100, "unit": "g", "calories": 50, "protein": 1, "carbs": 12, "fat": 0}
                    ],
                    "instructions": ["Add berries to yogurt", "Enjoy!"],
                    "prep_time": 2,
                    "nutrition": {"calories": 150, "protein": 16, "carbs": 20, "fat": 0}
                }
            ],
            "lunch": [
                {
                    "name": "Chicken Salad",
                    "description": "Fresh salad with grilled chicken",
                    "ingredients": [
                        {"name": "Chicken breast", "amount": 100, "unit": "g", "calories": 165, "protein": 31, "carbs": 0, "fat": 4},
                        {"name": "Mixed greens", "amount": 100, "unit": "g", "calories": 20, "protein": 2, "carbs": 4, "fat": 0}
                    ],
                    "instructions": ["Grill chicken", "Serve over greens"],
                    "prep_time": 15,
                    "nutrition": {"calories": 185, "protein": 33, "carbs": 4, "fat": 4}
                }
            ],
            "dinner": [
                {
                    "name": "Salmon with Vegetables",
                    "description": "Baked salmon with roasted vegetables",
                    "ingredients": [
                        {"name": "Salmon fillet", "amount": 150, "unit": "g", "calories": 250, "protein": 35, "carbs": 0, "fat": 12},
                        {"name": "Mixed vegetables", "amount": 200, "unit": "g", "calories": 50, "protein": 2, "carbs": 10, "fat": 0}
                    ],
                    "instructions": ["Bake salmon at 400F for 15 min", "Roast vegetables"],
                    "prep_time": 25,
                    "nutrition": {"calories": 300, "protein": 37, "carbs": 10, "fat": 12}
                }
            ],
            "snack": [
                {
                    "name": "Apple with Almond Butter",
                    "description": "Healthy snack with fiber and protein",
                    "ingredients": [
                        {"name": "Apple", "amount": 1, "unit": "medium", "calories": 80, "protein": 0, "carbs": 20, "fat": 0},
                        {"name": "Almond butter", "amount": 15, "unit": "g", "calories": 90, "protein": 3, "carbs": 3, "fat": 8}
                    ],
                    "instructions": ["Slice apple", "Serve with almond butter"],
                    "prep_time": 2,
                    "nutrition": {"calories": 170, "protein": 3, "carbs": 23, "fat": 8}
                }
            ]
        }
        
        meals = fallback_meals.get(meal_type, fallback_meals["snack"])
        return MealSuggestionResponse(suggestions=meals)

    def _generate_fallback_meal_plan(self, days: int, meal_types: List[str], dietary_restrictions: List[str]) -> Dict[str, Any]:
        """Generate a simple fallback meal plan when AI is unavailable"""
        
        # Simple meal templates based on restrictions
        is_vegetarian = "vegetarian" in dietary_restrictions
        is_vegan = "vegan" in dietary_restrictions
        
        breakfast_options = [
            {"name": "Oatmeal with berries", "calories": 300, "protein": 8, "carbs": 55, "fat": 6},
            {"name": "Greek yogurt with granola", "calories": 250, "protein": 15, "carbs": 30, "fat": 8},
            {"name": "Avocado toast", "calories": 280, "protein": 8, "carbs": 30, "fat": 16}
        ]
        
        if is_vegan:
            breakfast_options = [
                {"name": "Oatmeal with almond milk and berries", "calories": 280, "protein": 6, "carbs": 50, "fat": 8},
                {"name": "Smoothie bowl with fruits", "calories": 320, "protein": 8, "carbs": 60, "fat": 10}
            ]
        
        lunch_options = [
            {"name": "Quinoa salad with vegetables", "calories": 400, "protein": 12, "carbs": 55, "fat": 14},
            {"name": "Chicken wrap with vegetables", "calories": 450, "protein": 25, "carbs": 45, "fat": 18},
            {"name": "Lentil soup with bread", "calories": 380, "protein": 18, "carbs": 50, "fat": 12}
        ]
        
        if is_vegetarian or is_vegan:
            lunch_options = [opt for opt in lunch_options if "chicken" not in opt["name"].lower()]
        
        dinner_options = [
            {"name": "Baked salmon with sweet potato", "calories": 520, "protein": 35, "carbs": 40, "fat": 22},
            {"name": "Vegetable stir-fry with tofu", "calories": 450, "protein": 20, "carbs": 35, "fat": 25},
            {"name": "Pasta with marinara sauce", "calories": 480, "protein": 15, "carbs": 75, "fat": 12}
        ]
        
        if is_vegetarian or is_vegan:
            dinner_options = [opt for opt in dinner_options if "salmon" not in opt["name"].lower()]
        
        # Generate plan
        plan_days = []
        start_date = date.today()
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            day_meals = []
            total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
            
            if "breakfast" in meal_types:
                breakfast = breakfast_options[day % len(breakfast_options)]
                day_meals.append({
                    "meal_type": "breakfast",
                    "food_name": breakfast["name"],
                    "portion_size": "1 serving",
                    "calories": breakfast["calories"],
                    "protein": breakfast["protein"],
                    "carbs": breakfast["carbs"],
                    "fat": breakfast["fat"],
                    "preparation_notes": "Follow standard recipe"
                })
                for key in total_nutrition:
                    total_nutrition[key] += breakfast[key]
            
            if "lunch" in meal_types:
                lunch = lunch_options[day % len(lunch_options)]
                day_meals.append({
                    "meal_type": "lunch",
                    "food_name": lunch["name"],
                    "portion_size": "1 serving",
                    "calories": lunch["calories"],
                    "protein": lunch["protein"],
                    "carbs": lunch["carbs"],
                    "fat": lunch["fat"],
                    "preparation_notes": "Follow standard recipe"
                })
                for key in total_nutrition:
                    total_nutrition[key] += lunch[key]
            
            if "dinner" in meal_types:
                dinner = dinner_options[day % len(dinner_options)]
                day_meals.append({
                    "meal_type": "dinner",
                    "food_name": dinner["name"],
                    "portion_size": "1 serving",
                    "calories": dinner["calories"],
                    "protein": dinner["protein"],
                    "carbs": dinner["carbs"],
                    "fat": dinner["fat"],
                    "preparation_notes": "Follow standard recipe"
                })
                for key in total_nutrition:
                    total_nutrition[key] += dinner[key]
            
            plan_days.append({
                "day": day + 1,
                "date": current_date.isoformat(),
                "meals": day_meals,
                "total_nutrition": total_nutrition
            })
        
        return {
            "plan_id": str(uuid.uuid4()),
            "user_id": "fallback",
            "created_at": str(datetime.now()),
            "days": plan_days,
            "total_days": days,
            "dietary_restrictions": dietary_restrictions,
            "target_nutrition": {},
            "note": "Fallback meal plan - AI services unavailable"
        }

    def _generate_fallback_quick_meal(self, meal_type: str, dietary_restrictions: List[str]) -> Dict[str, Any]:
        """Generate a simple fallback quick meal suggestion"""
        is_vegan = "vegan" in dietary_restrictions
        is_vegetarian = "vegetarian" in dietary_restrictions
        
        meals = {
            "breakfast": {
                "name": "Quick Oatmeal Bowl",
                "description": "Simple, nutritious breakfast ready in 5 minutes",
                "prep_time": 5,
                "ingredients": [
                    {"name": "Rolled oats", "amount": "1/2", "unit": "cup"},
                    {"name": "Almond milk" if is_vegan else "Milk", "amount": "1", "unit": "cup"},
                    {"name": "Banana", "amount": "1/2", "unit": "medium"},
                    {"name": "Honey" if not is_vegan else "Maple syrup", "amount": "1", "unit": "tbsp"}
                ],
                "instructions": [
                    "Combine oats and milk in microwave-safe bowl",
                    "Microwave for 2-3 minutes",
                    "Top with sliced banana and sweetener",
                    "Stir and enjoy"
                ],
                "nutrition": {"calories": 280, "protein": 8, "carbs": 50, "fat": 6}
            },
            "lunch": {
                "name": "Quick Veggie Wrap",
                "description": "Fresh and satisfying wrap with vegetables",
                "prep_time": 10,
                "ingredients": [
                    {"name": "Whole wheat tortilla", "amount": "1", "unit": "large"},
                    {"name": "Hummus", "amount": "2", "unit": "tbsp"},
                    {"name": "Cucumber", "amount": "1/4", "unit": "cup sliced"},
                    {"name": "Tomato", "amount": "1/4", "unit": "cup chopped"},
                    {"name": "Lettuce", "amount": "1", "unit": "cup"},
                    {"name": "Avocado", "amount": "1/4", "unit": "medium"}
                ],
                "instructions": [
                    "Spread hummus on tortilla",
                    "Add all vegetables",
                    "Roll tightly",
                    "Cut in half and serve"
                ],
                "nutrition": {"calories": 320, "protein": 12, "carbs": 45, "fat": 14}
            },
            "dinner": {
                "name": "Simple Pasta with Vegetables",
                "description": "Quick pasta dish with seasonal vegetables",
                "prep_time": 20,
                "ingredients": [
                    {"name": "Whole wheat pasta", "amount": "1", "unit": "cup dry"},
                    {"name": "Olive oil", "amount": "1", "unit": "tbsp"},
                    {"name": "Garlic", "amount": "2", "unit": "cloves"},
                    {"name": "Mixed vegetables", "amount": "1", "unit": "cup"},
                    {"name": "Parmesan cheese" if not is_vegan else "Nutritional yeast", "amount": "2", "unit": "tbsp"}
                ],
                "instructions": [
                    "Cook pasta according to package directions",
                    "Sauté garlic in olive oil",
                    "Add vegetables and cook until tender",
                    "Toss with pasta and cheese/yeast",
                    "Season with salt and pepper"
                ],
                "nutrition": {"calories": 420, "protein": 15, "carbs": 65, "fat": 12}
            },
            "snack": {
                "name": "Apple with Nut Butter",
                "description": "Simple, healthy snack",
                "prep_time": 2,
                "ingredients": [
                    {"name": "Apple", "amount": "1", "unit": "medium"},
                    {"name": "Almond butter", "amount": "1", "unit": "tbsp"}
                ],
                "instructions": [
                    "Slice apple",
                    "Serve with nut butter for dipping"
                ],
                "nutrition": {"calories": 180, "protein": 4, "carbs": 25, "fat": 8}
            }
        }
        
        return meals.get(meal_type, meals["snack"])

    def _generate_fallback_recommendations(self, meal_type: str) -> Dict[str, Any]:
        """Generate fallback meal recommendations"""
        recommendations = {
            "breakfast": [
                {
                    "name": "Greek Yogurt Parfait",
                    "description": "Protein-rich breakfast with probiotics",
                    "prep_time": 5,
                    "benefits": ["High protein", "Probiotics", "Quick prep"],
                    "nutrition": {"calories": 250, "protein": 15, "carbs": 30, "fat": 8},
                    "why_recommended": "Perfect balance of protein and carbs to start your day"
                },
                {
                    "name": "Avocado Toast",
                    "description": "Healthy fats with fiber-rich carbs",
                    "prep_time": 8,
                    "benefits": ["Healthy fats", "Fiber", "Satisfying"],
                    "nutrition": {"calories": 280, "protein": 8, "carbs": 30, "fat": 16},
                    "why_recommended": "Provides sustained energy and healthy monounsaturated fats"
                }
            ],
            "lunch": [
                {
                    "name": "Quinoa Buddha Bowl",
                    "description": "Complete protein with colorful vegetables",
                    "prep_time": 15,
                    "benefits": ["Complete protein", "Fiber", "Antioxidants"],
                    "nutrition": {"calories": 400, "protein": 12, "carbs": 55, "fat": 14},
                    "why_recommended": "Balanced macros with variety of nutrients"
                },
                {
                    "name": "Mediterranean Wrap",
                    "description": "Fresh vegetables with lean protein",
                    "prep_time": 10,
                    "benefits": ["Lean protein", "Healthy fats", "Portable"],
                    "nutrition": {"calories": 380, "protein": 20, "carbs": 40, "fat": 16},
                    "why_recommended": "Mediterranean diet benefits in a convenient format"
                }
            ],
            "dinner": [
                {
                    "name": "Baked Salmon with Vegetables",
                    "description": "Omega-3 rich fish with roasted vegetables",
                    "prep_time": 25,
                    "benefits": ["Omega-3 fatty acids", "High protein", "Anti-inflammatory"],
                    "nutrition": {"calories": 450, "protein": 35, "carbs": 25, "fat": 22},
                    "why_recommended": "Excellent source of omega-3s and lean protein"
                },
                {
                    "name": "Lentil Curry",
                    "description": "Plant-based protein with warming spices",
                    "prep_time": 30,
                    "benefits": ["Plant protein", "Fiber", "Anti-inflammatory spices"],
                    "nutrition": {"calories": 380, "protein": 18, "carbs": 50, "fat": 12},
                    "why_recommended": "High in plant protein and beneficial compounds from spices"
                }
            ]
        }
        
        return {"recommendations": recommendations.get(meal_type, recommendations["lunch"])}

    async def extract_meal_ingredients(self, meal_name: str, portion_size: str = "1 serving") -> List[Dict[str, Any]]:
        """Extract detailed ingredients from a meal name/description using AI"""
        try:
            prompt = f"""
            Analyze the meal "{meal_name}" (portion size: {portion_size}) and provide a detailed ingredient breakdown.
            
            Return ONLY a JSON array of ingredients with this exact structure:
            [
                {{
                    "name": "ingredient name",
                    "amount": number,
                    "unit": "unit (g, cup, tbsp, etc)",
                    "calories": estimated_calories,
                    "protein": estimated_protein_grams,
                    "carbs": estimated_carbs_grams,
                    "fat": estimated_fat_grams
                }}
            ]
            
            Guidelines:
            - Provide realistic ingredient amounts for the specified portion size
            - Include all major ingredients needed to make this meal
            - Use common cooking units (cups, tablespoons, ounces, grams, etc.)
            - Estimate nutrition values per ingredient amount
            - Be specific (e.g., "chicken breast" not just "chicken")
            
            Meal to analyze: "{meal_name}"
            Portion: {portion_size}
            """
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = response.content[0].text.strip()
            
            # Extract JSON array from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    ingredients = json.loads(json_str)
                    # Validate structure
                    for ingredient in ingredients:
                        if not all(key in ingredient for key in ['name', 'amount', 'unit']):
                            print(f"Invalid ingredient structure: {ingredient}")
                            continue
                        # Ensure numeric values
                        for key in ['amount', 'calories', 'protein', 'carbs', 'fat']:
                            if key not in ingredient:
                                ingredient[key] = 0
                            ingredient[key] = float(ingredient[key]) if ingredient[key] else 0
                    
                    return ingredients
                except json.JSONDecodeError as e:
                    print(f"Error parsing ingredients JSON: {e}")
                    return []
            else:
                print(f"No JSON array found in response: {response_text}")
                return []
                
        except Exception as e:
            print(f"Error extracting meal ingredients: {e}")
            return []

    def _clean_json_response(self, json_str: str) -> str:
        """Clean common JSON formatting issues from AI responses"""
        try:
            # Remove common issues that cause JSON parsing to fail
            cleaned = json_str.strip()
            
            # Remove markdown code blocks if present
            cleaned = re.sub(r'^```json\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            
            # Fix common trailing comma issues
            cleaned = re.sub(r',\s*}', '}', cleaned)
            cleaned = re.sub(r',\s*]', ']', cleaned)
            
            # Fix missing quotes around keys
            cleaned = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', cleaned)
            
            # Handle incomplete JSON - if it ends abruptly, try to close it properly
            if not cleaned.endswith('}') and not cleaned.endswith(']'):
                # For meal plans, try to find the last complete day and close properly
                last_complete_day = cleaned.rfind('"day_notes"')
                if last_complete_day != -1:
                    # Find the closing of this day object
                    day_end = cleaned.find('}', last_complete_day)
                    if day_end != -1:
                        # Truncate after the day object and add proper closing
                        cleaned = cleaned[:day_end + 1] + '], "variety_score": "Generated with some data", "goal_alignment": "Supports user goals", "shopping_tips": "Plan your shopping ahead"}'
                else:
                    # Find the last complete meal object
                    last_complete_meal = cleaned.rfind('"goal_alignment"')
                    if last_complete_meal != -1:
                        meal_end = cleaned.find('}', last_complete_meal)
                        if meal_end != -1:
                            # Truncate after the meal and close the structure
                            cleaned = cleaned[:meal_end + 1] + '], "total_nutrition": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 80, "fiber": 25}}], "variety_score": "Generated with partial data", "goal_alignment": "Supports user goals", "shopping_tips": "Plan ahead"}'
                    else:
                        # Count braces to ensure proper closing
                        open_braces = cleaned.count('{')
                        close_braces = cleaned.count('}')
                        if open_braces > close_braces:
                            cleaned += '}' * (open_braces - close_braces)
            
            return cleaned
        except Exception as e:
            print(f"Error cleaning JSON: {e}")
            return json_str

    async def generate_response(self, prompt: str) -> str:
        """Generate a text response from the AI service using the given prompt"""
        try:
            if not self.client:
                raise Exception("Anthropic client not initialized - API key missing")
                
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return response.content[0].text.strip()
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            raise Exception(f"AI service failed: {str(e)}")

    async def generate_dietary_attributes(self, food_name: str, serving_size: float = None, serving_unit: str = None) -> Dict[str, List[str]]:
        """Generate dietary attributes for a food item using AI"""
        try:
            serving_info = f" ({serving_size} {serving_unit})" if serving_size and serving_unit else ""
            
            prompt = f"""Analyze the food item "{food_name}{serving_info}" and provide dietary attributes in the following JSON format:

{{
  "dietary_restrictions": [],
  "allergens": [],
  "food_categories": []
}}

Guidelines for dietary_restrictions (include ALL that apply):

LIFESTYLE:
- "vegetarian": contains no meat, poultry, or fish
- "vegan": contains no animal products at all (no meat, dairy, eggs, honey, etc.)
- "pescatarian": vegetarian but includes fish/seafood
- "flexitarian": primarily plant-based with occasional meat

RELIGIOUS/CULTURAL:
- "halal": permissible in Islamic law (no pork, alcohol, non-halal meat)
- "kosher": permissible in Jewish law (no pork, shellfish, mixing meat/dairy)
- "jain": follows Jain dietary principles (no root vegetables, strictly vegetarian)

HEALTH REQUIREMENTS:
- "gluten-free": contains no wheat, barley, rye, or gluten-containing ingredients
- "dairy-free": contains no milk, cheese, butter, cream, yogurt, or dairy products
- "keto": very low carb (typically <5g net carbs per serving), high fat
- "paleo": follows paleolithic diet (no grains, legumes, dairy, processed foods)
- "low-sodium": contains <140mg sodium per serving

FITNESS & NUTRITION GOALS:
- "high-protein": contains ≥20g protein per serving OR ≥30% calories from protein
- "low-carb": contains <15g total carbs per serving OR <20% calories from carbs
- "low-sugar": contains <5g added sugar per serving
- "whole-foods": minimally processed, single ingredient or natural combination
- "heart-healthy": low saturated fat, no trans fat, beneficial for cardiovascular health
- "anti-inflammatory": foods known to reduce inflammation (omega-3s, antioxidants, etc.)
- "high-fiber": contains ≥5g fiber per serving

Guidelines for allergens (include ALL that apply):
- "nuts": contains tree nuts (almonds, walnuts, pecans, etc.)
- "peanuts": contains peanuts specifically
- "dairy": contains milk products
- "eggs": contains eggs
- "soy": contains soy products
- "shellfish": contains shellfish
- "fish": contains fish
- "wheat": contains wheat
- "sesame": contains sesame seeds or oil

Guidelines for food_categories (include ALL that apply):
- "fruit": fruits and fruit products
- "vegetable": vegetables and vegetable products
- "meat": beef, pork, lamb, poultry, etc.
- "seafood": fish, shellfish, and other seafood
- "dairy": milk, cheese, yogurt, etc.
- "grain": wheat, rice, oats, quinoa, etc.
- "legume": beans, lentils, peas, etc.
- "nuts": tree nuts and nut products
- "processed": highly processed foods, packaged items
- "beverage": drinks, juices, etc.
- "condiment": sauces, dressings, spices
- "dessert": sweets, candies, baked goods
- "oil": cooking oils and fats

IMPORTANT: Be especially accurate with nutritional attributes (high-protein, low-carb, etc.) as these are used for fitness-focused meal planning. Consider typical serving sizes and nutritional content when assigning these labels.

Be very thorough and accurate. Consider all ingredients that might be present in the food item.
Return ONLY the JSON object, no additional text."""

            response = await self.generate_response(prompt)
            
            # Clean and parse the JSON response
            try:
                # Extract JSON from response if wrapped in text
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    json_str = response
                
                dietary_data = json.loads(json_str)
                
                # Validate the structure
                required_keys = ["dietary_restrictions", "allergens", "food_categories"]
                for key in required_keys:
                    if key not in dietary_data:
                        dietary_data[key] = []
                    elif not isinstance(dietary_data[key], list):
                        dietary_data[key] = []
                
                logger.info(f"Generated dietary attributes for {food_name}: {dietary_data}")
                return dietary_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse dietary attributes JSON for {food_name}: {e}")
                # Return empty structure as fallback
                return {
                    "dietary_restrictions": [],
                    "allergens": [],
                    "food_categories": []
                }
                
        except Exception as e:
            logger.error(f"Error generating dietary attributes for {food_name}: {e}")
            # Return empty structure as fallback
            return {
                "dietary_restrictions": [],
                "allergens": [],
                "food_categories": []
            }

    async def generate_food_recommendations(self, prompt: str) -> Dict[str, Any]:
        """Generate food recommendations based on user preferences"""
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                temperature=0.3,
                messages=[{
                    "role": "user", 
                    "content": prompt
                }]
            )
            
            response_text = response.content[0].text
            
            # Try to parse JSON response
            try:
                import json
                return json.loads(response_text)
            except json.JSONDecodeError:
                # Return structured fallback
                return {
                    "recommendations": [{
                        "name": "Error parsing AI response",
                        "score": 50,
                        "reasons": ["AI service temporarily unavailable"],
                        "nutrition_highlights": [],
                        "meal_suitability": "unknown"
                    }]
                }
                
        except Exception as e:
            print(f"Error generating food recommendations: {e}")
            return {"recommendations": []}
    
    async def generate_conflict_resolution(self, prompt: str) -> Dict[str, Any]:
        """Generate suggestions for resolving dietary conflicts"""
        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                temperature=0.5,
                messages=[{
                    "role": "user", 
                    "content": prompt
                }]
            )
            
            response_text = response.content[0].text
            
            # Extract suggestions from response
            suggestions = []
            for line in response_text.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                    # Clean up list formatting
                    suggestion = line.lstrip('-•0123456789. ').strip()
                    if suggestion:
                        suggestions.append(suggestion)
            
            return {"suggestions": suggestions[:5]}  # Limit to 5 suggestions
                
        except Exception as e:
            print(f"Error generating conflict resolution: {e}")
            return {"suggestions": ["Consider consulting with a nutrition professional"]}
    
    async def analyze_meal_balance(self, foods: List[Dict], user_goals: Dict) -> Dict[str, Any]:
        """Analyze nutritional balance of a complete meal"""
        try:
            prompt = f"""
            As a nutrition expert, analyze this meal for nutritional balance:
            
            Foods in meal: {foods}
            User's nutritional goals: {user_goals}
            
            Provide analysis on:
            1. Macronutrient balance (protein, carbs, fats)
            2. Micronutrient coverage
            3. Meal timing appropriateness
            4. Suggestions for improvement
            
            Return JSON format:
            {{
                "overall_score": 0-100,
                "macronutrient_balance": {{"protein": "excellent|good|fair|poor", "carbs": "...", "fats": "..."}},
                "micronutrient_highlights": ["vitamin C rich", "good iron source"],
                "improvements": ["suggestion1", "suggestion2"],
                "meal_rating": "excellent|good|fair|needs_improvement"
            }}
            """
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                temperature=0.3,
                messages=[{
                    "role": "user", 
                    "content": prompt
                }]
            )
            
            response_text = response.content[0].text
            
            try:
                import json
                return json.loads(response_text)
            except json.JSONDecodeError:
                return {
                    "overall_score": 75,
                    "macronutrient_balance": {"protein": "good", "carbs": "good", "fats": "good"},
                    "micronutrient_highlights": ["Balanced meal"],
                    "improvements": ["Analysis temporarily unavailable"],
                    "meal_rating": "good"
                }
                
        except Exception as e:
            print(f"Error analyzing meal balance: {e}")
            return {
                "overall_score": 50,
                "macronutrient_balance": {"protein": "unknown", "carbs": "unknown", "fats": "unknown"},
                "micronutrient_highlights": [],
                "improvements": ["AI analysis unavailable"],
                "meal_rating": "unknown"
            }
