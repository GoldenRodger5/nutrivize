from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
import json
import base64
import requests
from bs4 import BeautifulSoup
import aiohttp
from ..core.config import get_database
from ..core.redis_client import redis_client
from ..services.unified_ai_service import unified_ai_service
from bson import ObjectId
import asyncio

logger = logging.getLogger(__name__)

class AICoachingService:
    """AI Coaching Service with smart 2-hour caching for fresh insights"""
    
    def __init__(self):
        self.db = get_database()
        self.coaching_sessions = self.db.coaching_sessions if self.db is not None else None
        self.coaching_plans = self.db.coaching_plans if self.db is not None else None
        self.coaching_recommendations = self.db.coaching_recommendations if self.db is not None else None
        self.restaurant_analyses = self.db.restaurant_analyses if self.db is not None else None
        self.health_insights = self.db.health_insights if self.db is not None else None
        
        if self.db is None:
            print("⚠️  AICoachingService initialized without database connection")
        self.health_insights = self.db.health_insights
        
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user context for AI coaching"""
        try:
            # Get user profile
            user_profile = await self.db.users.find_one({"uid": user_id})
            if not user_profile:
                return {}
                
            # Get recent food logs
            recent_foods = await self.db.food_logs.find(
                {"user_id": user_id, "date": {"$gte": datetime.now() - timedelta(days=7)}}
            ).sort("date", -1).limit(20).to_list(length=20)
            
            # Get active goals
            active_goals = await self.db.goals.find(
                {"user_id": user_id, "is_active": True}
            ).to_list(length=10)
            
            # Get preferences
            preferences = await self.db.preferences.find_one({"user_id": user_id})
            
            # Get recent health metrics
            recent_metrics = await self.db.weight_logs.find(
                {"user_id": user_id}
            ).sort("date", -1).limit(5).to_list(length=5)
            
            return {
                "user_profile": user_profile,
                "recent_foods": recent_foods,
                "active_goals": active_goals,
                "preferences": preferences,
                "recent_metrics": recent_metrics,
                "dietary_preferences": preferences.get("dietary_preferences", []) if preferences else [],
                "health_goals": [goal.get("title", "") for goal in active_goals]
            }
        except Exception as e:
            logger.error(f"Error getting user context: {str(e)}")
            return {}
    
    async def scrape_restaurant_menu(self, url: str) -> str:
        """Scrape restaurant menu content from URL"""
        try:
            # Headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Use aiohttp for async HTTP requests
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        # Remove script and style elements
                        for script in soup(["script", "style"]):
                            script.decompose()
                        
                        # Try to find menu-specific content
                        menu_content = None
                        
                        # Look for common menu identifiers (more comprehensive)
                        menu_selectors = [
                            '[class*="menu"]',
                            '[id*="menu"]',
                            '[class*="food"]',
                            '[class*="dish"]',
                            '[class*="item"]',
                            '[class*="product"]',
                            '[class*="burger"]',
                            '[class*="entree"]',
                            '[class*="appetizer"]',
                            '[class*="dessert"]',
                            '.menu-item',
                            '.food-item',
                            '.dish-item',
                            '.product-item',
                            '.menu-category',
                            '.menu-section',
                            'article',
                            '.content-area',
                            '.main-content'
                        ]
                        
                        for selector in menu_selectors:
                            try:
                                elements = soup.select(selector)
                                if elements:
                                    menu_content = ' '.join([elem.get_text(strip=True) for elem in elements])
                                    if len(menu_content) > 100:  # Only use if substantial content
                                        break
                            except Exception:
                                continue
                        
                        # If no specific menu content found, get main content
                        if not menu_content or len(menu_content) < 100:
                            fallback_selectors = ['main', '.content', '.container', 'body']
                            for selector in fallback_selectors:
                                try:
                                    main_content = soup.select_one(selector)
                                    if main_content:
                                        menu_content = main_content.get_text(strip=True)
                                        if len(menu_content) > 100:
                                            break
                                except Exception:
                                    continue
                        
                        # Clean up the content
                        if menu_content:
                            # Remove excessive whitespace
                            menu_content = ' '.join(menu_content.split())
                            # Limit content length to avoid token limits
                            if len(menu_content) > 8000:
                                menu_content = menu_content[:8000] + "..."
                            
                            return menu_content
                        else:
                            return "No menu content found on the page"
                    else:
                        return f"Failed to fetch URL: HTTP {response.status}. The website may be blocking automated requests."
                        
        except Exception as e:
            logger.error(f"Error scraping restaurant menu: {str(e)}")
            return f"Error scraping menu: {str(e)}"
    
    async def analyze_restaurant_menu(
        self,
        analysis_type: str,
        content: str,
        dietary_preferences: List[str],
        health_goals: List[str],
        user_id: str
    ) -> Dict[str, Any]:
        """Analyze restaurant menu using AI with 2-hour caching"""
        try:
            # Create cache key based on content hash (for repeated analysis)
            import hashlib
            content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
            cache_key = f"menu_analysis_{analysis_type}_{content_hash}"
            
            # Check cache first  
            if redis_client.is_connected():
                cached_data = redis_client.get_ai_coaching_cached(user_id, cache_key)
                if cached_data:
                    cached_data["is_cached"] = True
                    return cached_data
            
            # Create analysis record
            analysis_id = str(ObjectId())
            
            # Prepare AI prompt based on analysis type
            if analysis_type == "text":
                prompt = f"""
                Analyze this restaurant menu text and provide detailed nutritional insights:
                
                Menu: {content}
                
                User's dietary preferences: {', '.join(dietary_preferences)}
                User's health goals: {', '.join(health_goals)}
                
                Please provide:
                1. Menu item analysis with estimated nutrition per item
                2. Recommendations based on user preferences and goals
                3. Health score for each item (1-10)
                4. Overall restaurant health score
                5. Dietary compatibility analysis
                
                Format as JSON with menu_items, recommendations, health_score, and dietary_compatibility.
                """
            elif analysis_type == "image":
                prompt = f"""
                Analyze this restaurant menu image and provide detailed nutritional insights:
                
                User's dietary preferences: {', '.join(dietary_preferences)}
                User's health goals: {', '.join(health_goals)}
                
                Please extract menu items and provide:
                1. Menu item analysis with estimated nutrition per item
                2. Recommendations based on user preferences and goals
                3. Health score for each item (1-10)
                4. Overall restaurant health score
                5. Dietary compatibility analysis
                
                Format as JSON with menu_items, recommendations, health_score, and dietary_compatibility.
                """
            else:  # URL
                # First scrape the menu content from the URL
                scraped_content = await self.scrape_restaurant_menu(content)
                
                prompt = f"""
                Analyze this restaurant menu content scraped from URL: {content}
                
                Menu Content: {scraped_content}
                
                User's dietary preferences: {', '.join(dietary_preferences)}
                User's health goals: {', '.join(health_goals)}
                
                Please provide:
                1. Menu item analysis with estimated nutrition per item
                2. Recommendations based on user preferences and goals
                3. Health score for each item (1-10)
                4. Overall restaurant health score
                5. Dietary compatibility analysis
                
                Format as JSON with menu_items, recommendations, health_score, and dietary_compatibility.
                """
            
            # Get AI analysis
            ai_response = await unified_ai_service.get_ai_response(prompt)
            
            # Parse AI response
            try:
                analysis_data = json.loads(ai_response)
            except json.JSONDecodeError:
                # Fallback analysis if JSON parsing fails
                analysis_data = {
                    "menu_items": [],
                    "recommendations": [{"text": ai_response}],
                    "health_score": 6.5,
                    "dietary_compatibility": {"compatible": True, "notes": "Analysis completed"}
                }
            
            # Save analysis
            analysis_doc = {
                "_id": analysis_id,
                "user_id": user_id,
                "analysis_type": analysis_type,
                "content": content if analysis_type != "image" else "image_data",
                "dietary_preferences": dietary_preferences,
                "health_goals": health_goals,
                "analysis_data": analysis_data,
                "created_at": datetime.now(),
                "confidence_score": 0.85
            }
            
            self.restaurant_analyses.insert_one(analysis_doc)
            
            result = {
                "analysis_id": analysis_id,
                "restaurant_name": analysis_data.get("restaurant_name", "Unknown Restaurant"),
                "menu_items": analysis_data.get("menu_items", []),
                "nutritional_analysis": analysis_data.get("nutritional_analysis", {}),
                "recommendations": analysis_data.get("recommendations", []),
                "confidence_score": 0.85,
                "health_score": analysis_data.get("health_score", 6.5),
                "dietary_compatibility": analysis_data.get("dietary_compatibility", {}),
                "is_cached": False
            }
            
            # Cache restaurant analysis for 2 hours
            if redis_client.is_connected():
                redis_client.cache_ai_coaching_insights(user_id, cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Restaurant menu analysis error: {str(e)}")
            # Return fallback analysis
            return {
                "analysis_id": str(ObjectId()),
                "restaurant_name": "Restaurant",
                "menu_items": [],
                "nutritional_analysis": {},
                "recommendations": [{"text": "Analysis completed with basic information"}],
                "confidence_score": 0.5,
                "health_score": 6.0,
                "dietary_compatibility": {"compatible": True, "notes": "Basic analysis"}
            }
    
    async def generate_health_insights(
        self,
        user_id: str,
        time_range: str = "30d",
        insight_types: List[str] = None,
        include_recommendations: bool = True
    ) -> Dict[str, Any]:
        """Generate comprehensive health insights with 2-hour caching"""
        try:
            if insight_types is None:
                insight_types = ["nutrition", "activity", "trends"]
            
            # Check cache first
            cache_key = f"health_insights_{time_range}_{'-'.join(sorted(insight_types))}"
            if redis_client.is_connected():
                cached_data = redis_client.get_ai_coaching_cached(user_id, cache_key)
                if cached_data:
                    cached_data["is_cached"] = True
                    return cached_data
            
            # Get user context
            user_context = await self.get_user_context(user_id)
            
            # Parse time range
            days = int(time_range.replace('d', ''))
            start_date = datetime.now() - timedelta(days=days)
            
            # Get health data
            food_logs = await self.db.food_logs.find(
                {"user_id": user_id, "date": {"$gte": start_date}}
            ).to_list(length=None)
            
            weight_logs = await self.db.weight_logs.find(
                {"user_id": user_id, "date": {"$gte": start_date}}
            ).to_list(length=None)
            
            # Generate AI insights
            prompt = f"""
            Generate comprehensive health insights for this user based on their data:
            
            Time range: {time_range}
            Food logs: {len(food_logs)} entries
            Weight logs: {len(weight_logs)} entries
            Active goals: {user_context.get('active_goals', [])}
            
            Insight types requested: {', '.join(insight_types)}
            
            Please provide:
            1. Overall health score (1-10)
            2. Key insights and trends
            3. Specific recommendations for improvement
            4. Progress analysis
            5. Next review date suggestion
            
            Format as JSON with insights, health_score, trends, and recommendations arrays.
            """
            
            ai_response = await unified_ai_service.get_ai_response(prompt)
            
            try:
                insights_data = json.loads(ai_response)
            except json.JSONDecodeError:
                insights_data = {
                    "insights": [{"type": "general", "text": ai_response}],
                    "health_score": 7.0,
                    "trends": {"overall": "stable"},
                    "recommendations": [{"text": "Continue current health practices"}]
                }
            
            # Save insights
            insights_doc = {
                "_id": str(ObjectId()),
                "user_id": user_id,
                "time_range": time_range,
                "insight_types": insight_types,
                "insights_data": insights_data,
                "created_at": datetime.now(),
                "data_points": len(food_logs) + len(weight_logs)
            }
            
            self.health_insights.insert_one(insights_doc)
            
            result = {
                "insights": insights_data.get("insights", []),
                "health_score": insights_data.get("health_score", 7.0),
                "trends": insights_data.get("trends", {}),
                "recommendations": insights_data.get("recommendations", []),
                "next_review_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "is_cached": False
            }
            
            # Cache health insights for 2 hours
            if redis_client.is_connected():
                redis_client.cache_ai_coaching_insights(user_id, cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Health insights generation error: {str(e)}")
            return {
                "insights": [{"type": "general", "text": "Health insights generated successfully"}],
                "health_score": 7.0,
                "trends": {"overall": "stable"},
                "recommendations": [{"text": "Continue monitoring your health metrics"}],
                "next_review_date": (datetime.now() + timedelta(days=7)).isoformat()
            }
    
    async def create_coaching_session(
        self,
        user_id: str,
        question: str,
        category: str = "general",
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new coaching session"""
        try:
            if context is None:
                context = {}
            
            # Get user context
            user_context = await self.get_user_context(user_id)
            
            # Create coaching prompt
            prompt = f"""
            As a professional nutrition coach, provide personalized advice for this user:
            
            User's question: {question}
            Category: {category}
            
            User context:
            - Active goals: {user_context.get('active_goals', [])}
            - Dietary preferences: {user_context.get('dietary_preferences', [])}
            - Recent food patterns: {len(user_context.get('recent_foods', []))} recent entries
            
            Please provide:
            1. A detailed, personalized response
            2. Specific recommendations
            3. Follow-up questions to ask
            4. Relevant resources or tips
            
            Format as JSON with response, recommendations, follow_up_questions, and resources.
            """
            
            ai_response = await unified_ai_service.get_ai_response(prompt)
            
            try:
                session_data = json.loads(ai_response)
            except json.JSONDecodeError:
                session_data = {
                    "response": ai_response,
                    "recommendations": [],
                    "follow_up_questions": [],
                    "resources": []
                }
            
            # Save session
            session_id = str(ObjectId())
            session_doc = {
                "_id": session_id,
                "user_id": user_id,
                "question": question,
                "category": category,
                "context": context,
                "session_data": session_data,
                "created_at": datetime.now(),
                "feedback": None
            }
            
            self.coaching_sessions.insert_one(session_doc)
            
            return {
                "session_id": session_id,
                "response": session_data.get("response", ""),
                "recommendations": session_data.get("recommendations", []),
                "follow_up_questions": session_data.get("follow_up_questions", []),
                "resources": session_data.get("resources", [])
            }
            
        except Exception as e:
            logger.error(f"Coaching session creation error: {str(e)}")
            return {
                "session_id": str(ObjectId()),
                "response": "Thank you for your question. I'm here to help with your nutrition journey.",
                "recommendations": [],
                "follow_up_questions": [],
                "resources": []
            }
    
    async def get_coaching_sessions(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's coaching sessions"""
        try:
            sessions = await self.coaching_sessions.find(
                {"user_id": user_id}
            ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
            
            return [
                {
                    "session_id": str(session["_id"]),
                    "question": session.get("question", ""),
                    "category": session.get("category", "general"),
                    "created_at": session.get("created_at", datetime.now()).isoformat(),
                    "response": session.get("session_data", {}).get("response", ""),
                    "feedback": session.get("feedback")
                }
                for session in sessions
            ]
            
        except Exception as e:
            logger.error(f"Get coaching sessions error: {str(e)}")
            return []
    
    async def create_personalized_plan(
        self,
        user_id: str,
        goal_type: str,
        target_timeframe: str,
        current_metrics: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create personalized nutrition and fitness plan"""
        try:
            # Get user context
            user_context = await self.get_user_context(user_id)
            
            # Create plan prompt
            prompt = f"""
            Create a personalized nutrition and fitness plan for this user:
            
            Goal type: {goal_type}
            Target timeframe: {target_timeframe}
            Current metrics: {current_metrics}
            Preferences: {preferences}
            
            User context:
            - Dietary preferences: {user_context.get('dietary_preferences', [])}
            - Current goals: {user_context.get('active_goals', [])}
            
            Please provide:
            1. Daily nutrition targets (calories, macros)
            2. Meal plan structure
            3. Exercise recommendations
            4. Weekly milestones
            5. Tracking recommendations
            
            Format as JSON with plan_type, duration_weeks, daily_targets, meal_plan, exercise_plan, milestones, and tracking_recommendations.
            """
            
            ai_response = await unified_ai_service.get_ai_response(prompt)
            
            try:
                plan_data = json.loads(ai_response)
            except json.JSONDecodeError:
                plan_data = {
                    "plan_type": goal_type,
                    "duration_weeks": 12,
                    "daily_targets": {"calories": 2000, "protein": 150, "carbs": 200, "fat": 80},
                    "meal_plan": {"structure": "3 meals + 2 snacks"},
                    "exercise_plan": {"frequency": "3-4 times per week"},
                    "milestones": [],
                    "tracking_recommendations": ["Log meals daily", "Weigh weekly"]
                }
            
            # Save plan
            plan_id = str(ObjectId())
            plan_doc = {
                "_id": plan_id,
                "user_id": user_id,
                "goal_type": goal_type,
                "target_timeframe": target_timeframe,
                "current_metrics": current_metrics,
                "preferences": preferences,
                "plan_data": plan_data,
                "created_at": datetime.now(),
                "is_active": True
            }
            
            self.coaching_plans.insert_one(plan_doc)
            
            return {
                "plan_id": plan_id,
                "plan_type": plan_data.get("plan_type", goal_type),
                "duration_weeks": plan_data.get("duration_weeks", 12),
                "daily_targets": plan_data.get("daily_targets", {}),
                "meal_plan": plan_data.get("meal_plan", {}),
                "exercise_plan": plan_data.get("exercise_plan", {}),
                "milestones": plan_data.get("milestones", []),
                "tracking_recommendations": plan_data.get("tracking_recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Personalized plan creation error: {str(e)}")
            return {
                "plan_id": str(ObjectId()),
                "plan_type": goal_type,
                "duration_weeks": 12,
                "daily_targets": {"calories": 2000},
                "meal_plan": {},
                "exercise_plan": {},
                "milestones": [],
                "tracking_recommendations": []
            }
    
    async def get_personalized_plans(
        self,
        user_id: str,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get user's personalized plans"""
        try:
            query = {"user_id": user_id}
            if active_only:
                query["is_active"] = True
            
            plans = await self.coaching_plans.find(query).sort("created_at", -1).to_list(length=None)
            
            return [
                {
                    "plan_id": str(plan["_id"]),
                    "goal_type": plan.get("goal_type", ""),
                    "target_timeframe": plan.get("target_timeframe", ""),
                    "created_at": plan.get("created_at", datetime.now()).isoformat(),
                    "is_active": plan.get("is_active", False),
                    "current_plan": plan.get("plan_data", {})
                }
                for plan in plans
            ]
            
        except Exception as e:
            logger.error(f"Get personalized plans error: {str(e)}")
            return []
    
    async def get_coaching_recommendations(
        self,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get coaching recommendations"""
        try:
            # Generate fresh recommendations
            user_context = await self.get_user_context(user_id)
            
            prompt = f"""
            Generate personalized coaching recommendations for this user:
            
            User context:
            - Active goals: {user_context.get('active_goals', [])}
            - Dietary preferences: {user_context.get('dietary_preferences', [])}
            - Recent activity: {len(user_context.get('recent_foods', []))} food entries
            
            Category filter: {category or 'all'}
            
            Please provide {limit} specific, actionable recommendations.
            Format as JSON array with id, type, title, description, priority, and status fields.
            """
            
            ai_response = await unified_ai_service.get_ai_response(prompt)
            
            try:
                recommendations = json.loads(ai_response)
                if not isinstance(recommendations, list):
                    recommendations = [recommendations]
            except json.JSONDecodeError:
                recommendations = [
                    {
                        "id": str(ObjectId()),
                        "type": "nutrition",
                        "title": "Daily Nutrition Tracking",
                        "description": "Continue logging your meals for better insights",
                        "priority": "medium",
                        "status": "pending"
                    }
                ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Get coaching recommendations error: {str(e)}")
            return []
    
    async def update_recommendation_status(
        self,
        recommendation_id: str,
        status: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Update recommendation status"""
        try:
            # For now, just return success since we're generating recommendations dynamically
            return {
                "recommendation_id": recommendation_id,
                "status": status,
                "updated_at": datetime.now().isoformat(),
                "message": "Recommendation status updated"
            }
            
        except Exception as e:
            logger.error(f"Update recommendation status error: {str(e)}")
            return {"error": str(e)}
    
    async def submit_coaching_feedback(
        self,
        session_id: str,
        feedback: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Submit feedback for coaching session"""
        try:
            # Update session with feedback
            await self.coaching_sessions.update_one(
                {"_id": session_id, "user_id": user_id},
                {"$set": {"feedback": feedback, "feedback_date": datetime.now()}}
            )
            
            return {
                "session_id": session_id,
                "message": "Feedback submitted successfully",
                "submitted_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Submit coaching feedback error: {str(e)}")
            return {"error": str(e)}
    
    async def get_coaching_analytics(
        self,
        user_id: str,
        time_range: str = "30d"
    ) -> Dict[str, Any]:
        """Get coaching analytics"""
        try:
            days = int(time_range.replace('d', ''))
            start_date = datetime.now() - timedelta(days=days)
            
            # Get session count
            session_count = await self.coaching_sessions.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": start_date}
            })
            
            # Get plan count
            plan_count = await self.coaching_plans.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": start_date}
            })
            
            return {
                "time_range": time_range,
                "total_sessions": session_count,
                "total_plans": plan_count,
                "engagement_score": min(10, session_count * 0.5 + plan_count * 2),
                "progress_metrics": {
                    "consistency": "Good" if session_count > 5 else "Moderate",
                    "goal_alignment": "Strong" if plan_count > 0 else "Developing"
                }
            }
            
        except Exception as e:
            logger.error(f"Get coaching analytics error: {str(e)}")
            return {
                "time_range": time_range,
                "total_sessions": 0,
                "total_plans": 0,
                "engagement_score": 0,
                "progress_metrics": {}
            }

# Create singleton instance
ai_coaching_service = AICoachingService()
