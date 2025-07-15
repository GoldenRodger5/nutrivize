"""
Unified AI Service - A comprehensive AI system for Nutrivize V2
Combines conversational AI, meal planning, health coaching, and intelligent food operations
"""

import anthropic
import os
import logging
import json
import re
import uuid
from datetime import datetime, timedelta, date, timezone
from typing import Dict, List, Any, Optional
from bson import ObjectId
import traceback

from ..models.chat import ChatMessage, ChatRequest, ChatResponse, MealSuggestionRequest, MealSuggestionResponse
from ..core.config import get_database
from ..services.food_service import FoodService
from ..services.dietary_recommendation_service import DietaryRecommendationService
from ..services.food_log_service import FoodLogService
from ..services.meal_planning_service import MealPlanningService
from ..services.user_service import user_service

logger = logging.getLogger(__name__)

class UnifiedAIService:
    """
    Unified AI service that handles all AI-powered features in Nutrivize V2:
    - Conversational AI chatbot
    - Intelligent meal suggestions and planning
    - Health coaching and insights
    - Smart food operations (logging, recommendations)
    - Dietary analysis and optimization
    - Predictive health analytics
    """

    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            timeout=120.0  # 2 minute timeout for AI requests
        )
        self.db = get_database()
        self.food_service = FoodService()
        self.dietary_service = DietaryRecommendationService()
        self.food_log_service = FoodLogService()
        self.meal_planning_service = MealPlanningService()
        self.user_service = user_service

        # Conversation contexts for each user
        self.conversation_contexts = {}

    async def chat_with_context(self, request: ChatRequest, user_id: str) -> ChatResponse:
        """
        Enhanced chat with full context awareness and smart operations
        """
        try:
            # Get user context for personalized responses
            user_context = await self._get_comprehensive_user_context(user_id)

            # Process any embedded operations in the message
            processed_request, operations_results = await self._process_smart_operations(
                request, user_id, user_context
            )

            # Check if the message is about the food index - expanded detection
            food_index_terms = [
                "food index", "my foods", "foods i have", "foods in my", 
                "what foods", "show me foods", "foods are", "foods with",
                "high protein foods", "low calorie foods", "vegan foods",
                "foods that are", "how many foods", "list foods",
                "foods containing", "protein foods", "healthy foods"
            ]
            
            if any(term in processed_request.message.lower() for term in food_index_terms):
                # Update the food index summary for immediate use
                user_context["food_index_summary"] = await self.get_food_index_summary(user_id)
                logger.info(f"Food index query detected. Retrieved food index for user {user_id}")

            # Build enhanced system prompt with user context
            system_prompt = await self._build_contextual_system_prompt(user_context)

            # Prepare conversation history
            messages = []
            for msg in processed_request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

            # Add current message with any operation results
            current_message = processed_request.message
            if operations_results:
                current_message += f"\n\nOperation Results: {operations_results}"

            messages.append({
                "role": "user", 
                "content": current_message
            })

            # Call Claude with enhanced context
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                system=system_prompt,
                messages=messages
            )

            assistant_response = response.content[0].text

            # Process any AI-initiated operations in the response
            assistant_response = await self._process_ai_operations(
                assistant_response, user_id, user_context
            )

            # Detect and process disliked foods mentioned in user message
            await self._detect_and_add_disliked_foods(processed_request.message, user_id)

            # Update conversation history
            updated_history = processed_request.conversation_history.copy()
            updated_history.append(ChatMessage(role="user", content=processed_request.message))
            updated_history.append(ChatMessage(role="assistant", content=assistant_response))

            # Store conversation context
            self.conversation_contexts[user_id] = {
                "last_updated": datetime.now(),
                "context": user_context,
                "recent_topics": self._extract_topics(assistant_response)
            }

            return ChatResponse(
                response=assistant_response,
                conversation_history=updated_history
            )

        except Exception as e:
            logger.error(f"Unified AI chat error: {e}")
            logger.error(traceback.format_exc())

            return ChatResponse(
                response="I'm experiencing some technical difficulties. Please try again in a moment.",
                conversation_history=request.conversation_history
            )

    async def generate_intelligent_meal_plan(self, user_id: str, plan_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a comprehensive meal plan using AI with full user context
        """
        try:
            user_context = await self._get_comprehensive_user_context(user_id)
            
            # Enforce maximum duration limit of 3 days
            requested_duration = plan_request.get('duration', 7)
            max_duration = 3
            actual_duration = min(requested_duration, max_duration)
            
            if requested_duration > max_duration:
                logger.warning(f"Duration limited from {requested_duration} to {max_duration} days")
            
            prompt = f"""
            Create a comprehensive {actual_duration}-day meal plan for this user:

            USER PROFILE:
            {self._format_user_context_for_ai(user_context)}

            PLAN REQUIREMENTS:
            - Plan Name: "{plan_request.get('name', 'My Meal Plan')}" (MUST be preserved in response)
            - Duration: {actual_duration} days (maximum allowed)
            - Meals per day: {plan_request.get('meals_per_day', 3)}
            - Budget preference: {plan_request.get('budget', 'moderate')}
            - Prep time preference: {plan_request.get('prep_time', 'moderate')}
            - Variety level: {plan_request.get('variety', 'high')}

            SPECIAL REQUESTS:
            {plan_request.get('special_requests', 'None')}

            Generate a detailed meal plan with:
            1. Plan name exactly as specified: "{plan_request.get('name', 'My Meal Plan')}"
            2. Daily meal suggestions with exact portions
            3. Shopping list organized by category
            4. Prep instructions and timeline
            5. Nutritional breakdown per day
            6. Goal alignment analysis

            CRITICAL: The JSON response MUST include "name": "{plan_request.get('name', 'My Meal Plan')}" as the first field.
            """

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=20000,  # Maximum allowed tokens for claude-sonnet-4-20250514 (64k limit)
                messages=[{"role": "user", "content": prompt}]
            )

            meal_plan_data = self._parse_json_response(response.content[0].text)

            # Store meal plan in database
            await self._store_meal_plan(user_id, meal_plan_data)

            return meal_plan_data

        except Exception as e:
            logger.error(f"Error generating meal plan: {e}")
            raise e

    async def get_health_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Generate comprehensive health insights using AI analysis
        """
        try:
            user_context = await self._get_comprehensive_user_context(user_id)

            # Analyze user data patterns
            nutrition_analysis = await self._analyze_nutrition_patterns(user_id)
            behavioral_analysis = await self._analyze_behavioral_patterns(user_id)
            goal_progress = await self._analyze_goal_progress(user_id)

            prompt = f"""
            As an expert AI health coach, provide comprehensive health insights for this user:

            USER PROFILE:
            {self._format_user_context_for_ai(user_context)}

            NUTRITION ANALYSIS:
            {json.dumps(nutrition_analysis, indent=2)}

            BEHAVIORAL PATTERNS:
            {json.dumps(behavioral_analysis, indent=2)}

            GOAL PROGRESS:
            {json.dumps(goal_progress, indent=2)}

            Provide detailed insights in this exact JSON format:
            {{
                "health_score": 75,
                "health_score_explanation": "Your overall health score reflects consistent nutrition tracking with room for improvement in meal variety and exercise consistency.",
                "strengths": [
                    "Consistent food logging shows strong engagement",
                    "Meeting protein goals most days",
                    "Good hydration habits"
                ],
                "areas_for_improvement": [
                    "Increase vegetable intake to 5+ servings daily",
                    "Reduce processed food consumption",
                    "Improve meal timing consistency"
                ],
                "personalized_recommendations": [
                    {{
                        "category": "nutrition",
                        "title": "Boost Vegetable Intake",
                        "description": "Add one serving of vegetables to each meal",
                        "priority": "high",
                        "expected_benefit": "Improved fiber intake and micronutrient density"
                    }},
                    {{
                        "category": "behavior",
                        "title": "Meal Prep Sunday",
                        "description": "Prepare 3-4 meals in advance each week",
                        "priority": "medium",
                        "expected_benefit": "Better portion control and consistent nutrition"
                    }}
                ],
                "progress_predictions": {{
                    "next_30_days": "With current trends, expect to see 15% improvement in nutrition consistency and potential 2-3lb weight progress toward goals",
                    "confidence": "medium"
                }},
                "risk_factors": [
                    "Low fiber intake may impact digestive health",
                    "Irregular meal timing could affect metabolism"
                ],
                "achievements": [
                    "Logged food 20+ days this month",
                    "Met protein goals 18 out of 30 days",
                    "Tried 3 new healthy recipes"
                ],
                "motivational_message": "You're building excellent tracking habits! Small consistent improvements in vegetable intake will compound into significant health benefits."
            }}

            Provide specific, actionable insights based on the user's actual data. Return only the JSON object.
            """

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}]
            )

            insights = self._parse_json_response(response.content[0].text)

            # Validate the response structure
            if not isinstance(insights, dict) or "health_score" not in insights:
                logger.warning("AI response missing required fields, using fallback")
                insights = self._create_fallback_insights(nutrition_analysis, behavioral_analysis, goal_progress)

            # Store insights for tracking
            await self._store_health_insights(user_id, insights)

            return insights

        except Exception as e:
            logger.error(f"Error generating health insights: {e}")
            # Return a meaningful fallback response instead of error
            return self._create_fallback_insights({}, {}, {})

    async def process_food_operations(self, message: str, user_id: str) -> str:
        """
        Process food-related operations embedded in user messages
        """
        try:
            operations_performed = []

            # Check for food logging operation
            log_match = re.search(r"LOG_FOOD:\s*({.*?})", message, re.DOTALL)
            if log_match:
                try:
                    food_data = json.loads(log_match.group(1))
                    result = await self._log_food_item(user_id, food_data)
                    operations_performed.append(f"✅ Logged {food_data.get('name', 'food item')}")
                except Exception as e:
                    operations_performed.append(f"❌ Failed to log food: {str(e)}")

            # Check for meal suggestion request
            suggest_match = re.search(r"SUGGEST_MEAL:\s*({.*?})", message, re.DOTALL)
            if suggest_match:
                try:
                    criteria = json.loads(suggest_match.group(1))
                    suggestions = await self._get_meal_suggestions(user_id, criteria)
                    operations_performed.append(f"🍽️ Generated {len(suggestions)} meal suggestions")
                except Exception as e:
                    operations_performed.append(f"❌ Failed to suggest meals: {str(e)}")

            # Check for nutrition analysis request
            analyze_match = re.search(r"ANALYZE_NUTRITION:\s*(\d+)", message)
            if analyze_match:
                try:
                    days = int(analyze_match.group(1))
                    analysis = await self._analyze_recent_nutrition(user_id, days)
                    operations_performed.append(f"📊 Analyzed nutrition for past {days} days")
                except Exception as e:
                    operations_performed.append(f"❌ Failed to analyze nutrition: {str(e)}")

            return "\n".join(operations_performed) if operations_performed else ""

        except Exception as e:
            logger.error(f"Error processing food operations: {e}")
            return "❌ Error processing operations"

    async def _get_comprehensive_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user context for AI personalization"""
        try:
            context = {}

            # Get user profile including personal information
            from ..services.user_service import user_service
            user_profile = await user_service.get_user_profile(user_id)
            if user_profile:
                context["profile"] = {
                    "name": user_profile.get("name", ""),
                    "about_me": user_profile.get("about_me", ""),
                    "age": user_profile.get("age"),
                    "gender": user_profile.get("gender"),
                    "activity_level": user_profile.get("activity_level"),
                    "height": user_profile.get("height"),
                    "current_weight": user_profile.get("current_weight")
                }

            # Current goals
            goals = list(self.db.goals.find({"user_id": user_id, "active": True}))
            context["goals"] = goals
            context["active_goals"] = goals  # Add this for easier access

            # Dietary preferences and restrictions
            # Get preferences from users.preferences.dietary
            preferences = None

            # Get user document from users collection (this is the correct location)
            user_doc = self.db.users.find_one({"uid": user_id})

            if user_doc and user_doc.get("preferences") and user_doc["preferences"].get("dietary"):
                preferences = user_doc["preferences"]["dietary"]
            else:
                # Set default preferences if none found
                preferences = {
                    "dietary_restrictions": [],
                    "allergens": [],
                    "disliked_foods": [],
                    "preferred_cuisines": [],
                    "cooking_skill_level": "intermediate",
                    "max_prep_time": 30,
                    "budget_preference": "moderate",
                    "strictness_level": "moderate"
                }

            context["dietary_preferences"] = preferences

            # Recent nutrition data (last 7 days)
            recent_logs = await self._get_recent_food_logs(user_id, 7)
            context["recent_nutrition"] = self._summarize_nutrition_data(recent_logs)
            context["recent_food_logs"] = recent_logs  # Add this for AI analysis

            # Health metrics
            weight_logs = list(self.db.weight_logs.find(
                {"user_id": user_id}
            ).sort("date", -1).limit(30))
            context["weight_trend"] = self._analyze_weight_trend(weight_logs)

            # Behavioral patterns
            context["eating_patterns"] = await self._analyze_eating_patterns(user_id)

            return context

        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}

    async def get_food_index_summary(self, user_id: str, limit: int = 50) -> str:
        """Get a comprehensive summary of the user's food index items"""
        try:
            # Use the food service to get user's food index (same as /foods/search endpoint)
            user_foods = await self.food_service.get_user_food_index(user_id)
            logger.info(f"Found {len(user_foods)} foods for user {user_id}")

            if not user_foods or len(user_foods) == 0:
                # Check the main food index if user doesn't have personal foods
                from ..models.food import FoodSearch
                search_params = FoodSearch(q="", limit=15, skip=0)
                general_foods = await self.food_service.search_food_items(search_params)

                if not general_foods:
                    return "Your food index is empty. To build your personal food index, start logging foods you eat regularly."

                # Format foods from main index  
                foods_summary = f"**Your Personal Food Index: Empty (0 foods)**\n"
                foods_summary += f"Here are {min(len(general_foods), 15)} foods from the main database that you can add:\n\n"
                
                # Group by category
                categories = {}
                for food in general_foods[:15]:
                    category = food.dietary_attributes.food_categories[0] if food.dietary_attributes.food_categories else "Other"
                    if category not in categories:
                        categories[category] = []
                    categories[category].append(food.name)
                
                for category, food_names in categories.items():
                    foods_summary += f"**{category.title()}:**\n"
                    for name in food_names[:5]:  # Limit per category
                        foods_summary += f"  • {name}\n"
                    foods_summary += "\n"

                foods_summary += "**To build your personal food index:** Log foods you eat regularly using the food logging feature."
                return foods_summary

            # Format user foods with comprehensive details including nutrition
            foods_summary = f"**Your Personal Food Index: {len(user_foods)} foods**\n\n"
            
            # Group foods by category with detailed nutrition info
            categories = {}
            total_logged = 0
            recent_additions = []
            high_protein_foods = []
            low_calorie_foods = []
            vegan_foods = []
            
            for food in user_foods:
                # Get category from dietary attributes if available
                category = "Other"
                if isinstance(food, dict):
                    food_categories = food.get("dietary_attributes", {}).get("food_categories", [])
                    if food_categories:
                        category = food_categories[0].title()
                    
                    name = food.get("name", "Unknown food")
                    times_logged = food.get("times_logged", 0)
                    date_added = food.get("date_added", None)
                    
                    # Extract nutritional information
                    nutrition = food.get("nutrition", {})
                    calories = nutrition.get("calories", 0)
                    protein = nutrition.get("protein", 0)
                    
                    # Calculate per 100g values for comparison
                    serving_size = food.get("serving_size", 1)
                    serving_unit = food.get("serving_unit", "serving")
                    
                    # Rough conversion to 100g equivalent (simplified)
                    calories_per_100g = calories * 2 if serving_unit in ["tbsp", "tablespoon"] else calories
                    protein_per_100g = protein * 2 if serving_unit in ["tbsp", "tablespoon"] else protein
                    
                    # Extract dietary attributes
                    dietary_attributes = food.get("dietary_attributes", {})
                    restrictions = dietary_attributes.get("dietary_restrictions", [])
                    is_vegan = "vegan" in [r.lower() for r in restrictions] if restrictions else False
                else:
                    # Handle FoodItemResponse objects
                    food_categories = food.dietary_attributes.food_categories if food.dietary_attributes else []
                    if food_categories:
                        category = food_categories[0].title()
                    
                    name = food.name
                    times_logged = 0  # Not available in this format
                    date_added = None
                    
                    nutrition = food.nutrition
                    calories = nutrition.calories
                    protein = nutrition.protein
                    calories_per_100g = calories
                    protein_per_100g = protein
                    
                    restrictions = food.dietary_attributes.dietary_restrictions if food.dietary_attributes else []
                    is_vegan = "vegan" in [r.lower() for r in restrictions] if restrictions else False

                if category not in categories:
                    categories[category] = []
                
                food_info = {
                    "name": name,
                    "times_logged": times_logged,
                    "date_added": date_added,
                    "calories": calories,
                    "protein": protein,
                    "calories_per_100g": calories_per_100g,
                    "protein_per_100g": protein_per_100g,
                    "dietary_restrictions": restrictions,
                    "is_vegan": is_vegan
                }
                
                categories[category].append(food_info)
                total_logged += times_logged
                
                # Categorize foods for quick reference
                if protein >= 15:  # High protein threshold
                    high_protein_foods.append(f"{name} ({protein}g protein)")
                    
                if calories > 0 and calories <= 100:  # Low calorie threshold
                    low_calorie_foods.append(f"{name} ({calories} cal)")
                    
                if is_vegan:
                    vegan_foods.append(name)
                
                # Track recent additions (last 7 days)
                if isinstance(date_added, datetime):
                    days_ago = (datetime.utcnow() - date_added).days
                    if days_ago <= 7:
                        recent_additions.append(name)

            # Display by category with nutrition info
            for category, food_list in categories.items():
                foods_summary += f"**{category} ({len(food_list)} foods):**\n"
                # Sort by times logged (most used first)
                food_list.sort(key=lambda x: x["times_logged"], reverse=True)
                
                for food in food_list[:6]:  # Show top 6 per category to save space
                    times_text = f" (used {food['times_logged']}x)" if food['times_logged'] > 0 else ""
                    
                    # Add nutrition info if available
                    nutrition_info = ""
                    if food['protein'] > 0:
                        nutrition_info += f" | {food['protein']}g protein"
                    if food['calories'] > 0:
                        nutrition_info += f" | {food['calories']} cal"
                    if food['dietary_restrictions']:
                        nutrition_info += f" | {', '.join(food['dietary_restrictions'][:2])}"  # Show first 2 restrictions
                    
                    foods_summary += f"  • **{food['name']}**{times_text}{nutrition_info}\n"
                
                if len(food_list) > 6:
                    foods_summary += f"  ... and {len(food_list) - 6} more\n"
                foods_summary += "\n"

            # Add quick reference sections for common queries
            foods_summary += f"**Quick Reference for AI Queries:**\n"
            
            if high_protein_foods:
                foods_summary += f"**High Protein Foods (15g+):** {', '.join(high_protein_foods[:5])}\n"
                if len(high_protein_foods) > 5:
                    foods_summary += f"  ... and {len(high_protein_foods) - 5} more high protein options\n"
            
            if low_calorie_foods:
                foods_summary += f"**Low Calorie Foods (≤100 cal):** {', '.join(low_calorie_foods[:5])}\n"
                if len(low_calorie_foods) > 5:
                    foods_summary += f"  ... and {len(low_calorie_foods) - 5} more low calorie options\n"
            
            if vegan_foods:
                foods_summary += f"**Vegan Foods:** {', '.join(vegan_foods[:5])}\n"
                if len(vegan_foods) > 5:
                    foods_summary += f"  ... and {len(vegan_foods) - 5} more vegan options\n"
            
            foods_summary += f"\n"

            # Add summary stats
            foods_summary += f"**Summary Stats:**\n"
            foods_summary += f"  • Total foods in index: {len(user_foods)}\n"
            foods_summary += f"  • Total times logged: {total_logged}\n"
            foods_summary += f"  • High protein foods: {len(high_protein_foods)}\n"
            foods_summary += f"  • Low calorie foods: {len(low_calorie_foods)}\n"
            foods_summary += f"  • Vegan foods: {len(vegan_foods)}\n"
            
            if recent_additions:
                foods_summary += f"  • Recently added: {', '.join(recent_additions[:3])}\n"
            
            foods_summary += f"\n*Note: This data includes all nutritional attributes and dietary information for intelligent AI responses.*"
            
            return foods_summary

        except Exception as e:
            logger.error(f"Error getting food index summary: {e}")
            return f"Unable to retrieve food index data. Error: {str(e)}"

    async def _build_contextual_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Build a personalized system prompt based on user context"""

        base_prompt = """You are Nutrivize AI, an advanced nutrition and wellness coach with comprehensive food and meal management capabilities. You can help users with ALL aspects of their nutrition journey through natural conversation.

