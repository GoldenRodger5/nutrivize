"""
AI Health Analysis Service - Enhanced health analytics and insights
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from ..core.config import db_manager
from ..models.user import UserResponse
import asyncio
from statistics import mean
import random

class AIHealthAnalysisService:
    """Service for generating AI-powered health analytics"""
    
    async def get_enhanced_health_score(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive health score with AI insights"""
        try:
            # Get user data from database
            user_data = await self._get_user_health_data(user_id)
            
            # Calculate component scores
            component_scores = self._calculate_component_scores(user_data)
            
            # Calculate overall score
            overall_score = self._calculate_overall_score(component_scores)
            
            # Determine trend
            trend = await self._calculate_trend(user_id)
            
            # Identify improvement areas
            improvement_areas = self._identify_improvement_areas(component_scores)
            
            # Generate AI insights
            ai_insights = self._generate_ai_insights(user_data, component_scores)
            
            return {
                "overall_score": overall_score,
                "trend": trend,
                "component_scores": component_scores,
                "improvement_areas": improvement_areas,
                "ai_insights": ai_insights,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating enhanced health score: {e}")
            raise
    
    async def get_progress_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get detailed progress analytics with milestones"""
        try:
            # Get user goals and current progress
            user_goals = await self._get_user_goals(user_id)
            weight_data = await self._get_weight_progress(user_id)
            fitness_data = await self._get_fitness_progress(user_id)
            nutrition_data = await self._get_nutrition_progress(user_id)
            
            # Calculate progress percentages and milestones
            weight_progress = self._calculate_weight_progress(weight_data, user_goals)
            fitness_progress = self._calculate_fitness_progress(fitness_data, user_goals)
            nutrition_progress = self._calculate_nutrition_progress(nutrition_data, user_goals)
            
            return {
                "weight_progress": weight_progress,
                "fitness_progress": fitness_progress,
                "nutrition_progress": nutrition_progress,
                "overall_progress_score": self._calculate_overall_progress([
                    weight_progress.get("percent_complete", 0),
                    fitness_progress.get("percent_complete", 0),
                    nutrition_progress.get("percent_complete", 0)
                ]),
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating progress analytics: {e}")
            raise
    
    async def _get_user_health_data(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user health data"""
        try:
            # Get recent food logs (last 7 days)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            food_logs = db_manager.db.food_logs.find({
                "user_id": user_id,
                "date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": end_date.strftime("%Y-%m-%d")
                }
            })
            
            # Get water logs
            water_logs = db_manager.db.water_logs.find({
                "user_id": user_id,
                "date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": end_date.strftime("%Y-%m-%d")
                }
            })
            
            # Get weight logs
            weight_logs = db_manager.db.weight_logs.find({
                "user_id": user_id
            }).sort("date", -1).limit(30)
            
            # Get user goals
            user_goals = db_manager.db.goals.find_one({"user_id": user_id})
            
            return {
                "food_logs": list(food_logs),
                "water_logs": list(water_logs),
                "weight_logs": list(weight_logs),
                "goals": user_goals or {}
            }
            
        except Exception as e:
            print(f"Error fetching user health data: {e}")
            return {
                "food_logs": [],
                "water_logs": [],
                "weight_logs": [],
                "goals": {}
            }
    
    def _calculate_component_scores(self, user_data: Dict[str, Any]) -> Dict[str, int]:
        """Calculate individual component scores"""
        try:
            # Nutrition score based on calorie targets and macro balance
            nutrition_score = self._calculate_nutrition_score(user_data.get("food_logs", []), user_data.get("goals", {}))
            
            # Hydration score based on water intake
            hydration_score = self._calculate_hydration_score(user_data.get("water_logs", []), user_data.get("goals", {}))
            
            # Activity score (placeholder - would integrate with fitness trackers)
            activity_score = random.randint(65, 85)  # TODO: Integrate with actual activity data
            
            # Sleep score (placeholder - would integrate with sleep trackers)
            sleep_score = random.randint(70, 90)  # TODO: Integrate with actual sleep data
            
            # Metabolic health based on weight trend and consistency
            metabolic_health_score = self._calculate_metabolic_score(user_data.get("weight_logs", []))
            
            return {
                "nutrition": max(0, min(100, nutrition_score)),
                "activity": max(0, min(100, activity_score)),
                "sleep": max(0, min(100, sleep_score)),
                "hydration": max(0, min(100, hydration_score)),
                "metabolic_health": max(0, min(100, metabolic_health_score))
            }
            
        except Exception as e:
            print(f"Error calculating component scores: {e}")
            return {
                "nutrition": 70,
                "activity": 70,
                "sleep": 75,
                "hydration": 80,
                "metabolic_health": 72
            }
    
    def _calculate_nutrition_score(self, food_logs: List[Dict], goals: Dict) -> int:
        """Calculate nutrition score based on food logs and goals"""
        if not food_logs:
            return 60  # Base score if no data
        
        try:
            # Calculate average daily calories
            daily_calories = {}
            for log in food_logs:
                date = log.get("date")
                if date not in daily_calories:
                    daily_calories[date] = 0
                daily_calories[date] += log.get("nutrition", {}).get("calories", 0)
            
            # Get calorie goal
            calorie_goal = goals.get("daily_calories", 2000)
            
            # Calculate adherence to calorie goal
            if daily_calories:
                avg_calories = mean(daily_calories.values())
                calorie_adherence = 100 - abs(avg_calories - calorie_goal) / calorie_goal * 100
                return int(max(50, min(100, calorie_adherence)))
            
            return 65
            
        except Exception as e:
            print(f"Error calculating nutrition score: {e}")
            return 65
    
    def _calculate_hydration_score(self, water_logs: List[Dict], goals: Dict) -> int:
        """Calculate hydration score based on water intake"""
        if not water_logs:
            return 70  # Base score if no data
        
        try:
            # Calculate average daily water intake
            daily_water = {}
            for log in water_logs:
                date = log.get("date")
                if date not in daily_water:
                    daily_water[date] = 0
                daily_water[date] += log.get("amount", 0)
            
            # Get water goal (default 2000ml)
            water_goal = goals.get("daily_water", 2000)
            
            if daily_water:
                avg_water = mean(daily_water.values())
                water_adherence = min(100, (avg_water / water_goal) * 100)
                return int(max(40, water_adherence))
            
            return 70
            
        except Exception as e:
            print(f"Error calculating hydration score: {e}")
            return 70
    
    def _calculate_metabolic_score(self, weight_logs: List[Dict]) -> int:
        """Calculate metabolic health score based on weight trends"""
        if len(weight_logs) < 3:
            return 75  # Base score if insufficient data
        
        try:
            # Sort by date and get recent trend
            sorted_logs = sorted(weight_logs, key=lambda x: x.get("date", ""))
            
            # Calculate weight trend stability (less volatility = better score)
            weights = [log.get("weight", 0) for log in sorted_logs[-10:]]  # Last 10 entries
            
            if len(weights) >= 3:
                # Calculate volatility (standard deviation)
                weight_mean = mean(weights)
                variance = sum((w - weight_mean) ** 2 for w in weights) / len(weights)
                std_dev = variance ** 0.5
                
                # Lower volatility = higher score
                stability_score = max(50, 100 - (std_dev * 10))
                return int(stability_score)
            
            return 75
            
        except Exception as e:
            print(f"Error calculating metabolic score: {e}")
            return 75
    
    def _calculate_overall_score(self, component_scores: Dict[str, int]) -> int:
        """Calculate weighted overall health score"""
        weights = {
            "nutrition": 0.25,
            "activity": 0.20,
            "sleep": 0.20,
            "hydration": 0.15,
            "metabolic_health": 0.20
        }
        
        overall = sum(score * weights.get(component, 0.2) for component, score in component_scores.items())
        return int(max(0, min(100, overall)))
    
    async def _calculate_trend(self, user_id: str) -> str:
        """Calculate health trend based on recent data"""
        try:
            # Get recent health scores (if we were tracking them)
            # For now, simulate based on recent weight and activity patterns
            
            # Get weight trend
            weight_logs = db_manager.db.weight_logs.find({
                "user_id": user_id
            }).sort("date", -1).limit(10)
            
            weight_list = list(weight_logs)
            if len(weight_list) >= 3:
                recent_weights = [log.get("weight", 0) for log in weight_list[:3]]
                older_weights = [log.get("weight", 0) for log in weight_list[-3:]]
                
                recent_avg = mean(recent_weights)
                older_avg = mean(older_weights)
                
                if recent_avg < older_avg - 0.5:
                    return "improving"
                elif recent_avg > older_avg + 0.5:
                    return "declining"
                else:
                    return "stable"
            
            return "stable"
            
        except Exception as e:
            print(f"Error calculating trend: {e}")
            return "stable"
    
    def _identify_improvement_areas(self, component_scores: Dict[str, int]) -> List[Dict[str, Any]]:
        """Identify areas needing improvement with recommendations"""
        improvement_areas = []
        
        # Find lowest scoring components
        sorted_scores = sorted(component_scores.items(), key=lambda x: x[1])
        
        for component, score in sorted_scores[:2]:  # Top 2 improvement areas
            recommendations = self._get_recommendations_for_component(component, score)
            improvement_areas.append({
                "area": component,
                "score": score,
                "recommendations": recommendations
            })
        
        return improvement_areas
    
    def _get_recommendations_for_component(self, component: str, score: int) -> List[str]:
        """Get specific recommendations for component improvement"""
        recommendations_map = {
            "nutrition": [
                "Focus on whole foods and reduce processed options",
                "Track macronutrients to ensure balanced intake",
                "Plan meals in advance to maintain consistency",
                "Consider consulting with a nutritionist"
            ],
            "activity": [
                "Aim for 150 minutes of moderate exercise per week",
                "Include both cardio and strength training",
                "Take regular walks throughout the day",
                "Find activities you enjoy to maintain consistency"
            ],
            "sleep": [
                "Establish a consistent sleep schedule",
                "Create a relaxing bedtime routine",
                "Limit screen time before bed",
                "Ensure your bedroom is cool and dark"
            ],
            "hydration": [
                "Set reminders to drink water throughout the day",
                "Keep a water bottle with you at all times",
                "Track your daily water intake",
                "Start each meal with a glass of water"
            ],
            "metabolic_health": [
                "Focus on consistent weight management",
                "Maintain regular eating patterns",
                "Include fiber-rich foods in your diet",
                "Monitor your weight trends weekly"
            ]
        }
        
        return recommendations_map.get(component, ["Focus on this area for better health"])
    
    def _generate_ai_insights(self, user_data: Dict[str, Any], component_scores: Dict[str, int]) -> Dict[str, Any]:
        """Generate AI-powered insights and recommendations"""
        try:
            # Analyze patterns in user data
            food_logs = user_data.get("food_logs", [])
            goals = user_data.get("goals", {})
            
            # Generate insights based on data patterns
            nutrition_insights = self._generate_nutrition_insights(food_logs, goals)
            lifestyle_insights = self._generate_lifestyle_insights(component_scores)
            next_steps = self._generate_next_steps(component_scores)
            
            return {
                "short_term_insights": f"Your health score shows strongest performance in {max(component_scores, key=component_scores.get)}. Continue this momentum!",
                "long_term_recommendations": "Focus on consistency in your nutrition and hydration habits for sustained health improvements.",
                "nutrition_insights": nutrition_insights,
                "lifestyle_insights": lifestyle_insights,
                "next_steps": next_steps
            }
            
        except Exception as e:
            print(f"Error generating AI insights: {e}")
            return {
                "short_term_insights": "Keep focusing on your daily nutrition and hydration goals.",
                "long_term_recommendations": "Consistency is key to long-term health success.",
                "nutrition_insights": "Track your macronutrients for better balance.",
                "lifestyle_insights": "Small daily improvements lead to big results.",
                "next_steps": ["Track your daily food intake", "Stay hydrated", "Get regular exercise"]
            }
    
    def _generate_nutrition_insights(self, food_logs: List[Dict], goals: Dict) -> str:
        """Generate nutrition-specific insights"""
        if not food_logs:
            return "Start logging your meals to get personalized nutrition insights."
        
        # Analyze recent nutrition patterns
        total_calories = sum(log.get("nutrition", {}).get("calories", 0) for log in food_logs)
        avg_daily_calories = total_calories / max(1, len(set(log.get("date") for log in food_logs)))
        
        calorie_goal = goals.get("daily_calories", 2000)
        
        if avg_daily_calories < calorie_goal * 0.8:
            return "You may be under-eating. Consider adding nutrient-dense snacks to meet your calorie goals."
        elif avg_daily_calories > calorie_goal * 1.2:
            return "Your calorie intake is above target. Focus on portion control and nutrient density."
        else:
            return "Your calorie intake is well-balanced. Focus on optimizing macronutrient ratios."
    
    def _generate_lifestyle_insights(self, component_scores: Dict[str, int]) -> str:
        """Generate lifestyle-specific insights"""
        lowest_score = min(component_scores.values())
        highest_score = max(component_scores.values())
        
        if highest_score - lowest_score > 20:
            return "Your health profile shows significant variation between areas. Focus on your weakest area for balanced improvement."
        else:
            return "Your health metrics are well-balanced. Maintain your current approach with minor optimizations."
    
    def _generate_next_steps(self, component_scores: Dict[str, int]) -> List[str]:
        """Generate actionable next steps"""
        next_steps = []
        
        # Find the lowest scoring area
        lowest_area = min(component_scores, key=component_scores.get)
        lowest_score = component_scores[lowest_area]
        
        if lowest_score < 70:
            next_steps.append(f"Prioritize improving your {lowest_area} - this is your biggest opportunity")
        
        # Add general recommendations
        next_steps.extend([
            "Log your food intake consistently for better insights",
            "Set a daily water intake goal and track progress",
            "Review your weekly health trends to identify patterns"
        ])
        
        return next_steps[:5]  # Limit to 5 next steps
    
    async def _get_user_goals(self, user_id: str) -> Dict[str, Any]:
        """Get user goals from database"""
        try:
            goals = db_manager.db.goals.find_one({"user_id": user_id})
            return goals or {}
        except Exception as e:
            print(f"Error fetching user goals: {e}")
            return {}
    
    async def _get_weight_progress(self, user_id: str) -> List[Dict]:
        """Get weight progress data"""
        try:
            weight_logs = db_manager.db.weight_logs.find({
                "user_id": user_id
            }).sort("date", 1)
            return list(weight_logs)
        except Exception as e:
            print(f"Error fetching weight progress: {e}")
            return []
    
    async def _get_fitness_progress(self, user_id: str) -> Dict[str, Any]:
        """Get fitness progress data (placeholder)"""
        # TODO: Integrate with fitness tracking
        return {
            "weekly_exercise_minutes": random.randint(120, 200),
            "average_steps": random.randint(7000, 12000)
        }
    
    async def _get_nutrition_progress(self, user_id: str) -> Dict[str, Any]:
        """Get nutrition progress data"""
        try:
            # Get recent food logs for nutrition analysis
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            food_logs = db_manager.db.food_logs.find({
                "user_id": user_id,
                "date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lte": end_date.strftime("%Y-%m-%d")
                }
            })
            
            logs_list = list(food_logs)
            
            # Calculate nutrition metrics
            total_calories = sum(log.get("nutrition", {}).get("calories", 0) for log in logs_list)
            logging_days = len(set(log.get("date") for log in logs_list))
            
            return {
                "total_calories_logged": total_calories,
                "days_logged": logging_days,
                "average_daily_calories": total_calories / max(1, logging_days)
            }
            
        except Exception as e:
            print(f"Error fetching nutrition progress: {e}")
            return {
                "total_calories_logged": 0,
                "days_logged": 0,
                "average_daily_calories": 0
            }
    
    def _calculate_weight_progress(self, weight_data: List[Dict], goals: Dict) -> Dict[str, Any]:
        """Calculate detailed weight progress with milestones"""
        if not weight_data:
            return {
                "start_weight": 0,
                "current_weight": 0,
                "target_weight": 0,
                "percent_complete": 0,
                "weight_lost_so_far": "0 lbs",
                "remaining_weight": "Unknown",
                "current_rate": "No data",
                "weekly_goal": 1,
                "estimated_completion": "Unknown"
            }
        
        try:
            # Sort weight data by date
            sorted_weights = sorted(weight_data, key=lambda x: x.get("date", ""))
            
            # Convert kg to lbs for consistency with frontend display
            kg_to_lbs = lambda kg: kg * 2.20462
            
            start_weight_kg = sorted_weights[0].get("weight", 0) if sorted_weights else 0
            current_weight_kg = sorted_weights[-1].get("weight", 0) if sorted_weights else 0
            target_weight_kg = goals.get("target_weight", current_weight_kg)
            
            # Convert to lbs for display
            start_weight = kg_to_lbs(start_weight_kg)
            current_weight = kg_to_lbs(current_weight_kg)
            target_weight = kg_to_lbs(target_weight_kg)
            
            # Calculate progress
            total_goal = abs(start_weight - target_weight)
            progress = abs(start_weight - current_weight)
            percent_complete = int((progress / max(total_goal, 0.1)) * 100) if total_goal > 0 else 0
            
            # Calculate rates and estimates
            weight_lost = abs(start_weight - current_weight)
            remaining = abs(current_weight - target_weight)
            
            # Calculate weekly rate (if we have enough data)
            weekly_rate = 1.0  # Default
            if len(sorted_weights) >= 2:
                days_span = (datetime.strptime(sorted_weights[-1].get("date", ""), "%Y-%m-%d") - 
                           datetime.strptime(sorted_weights[0].get("date", ""), "%Y-%m-%d")).days
                if days_span > 0:
                    weekly_rate = (weight_lost / days_span) * 7
            
            # Estimate completion
            weeks_remaining = remaining / max(weekly_rate, 0.1)
            estimated_date = datetime.now() + timedelta(weeks=weeks_remaining)
            
            return {
                "start_weight": round(start_weight, 1),
                "current_weight": round(current_weight, 1),
                "target_weight": round(target_weight, 1),
                "percent_complete": max(0, min(100, percent_complete)),
                "weight_lost_so_far": f"{weight_lost:.1f} lbs",
                "remaining_weight": f"{remaining:.1f} lbs",
                "current_rate": f"{weekly_rate:.1f} lbs/week",
                "weekly_goal": goals.get("weekly_weight_goal", 1.0),
                "estimated_completion": estimated_date.strftime("%B %Y")
            }
            
        except Exception as e:
            print(f"Error calculating weight progress: {e}")
            return {
                "start_weight": 0,
                "current_weight": 0,
                "target_weight": 0,
                "percent_complete": 0,
                "weight_lost_so_far": "0 lbs",
                "remaining_weight": "Unknown",
                "current_rate": "No data",
                "weekly_goal": 1,
                "estimated_completion": "Unknown"
            }
    
    def _calculate_fitness_progress(self, fitness_data: Dict, goals: Dict) -> Dict[str, Any]:
        """Calculate fitness progress (placeholder)"""
        # TODO: Implement actual fitness tracking integration
        target_minutes = goals.get("weekly_exercise_minutes", 150)
        current_minutes = fitness_data.get("weekly_exercise_minutes", 0)
        
        return {
            "weekly_exercise_minutes": current_minutes,
            "target_weekly_minutes": target_minutes,
            "percent_complete": int((current_minutes / max(target_minutes, 1)) * 100),
            "average_daily_steps": fitness_data.get("average_steps", 0),
            "step_goal": goals.get("daily_steps", 10000)
        }
    
    def _calculate_nutrition_progress(self, nutrition_data: Dict, goals: Dict) -> Dict[str, Any]:
        """Calculate nutrition progress"""
        days_logged = nutrition_data.get("days_logged", 0)
        target_days = 7  # Weekly goal
        
        return {
            "days_logged_this_week": days_logged,
            "target_logging_days": target_days,
            "percent_complete": int((days_logged / max(target_days, 1)) * 100),
            "average_daily_calories": nutrition_data.get("average_daily_calories", 0),
            "calorie_goal": goals.get("daily_calories", 2000)
        }
    
    def _calculate_overall_progress(self, progress_scores: List[float]) -> int:
        """Calculate overall progress score"""
        if not progress_scores:
            return 0
        return int(mean(progress_scores))

# Create singleton instance
ai_health_analysis_service = AIHealthAnalysisService()
