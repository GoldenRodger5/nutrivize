"""
Vector-Enhanced AI Service for Nutrivize V2
Integrates Pinecone vector retrieval with Claude to provide contextually intelligent responses
Replaces raw prompt stuffing with efficient, query-relevant context retrieval
"""

import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from .pinecone_service import pinecone_service
from .vector_management_service import vector_management_service
from ..models.chat import ChatMessage, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

class VectorEnhancedAIService:
    """
    AI service that uses vector retrieval for intelligent context selection
    Provides Claude with only the most relevant user data for each query
    """
    
    def __init__(self):
        self.context_cache = {}  # Cache for recent context retrievals
        self.max_context_tokens = 8000  # Limit context size for Claude
        
        logger.info("✅ VectorEnhancedAIService initialized")
    
    async def get_relevant_context(self, user_id: str, query: str, context_type: str = "all") -> Dict[str, Any]:
        """
        Get relevant context for a user query using vector retrieval
        
        Args:
            user_id: User's Firebase UID
            query: User's question or message
            context_type: Type of context needed ("nutrition", "planning", "history", "all")
        
        Returns:
            Dict containing relevant context organized by data type
        """
        try:
            logger.info(f"Getting relevant context for user {user_id}, query: {query[:100]}...")
            
            # Determine which data types to query based on context_type and query content
            data_types = self._determine_relevant_data_types(query, context_type)
            
            # Query vector database for relevant context
            context_items = await pinecone_service.query_user_context(
                user_id=user_id,
                query=query,
                top_k=15,  # Get more results to filter
                data_types=data_types
            )
            
            # Organize context by data type and relevance
            organized_context = self._organize_context_by_type(context_items)
            
            # Generate context summary for Claude
            context_summary = self._generate_context_summary(organized_context, query)
            
            logger.info(f"✅ Retrieved {len(context_items)} relevant context items for user {user_id}")
            
            return {
                "context_summary": context_summary,
                "raw_context": organized_context,
                "context_stats": {
                    "total_items": len(context_items),
                    "data_types": list(organized_context.keys()),
                    "query_intent": self._analyze_query_intent(query)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get relevant context: {e}")
            return {
                "context_summary": "No specific context available for this query.",
                "raw_context": {},
                "context_stats": {"error": str(e)}
            }
    
    def _determine_relevant_data_types(self, query: str, context_type: str) -> Optional[List[str]]:
        """Determine which data types are most relevant for the query"""
        query_lower = query.lower()
        
        # If specific context type requested
        if context_type == "nutrition":
            return ["food_log", "nutrition_summary"]
        elif context_type == "planning":
            return ["meal_plan", "favorite_food"]
        elif context_type == "history":
            return ["ai_advice", "nutrition_summary"]
        
        # Auto-detect based on query content
        data_types = []
        
        # Food logging related
        if any(term in query_lower for term in ["logged", "ate", "consumed", "yesterday", "today", "meal", "breakfast", "lunch", "dinner"]):
            data_types.extend(["food_log", "nutrition_summary"])
        
        # Meal planning related
        if any(term in query_lower for term in ["plan", "meal plan", "suggest", "recommend", "recipe", "cook"]):
            data_types.extend(["meal_plan", "favorite_food"])
        
        # Nutrition analysis related
        if any(term in query_lower for term in ["nutrition", "calories", "protein", "carbs", "fat", "sodium", "fiber", "goal", "target"]):
            data_types.extend(["food_log", "nutrition_summary"])
        
        # Favorites and preferences
        if any(term in query_lower for term in ["favorite", "like", "prefer", "usual", "often", "always"]):
            data_types.extend(["favorite_food", "ai_advice"])
        
        # Historical context
        if any(term in query_lower for term in ["week", "month", "progress", "improvement", "trend", "pattern"]):
            data_types.extend(["nutrition_summary", "ai_advice"])
        
        # Return None for broad context if no specific matches
        return list(set(data_types)) if data_types else None
    
    def _organize_context_by_type(self, context_items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Organize context items by data type"""
        organized = {
            "recent_meals": [],
            "nutrition_patterns": [],
            "meal_plans": [],
            "preferences": [],
            "ai_insights": []
        }
        
        for item in context_items:
            metadata = item.get("metadata", {})
            data_type = metadata.get("data_type", "unknown")
            
            # Only include reasonably relevant items - lowered threshold for better context
            if item.get("score", 0) < 0.3:
                continue
            
            if data_type == "food_log":
                organized["recent_meals"].append({
                    "date": metadata.get("date"),
                    "meal_type": metadata.get("meal_type"),
                    "food_name": metadata.get("food_name"),
                    "calories": metadata.get("calories"),
                    "protein": metadata.get("protein"),
                    "relevance_score": item.get("score")
                })
            
            elif data_type == "nutrition_summary":
                organized["nutrition_patterns"].append({
                    "period": metadata.get("period"),
                    "start_date": metadata.get("start_date"),
                    "avg_calories": metadata.get("avg_calories"),
                    "avg_protein": metadata.get("avg_protein"),
                    "adherence_score": metadata.get("adherence_score"),
                    "relevance_score": item.get("score")
                })
            
            elif data_type == "meal_plan":
                organized["meal_plans"].append({
                    "plan_name": metadata.get("name") or metadata.get("plan_name"),  # Handle both field names
                    "plan_id": metadata.get("plan_id"),
                    "goal_type": metadata.get("goal_type"),
                    "duration_days": metadata.get("duration_days"),
                    "total_calories": metadata.get("total_calories"),
                    "dietary_restrictions": metadata.get("dietary_restrictions", []),
                    "created_at": metadata.get("created_at"),
                    "relevance_score": item.get("score")
                })
            
            elif data_type == "favorite_food":
                organized["preferences"].append({
                    "food_name": metadata.get("food_name"),
                    "category": metadata.get("category"),
                    "usage_count": metadata.get("usage_count"),
                    "calories": metadata.get("calories"),
                    "relevance_score": item.get("score")
                })
            
            elif data_type == "ai_advice":
                organized["ai_insights"].append({
                    "timestamp": metadata.get("timestamp"),
                    "message_length": metadata.get("message_length"),
                    "relevance_score": item.get("score")
                })
        
        # Remove empty categories and limit items per category
        return {k: v[:5] for k, v in organized.items() if v}  # Max 5 items per category
    
    def _generate_context_summary(self, organized_context: Dict[str, List[Dict[str, Any]]], query: str) -> str:
        """Generate a concise context summary for Claude"""
        summary_parts = []
        
        # Recent meals context
        if organized_context.get("recent_meals"):
            meals = organized_context["recent_meals"][:3]  # Top 3 most relevant
            meal_summaries = []
            for meal in meals:
                meal_summaries.append(
                    f"{meal['date']} {meal['meal_type']}: {meal['food_name']} "
                    f"({meal['calories']} cal, {meal['protein']}g protein)"
                )
            
            summary_parts.append(f"Recent relevant meals:\n{chr(10).join(meal_summaries)}")
        
        # Nutrition patterns
        if organized_context.get("nutrition_patterns"):
            pattern = organized_context["nutrition_patterns"][0]  # Most relevant pattern
            summary_parts.append(
                f"Nutrition pattern ({pattern['period']}): "
                f"Avg {pattern['avg_calories']} cal/day, {pattern['avg_protein']}g protein/day, "
                f"{pattern['adherence_score']}% goal adherence"
            )
        
        # Meal planning context
        if organized_context.get("meal_plans"):
            plans = organized_context["meal_plans"][:2]  # Top 2 most relevant
            plan_summaries = []
            for plan in plans:
                duration = plan.get('duration_days', 'unknown')
                restrictions = plan.get('dietary_restrictions', [])
                restrictions_text = f", restrictions: {', '.join(restrictions)}" if restrictions else ""
                
                plan_summaries.append(
                    f"'{plan['plan_name']}' ({duration} days{restrictions_text})"
                )
            
            summary_parts.append(f"Your previous meal plans:\n{chr(10).join(plan_summaries)}")
        
        # User preferences
        if organized_context.get("preferences"):
            prefs = organized_context["preferences"][:3]  # Top 3 preferences
            pref_summaries = []
            for pref in prefs:
                pref_summaries.append(
                    f"{pref['food_name']} ({pref['category']}, used {pref['usage_count']} times)"
                )
            
            summary_parts.append(f"User preferences:\n{chr(10).join(pref_summaries)}")
        
        # Combine all parts
        if summary_parts:
            return "\n\n".join(summary_parts)
        else:
            return "No specific context available for this query."
    
    def _analyze_query_intent(self, query: str) -> str:
        """Analyze the intent behind the user's query"""
        query_lower = query.lower()
        
        # Question types
        if any(word in query_lower for word in ["why", "what", "how", "when", "where"]):
            if "why" in query_lower and any(word in query_lower for word in ["over", "under", "miss", "exceed"]):
                return "goal_analysis"
            elif any(word in query_lower for word in ["recommend", "suggest", "should"]):
                return "recommendation_request"
            else:
                return "information_request"
        
        # Action requests
        elif any(word in query_lower for word in ["help", "suggest", "recommend", "plan", "create"]):
            return "action_request"
        
        # Progress tracking
        elif any(word in query_lower for word in ["progress", "improvement", "trend", "week", "month"]):
            return "progress_inquiry"
        
        else:
            return "general_conversation"
    
    async def build_enhanced_prompt(self, user_id: str, query: str, conversation_history: List[ChatMessage]) -> str:
        """
        Build an enhanced prompt for Claude using vector-retrieved context
        Replaces raw data dumping with intelligent context selection
        """
        try:
            # Get relevant context using vector search
            context_data = await self.get_relevant_context(user_id, query)
            
            # Build the enhanced system prompt
            system_prompt = f"""You are a helpful nutrition and wellness assistant with access to the user's personalized nutrition data.

RELEVANT USER CONTEXT:
{context_data['context_summary']}

GUIDELINES:
- Provide evidence-based, personalized advice based on the user's actual data
- Reference specific meals, patterns, or preferences when relevant
- Give practical, actionable recommendations
- Be encouraging and supportive
- Keep responses concise but informative
- Always recommend consulting healthcare professionals for medical issues

CURRENT QUERY CONTEXT:
- Query intent: {context_data['context_stats'].get('query_intent', 'general')}
- Available data types: {', '.join(context_data['context_stats'].get('data_types', []))}
- Context items: {context_data['context_stats'].get('total_items', 0)}

Respond to the user's query with this personalized context in mind."""
            
            return system_prompt
            
        except Exception as e:
            logger.error(f"❌ Failed to build enhanced prompt: {e}")
            
            # Fallback to basic prompt
            return """You are a helpful nutrition and wellness assistant. Provide evidence-based advice about nutrition, healthy eating, meal planning, and general wellness.

Guidelines:
- Give practical, actionable advice
- Always recommend consulting healthcare professionals for medical issues
- Focus on balanced, sustainable approaches
- Be encouraging and supportive
- Keep responses concise but informative"""
    
    async def get_contextual_meal_suggestions(self, user_id: str, meal_type: str, dietary_preferences: List[str] = None) -> Dict[str, Any]:
        """
        Get meal suggestions based on user's historical preferences and patterns
        Uses vector search to find similar successful meals
        """
        try:
            # Create query for meal suggestions
            query = f"healthy {meal_type} options that I would enjoy based on my preferences and past meals"
            
            # Get relevant context focusing on meal plans and preferences
            context_data = await self.get_relevant_context(
                user_id, 
                query, 
                context_type="planning"
            )
            
            # Extract preferences and successful patterns
            preferences = context_data.get("raw_context", {}).get("preferences", [])
            meal_plans = context_data.get("raw_context", {}).get("meal_plans", [])
            
            # Build suggestion context
            suggestion_context = {
                "meal_type": meal_type,
                "user_preferences": preferences[:5],  # Top 5 preferences
                "successful_plans": meal_plans[:3],   # Top 3 relevant plans
                "dietary_preferences": dietary_preferences or []
            }
            
            return {
                "suggestion_context": suggestion_context,
                "context_summary": context_data["context_summary"],
                "recommendation_basis": "Based on your meal history and preferences"
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get contextual meal suggestions: {e}")
            return {
                "suggestion_context": {"meal_type": meal_type},
                "context_summary": "No specific preference data available",
                "recommendation_basis": "Based on general nutrition guidelines"
            }

# Global instance
vector_ai_service = VectorEnhancedAIService()