🍎 CORE CAPABILITIES:
- **Meal Planning**: Create personalized weekly/daily meal plans
- **Food Operations**: Search, index, and log foods 
- **Smart Suggestions**: Recommend meals based on goals and preferences
- **Data Management**: Store and retrieve meal plans, food logs, and preferences
- **Insights & Analytics**: Provide trends, progress tracking, and personalized insights
- **Interactive Planning**: Ask follow-up questions to refine recommendations
- **Food Index Queries**: Interactive exploration of user's personal food database

📊 RESPONSE GUIDELINES FOR DIRECT QUERIES:
When users ask direct questions like "what's in my food index", "show me my recent meals", or "how many calories should I eat":
- Keep responses CONCISE (under 300 characters for simple questions)
- Provide DIRECT, ORGANIZED answers without extra commentary
- Use the available data in the context below
- Format information clearly and briefly
- Don't add motivational text or lengthy explanations unless specifically asked for advice
- For calorie questions: give the number and a brief reason, nothing more

🔍 FOOD INDEX INTERACTION PROTOCOL:
When users ask about their food index (e.g., "What foods in my food index are high in protein?"):

**1. UNDERSTAND THE QUERY:**
- Identify the specific criteria (high protein, vegan, low calorie, etc.)
- Determine if they want a specific count or general exploration

**2. ASK CLARIFYING QUESTIONS (if needed):**
- "How many foods would you like to see? (max 5 to keep responses focused)"
- "Are you looking for foods above a certain protein threshold?"
- "Would you like me to include nutrition info for each food?"
- "Are you planning meals or just exploring your options?"

**3. PROVIDE INTERACTIVE RESPONSES:**
- Use **bold**, *italics*, and bullet points for clear formatting
- Include relevant nutrition data when helpful
- Offer follow-up suggestions
- Remember previous answers in the conversation

**4. RESPONSE FORMATTING:**
- Use **bold** for food names and important numbers
- Use *italics* for categories and descriptive text
- Use bullet points (•) for lists
- Use line breaks for readability
- Include page breaks (---) for long responses
- Add relevant emojis for visual appeal

**EXAMPLE FOOD INDEX INTERACTION:**
User: "What foods in my food index are high in protein?"
AI: "I'll help you find high-protein foods from your personal food index! 

Quick question: **How many foods would you like to see?** (max 5 for focused results)

Also, what protein level are you targeting? 
• *High protein*: 15g+ per serving
• *Very high protein*: 25g+ per serving"

**SESSION HISTORY & CONTEXT AWARENESS:**
- ALWAYS remember previous questions and answers in the conversation
- Reference earlier requests: "As we discussed earlier..." or "Building on your previous question..."
- Maintain context across multiple food index queries
- Suggest related follow-ups based on conversation history

🤖 SMART OPERATIONS - You can perform these actions by including operation markers:

**MEAL PLAN CREATION:**
- Use `AI_CREATE_MEAL_PLAN: {json_data}` to create and save meal plans
- Always ask clarifying questions before creating (preferences, restrictions, timeframe)
- Confirm the plan with user before saving

**FOOD OPERATIONS:**
- Use `AI_LOG_FOOD: {food_data}` to log foods for the user
- Use `AI_SEARCH_FOODS: {search_terms}` to search the food database
- Use `AI_INDEX_FOOD: {food_data}` to add new foods to the database

**DATA MANAGEMENT:**
- Use `AI_SAVE_PREFERENCES: {preferences}` to save dietary preferences
- Use `AI_UPDATE_GOAL: {goal_data}` to update user goals
- Use `AI_SEARCH_USER_LOGS: {criteria}` to search user's food history

**CONVERSATION FLOW:**
1. **Gather Information**: Ask follow-up questions to understand user needs
2. **Confirm Details**: Repeat back plans/suggestions for user approval
3. **Execute Actions**: Use operation markers to perform database operations
4. **Provide Feedback**: Confirm success and offer next steps

**CRITICAL QUESTIONS FOR MEAL PLANNING:**
When creating meal plans or suggestions, ALWAYS ask about:
- Dietary restrictions and allergies
- Cuisine preferences
- Prep time availability
- **FOOD INDEX PREFERENCE**: "Would you like me to only use foods from your personal food index? This creates more realistic nutrition results using foods you've already logged, but I can assume you have basic pantry staples like oil, salt, and spices."

**EXAMPLE INTERACTIONS:**
User: "I want to create a meal plan"
You: "I'd love to help you create a personalized meal plan! Let me ask a few questions:
- How many days would you like to plan for?
- Any specific goals (weight loss, muscle gain, maintenance)?
- Foods you love or want to avoid?
- Any dietary restrictions or allergies?
- How much time do you typically have for meal prep?
- Would you like me to only use foods from your personal food index for more realistic results?"

RESPONSE STYLE:
- Be conversational, encouraging, and thorough
- Always ask clarifying questions for meal planning
- Confirm plans before executing database operations
- Provide specific, actionable advice
- Use operation markers when performing actions
- Celebrate progress and address challenges positively"""

        # Add user-specific context
        profile = user_context.get("profile", {})

        # Add personal greeting if name is available
        if profile.get("name"):
            base_prompt += f"\n\nUSER'S NAME: {profile['name']} (address them by name when appropriate)"

        # Add personal context if available
        if profile.get("about_me"):
            base_prompt += f"\nUSER BACKGROUND: {profile['about_me']} (use this to personalize advice and recommendations)"

        if user_context.get("goals"):
            goals_text = ", ".join([goal.get("type", "general health") for goal in user_context["goals"]])
            base_prompt += f"\n\nUSER GOALS: {goals_text}"

        if user_context.get("dietary_preferences"):
            prefs = user_context["dietary_preferences"]
            if prefs.get("dietary_restrictions"):
                base_prompt += f"\nDIETARY RESTRICTIONS: {', '.join(prefs['dietary_restrictions'])}"
            if prefs.get("allergens"):
                base_prompt += f"\nALLERGIES: {', '.join(prefs['allergens'])}"
            if prefs.get("disliked_foods"):
                base_prompt += f"\nFOODS TO AVOID: {', '.join(prefs['disliked_foods'])}"

        if user_context.get("recent_nutrition"):
            nutrition = user_context["recent_nutrition"]
            base_prompt += f"\nRECENT NUTRITION PATTERNS: Average daily calories: {nutrition.get('avg_calories', 'unknown')}, protein: {nutrition.get('avg_protein', 'unknown')}g"

        # Add food index information for food-related queries
        if user_context.get("food_index_summary"):
            base_prompt += f"\n\n📋 USER'S PERSONAL FOOD INDEX:\n{user_context['food_index_summary']}"
            base_prompt += f"\n\n**FOOD INDEX QUERY GUIDELINES:**"
            base_prompt += f"\n- Use the food index data above to answer questions about user's available foods"
            base_prompt += f"\n- All food attributes (protein, calories, dietary restrictions, etc.) are available"
            base_prompt += f"\n- Ask clarifying questions to provide exactly what the user needs"
            base_prompt += f"\n- Format responses with bullet points, bold text, and clear organization"
            base_prompt += f"\n- Remember conversation context for follow-up questions"
            base_prompt += f"\n- Limit food recommendations to max 5 items unless user specifies otherwise"

        return base_prompt

    async def _process_smart_operations(self, request: ChatRequest, user_id: str, context: Dict[str, Any]) -> tuple:
        """Process smart operations embedded in user messages"""
        operations_results = []
        message_lower = request.message.lower()

        # Meal Plan Creation Intent
        if any(keyword in message_lower for keyword in ["meal plan", "weekly plan", "daily plan", "plan my meals"]):
            operations_results.append("🍽️ Meal planning mode activated - I'll help you create a personalized plan")

        # Food Search Intent
        if any(keyword in message_lower for keyword in ["search for", "find food", "look up", "what foods"]):
            operations_results.append("🔍 Food search mode activated - I can help you find foods in our database")

        # Food Logging Intent
        if any(keyword in message_lower for keyword in ["ate", "had", "consumed", "log this", "i just ate"]):
            food_items = await self._extract_food_items_from_text(request.message)
            for item in food_items:
                try:
                    result = await self._smart_food_log(user_id, item)
                    operations_results.append(result)
                except Exception as e:
                    logger.error(f"Smart food logging error: {e}")

        # Insights and Trends Intent  
        if any(keyword in message_lower for keyword in ["insights", "trends", "progress", "how am i doing", "analysis"]):
            operations_results.append("📊 Analytics mode activated - I'll analyze your nutrition patterns")

        # Goal Setting Intent
        if any(keyword in message_lower for keyword in ["goal", "target", "want to lose", "want to gain", "objective"]):
            operations_results.append("🎯 Goal setting mode activated - I'll help optimize your nutrition goals")

        return request, "\n".join(operations_results) if operations_results else ""

    async def _process_ai_operations(self, response: str, user_id: str, context: Dict[str, Any]) -> str:
        """Process AI-initiated operations in responses"""
        # Look for operation markers in AI response

        # AI-initiated meal plan creation
        meal_plan_match = re.search(r"AI_CREATE_MEAL_PLAN:\s*({.*?})", response, re.DOTALL)
        if meal_plan_match:
            try:
                meal_plan_data = json.loads(meal_plan_match.group(1))
                await self._create_meal_plan(user_id, meal_plan_data)
                response = response.replace(meal_plan_match.group(0), "✅ I've created your meal plan and saved it!")
            except Exception as e:
                response = response.replace(meal_plan_match.group(0), f"❌ Couldn't create meal plan: {str(e)}")

        # AI-initiated food logging
        log_match = re.search(r"AI_LOG_FOOD:\s*({.*?})", response, re.DOTALL)
        if log_match:
            try:
                food_data = json.loads(log_match.group(1))
                await self._log_food_item(user_id, food_data)
                response = response.replace(log_match.group(0), "✅ I've logged that food for you!")
            except Exception as e:
                response = response.replace(log_match.group(0), f"❌ Couldn't log food: {str(e)}")

        # AI-initiated food search
        search_match = re.search(r"AI_SEARCH_FOODS:\s*({.*?})", response, re.DOTALL)
        if search_match:
            try:
                search_data = json.loads(search_match.group(1))
                search_results = await self._search_foods(search_data.get("query", ""))
                response = response.replace(search_match.group(0), f"🔍 Found {len(search_results)} matching foods")
            except Exception as e:
                response = response.replace(search_match.group(0), f"❌ Couldn't search foods: {str(e)}")

        # AI-initiated food indexing
        index_match = re.search(r"AI_INDEX_FOOD:\s*({.*?})", response, re.DOTALL)
        if index_match:
            try:
                food_data = json.loads(index_match.group(1))
                await self._index_new_food(food_data)
                response = response.replace(index_match.group(0), "✅ I've added that food to our database!")
            except Exception as e:
                response = response.replace(index_match.group(0), f"❌ Couldn't index food: {str(e)}")

        # AI-initiated goal updates
        goal_match = re.search(r"AI_UPDATE_GOALS:\s*({.*?})", response, re.DOTALL)
        if goal_match:
            try:
                goal_data = json.loads(goal_match.group(1))
                await self._update_user_goals(user_id, goal_data)
                response = response.replace(goal_match.group(0), "✅ I've updated your goals!")
            except Exception as e:
                response = response.replace(goal_match.group(0), f"❌ Couldn't update goals: {str(e)}")

        # AI-initiated disliked food detection and addition
        await self._detect_and_add_disliked_foods(response, user_id)

        return response

    # =============================================================================
    # AI OPERATION HELPER METHODS
    # =============================================================================

    async def _create_meal_plan(self, user_id: str, meal_plan_data: Dict[str, Any]) -> str:
        """Create and save a meal plan to MongoDB"""
        try:
            meal_plan = {
                "user_id": user_id,
                "name": meal_plan_data.get("name", "AI Generated Meal Plan"),
                "type": meal_plan_data.get("type", "weekly"),
                "meals": meal_plan_data.get("meals", []),
                "nutrition_summary": meal_plan_data.get("nutrition_summary", {}),
                "preferences": meal_plan_data.get("preferences", {}),
                "created_at": datetime.utcnow(),
                "is_active": True
            }

            result = self.db.meal_plans.insert_one(meal_plan)
            return f"Meal plan created with ID: {result.inserted_id}"
        except Exception as e:
            logger.error(f"Error creating meal plan: {e}")
            raise e

    async def _log_food_item(self, user_id: str, food_data: Dict[str, Any]) -> str:
        """Log a food item to the user's food logs"""
        try:
            today = date.today()
            food_log = {
                "user_id": user_id,
                "date": today.isoformat(),
                "food_name": food_data.get("name", "Unknown Food"),
                "amount": food_data.get("amount", 1.0),
                "unit": food_data.get("unit", "serving"),
                "meal_type": food_data.get("meal_type", "snack"),
                "nutrition": food_data.get("nutrition", {}),
                "notes": food_data.get("notes", "Logged via AI"),
                "logged_at": datetime.utcnow()
            }

            result = self.db.food_logs.insert_one(food_log)
            return f"Food logged successfully: {food_log['food_name']}"
        except Exception as e:
            logger.error(f"Error logging food: {e}")
            raise e

    async def _search_foods(self, query: str) -> List[Dict[str, Any]]:
        """Search for foods in the food database"""
        try:
            # Text search in food database
            search_results = list(self.db.foods.find({
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"brand": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}}
                ]
            }).limit(10))

            # Convert ObjectIds to strings
            for food in search_results:
                food["_id"] = str(food["_id"])

            return search_results
        except Exception as e:
            logger.error(f"Error searching foods: {e}")
            return []

    async def _index_new_food(self, food_data: Dict[str, Any]) -> str:
        """Add a new food to the food database"""
        try:
            food_item = {
                "name": food_data.get("name", ""),
                "brand": food_data.get("brand", ""),
                "category": food_data.get("category", "general"),
                "nutrition_per_100g": food_data.get("nutrition_per_100g", {}),
                "serving_sizes": food_data.get("serving_sizes", []),
                "barcode": food_data.get("barcode", ""),
                "created_at": datetime.utcnow(),
                "verified": False,
                "source": "ai_indexed"
            }

            result = self.db.foods.insert_one(food_item)
            return f"Food indexed with ID: {result.inserted_id}"
        except Exception as e:
            logger.error(f"Error indexing food: {e}")
            raise e

    async def _update_user_goals(self, user_id: str, goal_data: Dict[str, Any]) -> str:
        """Update user goals"""
        try:
            goal = {
                "user_id": user_id,
                "title": goal_data.get("title", "AI Updated Goal"),
                "goal_type": goal_data.get("type", "general"),
                "nutrition_targets": goal_data.get("nutrition_targets", {}),
                "weight_target": goal_data.get("weight_target", {}),
                "start_date": goal_data.get("start_date", date.today().isoformat()),
                "end_date": goal_data.get("end_date"),
                "active": True,
                "created_at": datetime.utcnow()
            }

            # Update existing goal or create new one
            if goal_data.get("goal_id"):
                result = self.db.goals.update_one(
                    {"_id": ObjectId(goal_data["goal_id"]), "user_id": user_id},
                    {"$set": goal}
                )
                return "Goal updated successfully"
            else:
                result = self.db.goals.insert_one(goal)
                return f"Goal created with ID: {result.inserted_id}"
        except Exception as e:
            logger.error(f"Error updating goal: {e}")
            raise e

    async def _save_user_preferences(self, user_id: str, pref_data: Dict[str, Any]) -> str:
        """Save user dietary preferences"""
        try:
            preferences = {
                "user_id": user_id,
                "dietary_restrictions": pref_data.get("dietary_restrictions", []),
                "allergens": pref_data.get("allergens", []),
                "disliked_foods": pref_data.get("disliked_foods", []),
                "preferred_cuisines": pref_data.get("preferred_cuisines", []),
                "cooking_skill_level": pref_data.get("cooking_skill_level", "intermediate"),
                "max_prep_time": pref_data.get("max_prep_time", 30),
                "budget_preference": pref_data.get("budget_preference", "moderate"),
                "updated_at": datetime.utcnow()
            }

            # Upsert preferences
            result = self.db.dietary_preferences.update_one(
                {"user_id": user_id},
                {"$set": preferences},
                upsert=True
            )
            return "Preferences saved successfully"
        except Exception as e:
            logger.error(f"Error saving preferences: {e}")
            raise e

    async def _search_user_food_logs(self, user_id: str, search_criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search user's food logs based on criteria"""
        try:
            query = {"user_id": user_id}

            # Add date range filter
            if search_criteria.get("start_date"):
                query["date"] = {"$gte": search_criteria["start_date"]}
            if search_criteria.get("end_date"):
                if "date" not in query:
                    query["date"] = {}
                query["date"]["$lte"] = search_criteria["end_date"]

            # Add food name filter
            if search_criteria.get("food_name"):
                query["food_name"] = {"$regex": search_criteria["food_name"], "$options": "i"}

            # Add meal type filter
            if search_criteria.get("meal_type"):
                query["meal_type"] = search_criteria["meal_type"]

            results = list(self.db.food_logs.find(query).sort("date", -1).limit(50))

            # Convert ObjectIds to strings
            for log in results:
                log["_id"] = str(log["_id"])

            return results
        except Exception as e:
            logger.error(f"Error searching user logs: {e}")
            return []

    def _clean_data_for_json(self, data: Any) -> Any:
        """Clean MongoDB data by converting ObjectIds and datetime objects to strings"""
        if isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, datetime):
            return data.isoformat()
        elif isinstance(data, date):
            return data.isoformat()
        elif isinstance(data, dict):
            return {key: self._clean_data_for_json(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._clean_data_for_json(item) for item in data]
        else:
            return data

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from AI response with error handling"""
        try:
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # If no JSON found, create a basic structure
                return {"response": response_text}
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {"response": response_text, "error": "Could not parse JSON"}

    def _format_user_context_for_ai(self, context: Dict[str, Any]) -> str:
        """Format user context for AI consumption"""
        formatted = []

        if context.get("profile"):
            profile = context["profile"]
            formatted.append(f"Profile: {profile.get('age', 'unknown')} years old, {profile.get('gender', 'unknown')}, {profile.get('activity_level', 'unknown')} activity level")

        if context.get("goals"):
            goals = [goal.get("type", "general") for goal in context["goals"]]
            formatted.append(f"Goals: {', '.join(goals)}")

        if context.get("dietary_preferences"):
            prefs = context["dietary_preferences"]

            # Make dietary restrictions very prominent with strictness level
            if prefs.get("dietary_restrictions"):
                strictness = prefs.get("strictness_level", "moderate")
                dietary_list = ', '.join(prefs['dietary_restrictions'])

                if strictness == "strict":
                    formatted.append(f"CRITICAL DIETARY RESTRICTIONS ({strictness.upper()}): {dietary_list} - ABSOLUTELY NO EXCEPTIONS ALLOWED")
                elif strictness == "moderate":
                    formatted.append(f"IMPORTANT DIETARY RESTRICTIONS ({strictness}): {dietary_list} - Must be respected with occasional flexibility")
                else:  # flexible/light
                    formatted.append(f"DIETARY PREFERENCES ({strictness}): {dietary_list} - Generally preferred but some flexibility allowed")

            # Handle allergens with high priority
            if prefs.get("allergens"):
                allergen_list = ', '.join(prefs['allergens'])
                formatted.append(f"CRITICAL ALLERGENS - NEVER INCLUDE: {allergen_list}")

            # Foods to avoid
            if prefs.get("disliked_foods"):
                disliked_list = ', '.join(prefs['disliked_foods'])
                formatted.append(f"Foods to avoid: {disliked_list}")

            # Preferred cuisines
            if prefs.get("preferred_cuisines"):
                cuisine_list = ', '.join(prefs['preferred_cuisines'])
                formatted.append(f"Preferred cuisines: {cuisine_list}")

        return "\n".join(formatted)

    async def _get_recent_food_logs(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Get recent food logs for analysis"""
        start_date = (datetime.now() - timedelta(days=days)).date()
        return list(self.db.food_logs.find({
            "user_id": user_id,
            "date": {"$gte": start_date.isoformat()}
        }).sort("date", -1))

    def _summarize_nutrition_data(self, food_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize nutrition data from food logs"""
        total_calories = sum(log.get("nutrition", {}).get("calories", 0) for log in food_logs)
        total_protein = sum(log.get("nutrition", {}).get("protein", 0) for log in food_logs)
        total_carbs = sum(log.get("nutrition", {}).get("carbs", 0) for log in food_logs)
        total_fat = sum(log.get("nutrition", {}).get("fat", 0) for log in food_logs)

        days = len(food_logs) if food_logs else 1;

        return {
            "total_calories": total_calories,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat,
            "avg_calories": total_calories / days,
            "avg_protein": total_protein / days,
            "avg_carbs": total_carbs / days,
            "avg_fat": total_fat / days,
            "total_days": days
        }

    def _analyze_weight_trend(self, weight_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze weight trend from weight log data"""
        if not weight_logs or len(weight_logs) < 2:
            return {
                "trend": "insufficient_data",
                "change": 0.0,
                "direction": "stable",
                "latest_weight": weight_logs[0].get("weight", 0.0) if weight_logs else 0.0,
                "data_points": len(weight_logs)
            }

        # Sort by date (most recent first)
        sorted_logs = sorted(weight_logs, key=lambda x: x.get("date", ""), reverse=True)

        latest_weight = sorted_logs[0].get("weight", 0.0)
        oldest_weight = sorted_logs[-1].get("weight", 0.0)

        weight_change = latest_weight - oldest_weight
        percent_change = (weight_change / oldest_weight * 100) if oldest_weight > 0 else 0.0;

        # Determine trend direction
        if abs(weight_change) < 0.5:  # Less than 0.5 kg change
            direction = "stable"
            trend = "maintaining"
        elif weight_change > 0:
            direction = "up"
            trend = "gaining"
        else:
            direction = "down"
            trend = "losing"

        # Calculate weekly average change if we have enough data
        weekly_change = 0.0
        if len(sorted_logs) >= 7:
            recent_week = sorted_logs[:7]
            week_start = recent_week[-1].get("weight", 0.0)
            week_end = recent_week[0].get("weight", 0.0)
            weekly_change = week_end - week_start

        return {
            "trend": trend,
            "change": round(weight_change, 2),
            "percent_change": round(percent_change, 2),
            "direction": direction,
            "latest_weight": latest_weight,
            "weekly_change": round(weekly_change, 2),
            "data_points": len(weight_logs),
            "time_period_days": len(sorted_logs)
        }

    async def _analyze_eating_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze eating patterns from food log data"""
        try:
            # Get recent food logs (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            food_logs = list(self.db.food_logs.find({
                "user_id": user_id,
                "date": {"$gte": thirty_days_ago.strftime("%Y-%m-%d")}
            }).sort("date", -1))

            if not food_logs:
                return {
                    "pattern": "insufficient_data",
                    "meal_frequency": 0,
                    "most_common_meal_time": "unknown",
                    "consistency_score": 0.0,
                    "data_points": 0
                }

            # Analyze meal timing patterns
            meal_times = []
            meal_counts = {"breakfast": 0, "lunch": 0, "dinner": 0, "snack": 0}

            for log in food_logs:
                meal_type = log.get("meal_type", "snack").lower()
                if meal_type in meal_counts:
                    meal_counts[meal_type] += 1

                # Extract meal timing if available
                logged_at = log.get("logged_at")
                if logged_at:
                    if isinstance(logged_at, str):
                        try:
                            logged_at = datetime.fromisoformat(logged_at.replace('Z', '+00:00'))
                        except:
                            continue
                    meal_times.append(logged_at.hour)

            # Find most common meal type
            most_common_meal = max(meal_counts, key=meal_counts.get) if meal_counts else "unknown"

            # Calculate meal frequency (meals per day)
            total_meals = sum(meal_counts.values())
            days_with_data = len(set(log.get("date") for log in food_logs))
            meal_frequency = total_meals / days_with_data if days_with_data > 0 else 0

            # Simple consistency score (0-1, based on regular meal timing)
            consistency_score = 0.7 if meal_frequency >= 2.5 else 0.4

            return {
                "pattern": "regular" if meal_frequency >= 3 else "irregular",
                "meal_frequency": round(meal_frequency, 1),
                "most_common_meal_time": most_common_meal,
                "meal_distribution": meal_counts,
                "consistency_score": consistency_score,
                "data_points": len(food_logs),
                "days_with_data": days_with_data
            }

        except Exception as e:
            logger.error(f"Error analyzing eating patterns: {e}")
            return {
                "pattern": "error",
                "meal_frequency": 0,
                "most_common_meal_time": "unknown", 
                "consistency_score": 0.0,
                "data_points": 0
            }

    async def get_smart_meal_suggestions(self, request: MealSuggestionRequest, user_id: str) -> MealSuggestionResponse:
        """Get AI-generated meal suggestions with enhanced user context"""
        try:
            # Get comprehensive user context
            user_context = await self._get_comprehensive_user_context(user_id)

            # Get user's food index if the filter is enabled
            user_food_index = []
            if request.use_food_index_only:
                try:
                    from ..services.food_service import FoodService
                    food_service = FoodService()
                    user_food_index = await food_service.get_user_food_index(user_id)
                except Exception as e:
                    print(f"Error getting user food index: {e}")
                    user_food_index = []

            # Build enhanced prompt with user context
            user_profile_text = self._format_user_context_for_ai(user_context)

            prompt = f"""Create 3 diverse {request.meal_type} suggestions for this user:

USER PROFILE:
{user_profile_text}

MEAL REQUIREMENTS:
- Target calories: {request.remaining_calories if request.remaining_calories else 'flexible'}
- Target protein: {request.remaining_protein if request.remaining_protein else 'moderate'}
- Dietary preferences: {', '.join(request.dietary_preferences) if request.dietary_preferences else 'none'}
- Allergies: {', '.join(request.allergies) if request.allergies else 'none'}
- Prep time preference: {request.prep_time_preference or 'moderate'}
- Main ingredients: {', '.join(request.main_ingredients) if request.main_ingredients else 'flexible'}

SPECIAL REQUESTS: {request.special_requests if request.special_requests else 'None - follow standard meal suggestion guidelines'}

CRITICAL DIETARY COMPLIANCE REQUIREMENTS:
1. CAREFULLY review the user's dietary restrictions and strictness level above
2. If user has "vegetarian" restriction: NO meat, poultry, fish, or seafood (but dairy/eggs OK)
3. If user has "vegan" restriction: NO animal products whatsoever
4. If user has allergen restrictions: NEVER include those allergens
5. STRICTNESS LEVELS:
- "strict": ZERO tolerance for violations
- "moderate": Strong preference, very rare exceptions only
- "flexible": Generally follow but some adaptation allowed
6. DOUBLE-CHECK each suggestion before including it"""

            # Add food index instructions if enabled
            if request.use_food_index_only and user_food_index:
                prompt += f"""

FOOD INDEX RESTRICTION (CRITICAL):
- ONLY use foods from the user's personal food index for main ingredients
- User's available foods: {[food.get('name', '') for food in user_food_index if food.get('name')]}
- You MAY assume the user has basic pantry staples (oil, salt, pepper, basic spices, garlic, onions, vinegar, lemon/lime juice)
- For main ingredients (proteins, grains, vegetables, fruits), ONLY use items from the food index above
- This provides realistic nutrition results using foods the user has already logged"""
            elif request.use_food_index_only and not user_food_index:
                prompt += f"""

FOOD INDEX RESTRICTION (CRITICAL):
- User requested to use only their food index, but no foods found in their index
- Please create meal suggestions with basic, common foods and suggest they log more foods to build their personal food index
- Focus on simple, whole foods that most people have access to"""

            prompt += f"""

Create diverse, creative suggestions that match their preferences and goals. Format as JSON:
{{"suggestions": [
{{
    "name": "Creative meal name",
    "description": "Brief description",
    "ingredients": [{{"name": "item", "amount": 100, "unit": "g", "calories": 50, "protein": 5, "carbs": 10, "fat": 2}}],
    "instructions": ["step1", "step2"],
    "prep_time": 15,
    "nutrition": {{"calories": 300, "protein": 25, "carbs": 30, "fat": 10}},
    "goal_alignment": "How this supports their goals"
}}
]}}"""

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse JSON response
            response_text = response.content[0].text
            suggestions_data = self._parse_json_response(response_text)

            return MealSuggestionResponse(**suggestions_data)

        except Exception as e:
            logger.error(f"Smart meal suggestions error: {e}")
            # Return fallback suggestions
            return MealSuggestionResponse(suggestions=[{
                "name": "Simple Balanced Meal",
                "description": "A nutritious fallback option",
                "ingredients": [{"name": "Protein source", "amount": 100, "unit": "g", "calories": 200, "protein": 20, "carbs": 5, "fat": 8}],
                "instructions": ["Prepare as desired"],
                "prep_time": 15,
                "nutrition": {"calories": 300, "protein": 25, "carbs": 30, "fat": 10},
                "goal_alignment": "Balanced nutrition"
            }])

    async def get_dashboard_data(self, user_id: str, data_type: str) -> Dict[str, Any]:
        """Get specific dashboard data for the AI dashboard"""
        try:
            user_context = await self._get_comprehensive_user_context(user_id)

            if data_type == "coaching":
                return await self._generate_coaching_insights(user_id, user_context)
            elif data_type == "nutrition":
                return await self._get_smart_nutrition_data(user_id, user_context)
            elif data_type == "predictions":
                return await self._generate_predictive_analytics(user_id, user_context)
            elif data_type == "health_score":
                return await self._calculate_health_score(user_id, user_context)
            else:
                return {}

        except Exception as e:
            logger.error(f"Dashboard data error for {data_type}: {e}")
            return {}

    async def _generate_coaching_insights(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI coaching insights"""
        try:
            recent_logs = context.get("recent_food_logs", [])
            goals = context.get("active_goals", [])
            nutrition_summary = context.get("recent_nutrition", {})
            weight_trend = context.get("weight_trend", {})
            eating_patterns = context.get("eating_patterns", {})
            profile = context.get("profile", {})

            # Clean all data to remove ObjectIds
            goals_clean = self._clean_data_for_json(goals)
            recent_logs_clean = self._clean_data_for_json(recent_logs[:5])
            profile_clean = self._clean_data_for_json(profile)

            # Get today's specific date for personalized daily tips
            today = datetime.now().strftime("%A, %B %d, %Y")

            prompt = f"""You are an expert AI health coach providing personalized daily insights. Today is {today}.

USER PROFILE:
{json.dumps(profile_clean, indent=2)}

ACTIVE GOALS:
{json.dumps(goals_clean, indent=2)}

RECENT NUTRITION (Last 7 days):
{json.dumps(nutrition_summary, indent=2)}

WEIGHT TREND:
{json.dumps(weight_trend, indent=2)}

EATING PATTERNS:
{json.dumps(eating_patterns, indent=2)}

RECENT MEALS (Last 5):
{json.dumps(recent_logs_clean, indent=2)}

Provide personalized coaching for TODAY ({today}):

1. A personalized insight based on their actual data and patterns
2. A specific daily health tip tailored to their current status
3. Any urgent action needed today (or null if none)
4. Weekly trend observation based on their data
5. AI confidence level (0-100) based on data quality and completeness

Make this PERSONAL and ACTIONABLE for today. Reference their actual nutrition numbers, goals, and patterns.

Format as JSON:
{{
"personalizedInsight": "Personal insight based on their actual data",
"dailyHealthTip": "Specific health tip for today based on their patterns", 
"urgentAction": "Specific action for today or null",
"weeklyTrend": "Data-driven trend observation",
"aiConfidence": 85
}}"""

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            return self._parse_json_response(response.content[0].text)

        except Exception as e:
            logger.error(f"Coaching insights error: {e}")
            return {
                "personalizedInsight": "Keep tracking your nutrition consistently for better insights!",
                "urgentAction": None,
                "weeklyTrend": "Building healthy habits",
                "aiConfidence": 75
            }

    async def _get_smart_nutrition_data(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get real-time nutrition data with AI enhancements"""
        try:
            # Get today's nutrition totals
            today = date.today()
            food_logs = list(self.db.food_logs.find({
                "user_id": user_id,
                "date": today.isoformat()
            }))

            # Calculate totals from nutrition nested in food logs
            totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
            for log in food_logs:
                nutrition = log.get("nutrition", {})
                for nutrient in totals:
                    totals[nutrient] += nutrition.get(nutrient, 0)

            # Get user's targets from active goals
            active_goals = context.get("active_goals", [])
            targets = {"calories": 2000, "protein": 150, "carbs": 250, "fat": 65, "fiber": 25}

            # Find nutrition targets from active goals
            for goal in active_goals:
                if goal.get("nutrition_targets"):
                    targets.update(goal["nutrition_targets"])
                    break

            # Calculate percentages and format response
            nutrition_data = {}
            for nutrient, current in totals.items():
                target = targets.get(nutrient, 100)
                percentage = min(100, round((current / target) * 100)) if target > 0 else 0
                nutrition_data[nutrient] = {
                    "current": current,
                    "target": target,
                    "percentage": percentage
                }

            # Add water tracking from actual water logs
            water_logs = list(self.db.water_logs.find({
                "user_id": user_id,
                "date": today.isoformat()
            }))

            # Calculate total water from logs
            total_water = sum(log.get("amount", 0) for log in water_logs)

            # Get target from preferences or use default
            water_target = 8  # Default 8 cups/64 oz
            if context.get("profile", {}).get("preferences", {}).get("nutrition", {}).get("water_target"):
                water_target = context["profile"]["preferences"]["nutrition"]["water_target"]

            # Calculate percentage
            water_percentage = min(100, round((total_water / water_target) * 100)) if water_target > 0 else 0

            nutrition_data["water"] = {
                "current": total_water,
                "target": water_target,
                "percentage": water_percentage
            }

            return nutrition_data

        except Exception as e:
            logger.error(f"Smart nutrition data error: {e}")
            return {
                "calories": {"current": 1500, "target": 2000, "percentage": 75},
                "protein": {"current": 120, "target": 150, "percentage": 80},
                "carbs": {"current": 180, "target": 250, "percentage": 72},
                "fat": {"current": 50, "target": 65, "percentage": 77},
                "fiber": {"current": 20, "target": 25, "percentage": 80},
                "water": {"current": 6, "target": 8, "percentage": 75}
            }

    async def _generate_predictive_analytics(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered predictive analytics"""
        try:
            # Analyze patterns and trends
            recent_logs = context.get("recent_food_logs", [])
            goals = context.get("goals", {})

            # Simple trend analysis (could be enhanced with ML)
            if len(recent_logs) >= 7:
                avg_calories = sum(log.get("calories", 0) for log in recent_logs[-7:]) / 7
                target_calories = goals.get("nutrition_targets", {}).get("calories", 2000)

                calorie_adherence = (avg_calories / target_calories) if target_calories > 0 else 1
                weight_trend_direction = "maintaining" if 0.95 <= calorie_adherence <= 1.05 else "losing" if calorie_adherence < 0.95 else "gaining"
            else:
                weight_trend_direction = "insufficient_data"

            return {
                "weightTrend": {
                    "direction": weight_trend_direction,
                    "rate": "0.5-1 lbs/week" if weight_trend_direction == "losing" else "stable",
                    "confidence": 85 if len(recent_logs) >= 7 else 60
                },
                "healthScore": {
                    "current": 78,
                    "predicted": 85,
                    "timeframe": "30 days"
                },
                "goals": {
                    "weightLoss": {"progress": 65, "daysRemaining": 42},
                    "muscleGain": {"progress": 32, "daysRemaining": 89}
                }
            }

        except Exception as e:
            logger.error(f"Predictive analytics error: {e}")
            return {
                "weightTrend": {"direction": "insufficient_data", "rate": "N/A", "confidence": 50},
                "healthScore": {"current": 75, "predicted": 80, "timeframe": "30 days"},
                "goals": {"weightLoss": {"progress": 50, "daysRemaining": 60}}
            }

    async def _calculate_health_score(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive health score"""
        try:
            # Get nutrition data for scoring
            nutrition_data = await self._get_smart_nutrition_data(user_id, context)

            # Calculate nutrition score (average of all percentages)
            nutrition_scores = [data["percentage"] for data in nutrition_data.values()]
            nutrition_score = sum(nutrition_scores) / len(nutrition_scores) if nutrition_scores else 75

            # Calculate consistency score (based on logging frequency)
            recent_logs = context.get("recent_food_logs", [])
            consistency_score = min(100, len(recent_logs) * 10)  # 10 points per day logged (last 10 days)

            # Overall score
            overall_score = round((nutrition_score + consistency_score) / 2)

            return {
                "overall_score": overall_score,
                "nutrition_score": round(nutrition_score),
                "consistency_score": consistency_score,
                "trend": "improving" if overall_score >= 75 else "needs_attention",
                "insights": [
                    f"Nutrition completeness: {nutrition_score:.0f}%",
                    f"Logging consistency: {consistency_score}%",
                    "Excellent progress!" if overall_score >= 80 else "Keep up the good work!" if overall_score >= 60 else "Focus on consistency"
                ]
            }

        except Exception as e:
            logger.error(f"Health score calculation error: {e}")
            return {
                "overall_score": 75,
                "nutrition_score": 75,
                "consistency_score": 75,
                "trend": "stable",
                "insights": ["Keep tracking for better insights"]
            }

    def _extract_topics(self, response: str) -> List[str]:
        """
        Extract key topics from AI response to maintain conversation context
        """
        try:
            # Common nutrition and health-related keywords to identify topics
            nutrition_keywords = [
                'protein', 'carbs', 'carbohydrates', 'fat', 'calories', 'fiber', 'vitamins', 'minerals',
                'macros', 'macronutrients', 'micronutrients', 'sodium', 'sugar', 'cholesterol'
            ]

            food_keywords = [
                'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'recipe', 'cooking', 'ingredients',
                'vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'nuts', 'seeds'
            ]

            health_keywords = [
                'weight', 'fitness', 'exercise', 'workout', 'goals', 'health', 'diet', 'nutrition',
                'calories', 'hydration', 'sleep', 'stress', 'energy', 'metabolism'
            ]

            activity_keywords = [
                'walking', 'running', 'cycling', 'swimming', 'yoga', 'strength', 'cardio',
                'steps', 'active', 'exercise', 'workout', 'training', 'sports'
            ]

            all_keywords = nutrition_keywords + food_keywords + health_keywords + activity_keywords

            # Convert response to lowercase for matching
            response_lower = response.lower()

            # Extract topics mentioned in the response
            topics = []
            for keyword in all_keywords:
                if keyword in response_lower:
                    topics.append(keyword)

            # Remove duplicates and limit to most relevant topics
            topics = list(set(topics))[:10]  # Limit to 10 most relevant topics

            # Add some contextual topics based on content patterns
            if any(word in response_lower for word in ['plan', 'planning', 'schedule', 'week']):
                topics.append('meal_planning')

            if any(word in response_lower for word in ['log', 'track', 'record', 'enter']):
                topics.append('food_logging')

            if any(word in response_lower for word in ['suggest', 'recommend', 'advice']):
                topics.append('recommendations')

            if any(word in response_lower for word in ['avoid', 'allergy', 'intolerant', 'dislike']):
                topics.append('dietary_restrictions')

            if any(word in response_lower for word in ['progress', 'achievement', 'goal', 'target']):
                topics.append('progress_tracking')

            return topics[:8]  # Return up to 8 most relevant topics

        except Exception as e:
            logger.error(f"Error extracting topics: {e}")
            return []

    async def _detect_and_add_disliked_foods(self, text: str, user_id: str) -> List[str]:
        """
        Detect when a user mentions disliking specific foods and automatically add them to preferences
        """
        try:
            # Patterns that indicate food dislikes
            dislike_patterns = [
                r"(?:i\s+)?(?:don't|do not|dont)\s+like\s+([^,.!?]+)",
                r"(?:i\s+)?(?:hate|dislike)\s+([^,.!?]+)",
                r"(?:i\s+)?(?:can't|cannot|cant)\s+(?:stand|eat)\s+([^,.!?]+)",
                r"(?:i\s+)?(?:avoid|avoiding)\s+([^,.!?]+)",
                r"(?:i\s+)?(?:am|'m)\s+(?:allergic|intolerant)\s+to\s+([^,.!?]+)",
                r"(?:please\s+)?(?:no|avoid|exclude)\s+([^,.!?]+)",
                r"(?:without|minus)\s+([^,.!?]+)"
            ]

            # Common food terms to help identify actual foods vs other things
            food_indicators = [
                'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'lobster', 'crab',
                'eggs', 'dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream',
                'nuts', 'peanuts', 'almonds', 'walnuts', 'cashews',
                'vegetables', 'broccoli', 'spinach', 'carrots', 'onions', 'garlic', 'mushrooms',
                'fruits', 'apples', 'bananas', 'oranges', 'berries', 'strawberries',
                'grains', 'wheat', 'rice', 'bread', 'pasta', 'oats',
                'beans', 'lentils', 'chickpeas', 'tofu', 'tempeh',
                'spicy', 'cilantro', 'olives', 'pickles', 'mayo', 'mayonnaise',
                'sushi', 'seafood', 'shellfish', 'gluten', 'lactose'
            ]

            detected_foods = []
            text_lower = text.lower()

            for pattern in dislike_patterns:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    food_text = match.group(1).strip()

                    # Clean up the extracted text
                    food_text = re.sub(r'\s+', ' ', food_text)  # normalize whitespace
                    food_text = food_text.rstrip('.,!?;:')  # remove trailing punctuation

                    # Check if it's likely a food (contains food indicators or common food words)
                    is_likely_food = any(indicator in food_text for indicator in food_indicators)

                    # Also accept short, simple terms that are likely foods
                    if not is_likely_food and len(food_text.split()) <= 2:
                        # Simple heuristic: if it's 1-2 words and doesn't contain obviously non-food words
                        non_food_words = ['it', 'that', 'this', 'them', 'those', 'these', 'when', 'where', 'how', 'what']
                        if not any(word in food_text for word in non_food_words):
                            is_likely_food = True

                    if is_likely_food and food_text and len(food_text) > 1:
                        detected_foods.append(food_text)

            # Add detected foods to user preferences
            added_foods = []
            if detected_foods:
                # Get current preferences
                preferences = await self._get_user_preferences(user_id)
                if not preferences:
                    preferences = {"dietary": {"disliked_foods": []}}

                if "dietary" not in preferences:
                    preferences["dietary"] = {}
                if "disliked_foods" not in preferences["dietary"]:
                    preferences["dietary"]["disliked_foods"] = []

                current_disliked = [food.lower() for food in preferences["dietary"]["disliked_foods"]]

                for food in detected_foods:
                    food_clean = food.strip().lower()
                    if food_clean not in current_disliked:
                        preferences["dietary"]["disliked_foods"].append(food_clean)
                        added_foods.append(food_clean)
                        logger.info(f"Auto-added disliked food '{food_clean}' for user {user_id}")

                # Update preferences if we added any foods
                if added_foods:
                    from ..services.user_service import user_service
                    await user_service.update_user_preferences(user_id, {
                        "dietary": {"disliked_foods": preferences["dietary"]["disliked_foods"]}
                    })

            return added_foods

        except Exception as e:
            logger.error(f"Error detecting disliked foods: {e}")
            return []

    async def _get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Helper method to get user preferences"""
        try:
            from ..services.user_service import user_service
            return await user_service.get_user_preferences(user_id)
        except Exception as e:
            logger.error(f"Error getting user preferences: {e}")
            return None

    async def _extract_food_items_from_text(self, text: str) -> List[str]:
        """
        Extract food items mentioned in text for logging
        """
        try:
            # Common food keywords and patterns
            food_patterns = [
                r'\b(ate|had|consumed|finished|enjoyed)\s+([a-zA-Z\s]+)',
                r'\b(a|an|some|the)\s+([a-zA-Z\s]+)',
                r'\b([a-zA-Z\s]+)\s+(for breakfast|for lunch|for dinner|for snack)',
            ]

            food_items = []
            text_lower = text.lower()

            # Simple extraction - look for common food words
            common_foods = [
                'apple', 'banana', 'orange', 'chicken', 'beef', 'fish', 'salmon', 'rice', 'pasta',
                'bread', 'egg', 'milk', 'cheese', 'yogurt', 'salad', 'sandwich', 'pizza',
                'burger', 'fries', 'potato', 'carrot', 'broccoli', 'spinach', 'tomato',
                'avocado', 'nuts', 'almonds', 'beans', 'quinoa', 'oats', 'cereal'
            ]

            for food in common_foods:
                if food in text_lower:
                    food_items.append(food)

            # Remove duplicates and return
            return list(set(food_items))

        except Exception as e:
            logger.error(f"Error extracting food items: {e}")
            return []

    async def get_chat_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's chat session history for display in settings"""
        try:
            if self.db is None:
                return []

            # Query chat sessions from database
            chat_collection = self.db["ai_chat_sessions"]

            # Get recent chat sessions
            sessions = list(chat_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(20))

            # Format sessions for frontend
            formatted_sessions = []
            for session in sessions:
                # Get first message as preview
                messages = session.get("messages", [])
                preview = ""
                message_count = len(messages)

                if messages:
                    # Use first user message as preview
                    for msg in messages:
                        if msg.get("role") == "user":
                            preview = msg.get("content", "")[:100] + "..." if len(msg.get("content", "")) > 100 else msg.get("content", "")
                            break

                formatted_sessions.append({
                    "id": str(session.get("_id")),
                    "created_at": session.get("created_at", datetime.utcnow().isoformat()),
                    "updated_at": session.get("updated_at", session.get("created_at", datetime.utcnow().isoformat())),
                    "message_count": message_count,
                    "preview": preview or "New conversation",
                    "session_type": session.get("session_type", "general")
                })

            return formatted_sessions

        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []

    async def _store_meal_plan(self, user_id: str, meal_plan_data: Dict[str, Any]) -> None:
        """Store meal plan data in the database"""
        try:
            if self.db is None:
                logger.warning("Database not available, skipping meal plan storage")
                return

            # Add metadata to meal plan
            meal_plan_data.update({
                "user_id": user_id,
                "id": meal_plan_data.get("id", str(uuid.uuid4())),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "status": "active"
            })

            # Store in meal_plans collection
            meal_plans_collection = self.db["meal_plans"]
            meal_plans_collection.insert_one(meal_plan_data)

            logger.info(f"Stored meal plan {meal_plan_data['id']} for user {user_id}")

        except Exception as e:
            logger.error(f"Error storing meal plan: {e}")
            # Don't raise exception, just log the error

    async def _analyze_nutrition_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's nutrition patterns over time"""
        
        try:
            # Get recent food logs
            food_logs = await self.food_log_service.get_recent_logs(user_id, days=30)

            if not food_logs:
                return {"status": "no_data", "message": "No nutrition data available"}

            total_calories = sum(log.get("calories", 0) for log in food_logs)
            total_protein = sum(log.get("protein", 0) for log in food_logs)
            total_carbs = sum(log.get("carbs", 0) for log in food_logs)
            total_fat = sum(log.get("fat", 0) for log in food_logs)

            days_with_data = len(set(log.get("date", "").split("T")[0] for log in food_logs))

            return {
                "total_entries": len(food_logs),
                "days_logged": days_with_data,
                "avg_daily_calories": total_calories / max(days_with_data, 1),
                "avg_daily_protein": total_protein / max(days_with_data, 1),
                "avg_daily_carbs": total_carbs / max(days_with_data, 1),
                "avg_daily_fat": total_fat / max(days_with_data, 1),
                "consistency_score": min(100, (days_with_data / 30) * 100)
            }
        except Exception as e:
            logger.error(f"Error analyzing nutrition patterns: {e}")
            return {"status": "error", "message": "Failed to analyze nutrition patterns"}

    async def _analyze_behavioral_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's behavioral patterns"""
        try:
            # Get meal plan adherence
            meal_plans = await self.meal_planning_service.get_user_meal_plans(user_id)

            # Get food logging frequency
            food_logs = await self.food_log_service.get_recent_logs(user_id, days=30)

            # Calculate patterns
            logging_days = len(set(log.get("date", "").split("T")[0] for log in food_logs))

            return {
                "logging_consistency": min(100, (logging_days / 30) * 100),
                "meal_plan_adherence": 75 if meal_plans else 0,  # Default estimate
                "avg_meals_per_day": len(food_logs) / max(logging_days, 1),
                "engagement_score": min(100, ((logging_days / 30) * 0.7 + 0.3) * 100)
            }
        except Exception as e:
            logger.error(f"Error analyzing behavioral patterns: {e}")
            return {"status": "error", "message": "Failed to analyze behavioral patterns"}

    async def _analyze_goal_progress(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's progress towards health goals"""
        try:
            user_data = await self.user_service.get_user_by_id(user_id)

            goals = {}
            progress = {}

            # Weight goal analysis
            if user_data.get("weight_goal"):
                current_weight = user_data.get("weight", 0)
                target_weight = user_data.get("weight_goal", 0)

                if current_weight and target_weight:
                    weight_diff = abs(current_weight - target_weight)
                    goals["weight"] = {
                        "current": current_weight,
                        "target": target_weight,
                        "progress": max(0, min(100, (1 - weight_diff / max(current_weight, target_weight)) * 100))
                    }

            # Calorie goal analysis
            if user_data.get("calorie_goal"):
                food_logs = await self.food_log_service.get_recent_logs(user_id, days=7)
                avg_calories = sum(log.get("calories", 0) for log in food_logs) / max(len(food_logs), 1)
                target_calories = user_data.get("calorie_goal", 0)

                if target_calories:
                    calorie_accuracy = max(0, min(100, 100 - abs(avg_calories - target_calories) / target_calories * 100))
                    goals["calories"] = {
                        "current": avg_calories,
                        "target": target_calories,
                        "progress": calorie_accuracy
                    }

            return {
                "goals": goals,
                "overall_progress": sum(goal["progress"] for goal in goals.values()) / max(len(goals), 1) if goals else 0,
                "active_goals": len(goals)
            }
        except Exception as e:
            logger.error(f"Error analyzing goal progress: {e}")
            return {"status": "error", "message": "Failed to analyze goal progress"}

    async def _store_health_insights(self, user_id: str, insights: Dict[str, Any]) -> None:
        """Store health insights for tracking"""
        try:
            insights_data = {
                "user_id": user_id,
                "insights": insights,
                "generated_at": datetime.now().isoformat(),
                "type": "health_insights"
            }

            await self.db.ai_insights.insert_one(insights_data)
            logger.info(f"Stored health insights for user {user_id}")

        except Exception as e:
            logger.error(f"Error storing health insights: {e}")
            # Don't raise exception, just log the error


# Global instance
unified_ai_service = UnifiedAIService()
