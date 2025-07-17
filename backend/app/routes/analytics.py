"""
Analytics endpoints with AI-powered insights
"""

import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
from ..models.user import UserResponse
from ..services.analytics_service import AnalyticsService
from ..services.food_log_service import food_log_service
from .auth import get_current_user

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nutrivize.analytics")

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize analytics service
analytics_service = AnalyticsService()

@router.get("/insights")
async def get_insights(
    timeframe: str = Query("week", description="Timeframe for analysis: day, week, month, all"),
    force_refresh: bool = Query(False, description="Force refresh of insights data"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get AI-powered insights based on user's nutrition data"""
    logger.info(f"Insights requested for user {current_user.uid}, timeframe={timeframe}, force_refresh={force_refresh}")
    
    try:
        # Determine date range based on timeframe
        end_date = date.today()
        if timeframe == "week":
            start_date = end_date - timedelta(days=7)
            days_to_analyze = 7
        elif timeframe == "month":
            start_date = end_date - timedelta(days=30)
            days_to_analyze = 30
        elif timeframe == "day":
            start_date = end_date
            days_to_analyze = 1
        else:
            start_date = end_date - timedelta(days=30)
            days_to_analyze = 30
        
        # Get user's food logs for the specified period
        food_logs = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)
        
        if not food_logs:
            return {
                "insights": [],
                "statistics": {},
                "summary": "No food logs found for the specified period. Start logging your meals to get personalized insights!",
                "generated_at": datetime.now().isoformat(),
                "timeframe": timeframe,
                "is_cached": False
            }
        
        # Calculate nutrition statistics
        total_calories = sum(log.total_nutrition.calories for log in food_logs)
        total_protein = sum(log.total_nutrition.protein for log in food_logs)
        total_carbs = sum(log.total_nutrition.carbs for log in food_logs)
        total_fat = sum(log.total_nutrition.fat for log in food_logs)
        logged_days = len(food_logs)
        
        # Calculate averages
        avg_calories = total_calories / logged_days if logged_days > 0 else 0
        avg_protein = total_protein / logged_days if logged_days > 0 else 0
        avg_carbs = total_carbs / logged_days if logged_days > 0 else 0
        avg_fat = total_fat / logged_days if logged_days > 0 else 0
        
        # Generate insights based on the data
        insights = []
        
        # Calorie insights
        if avg_calories > 0:
            if avg_calories < 1200:
                insights.append({
                    "id": "low_calories",
                    "title": "Low Calorie Intake",
                    "content": f"Your average daily intake is {avg_calories:.0f} calories, which may be too low for optimal nutrition. Consider adding healthy, calorie-dense foods to your diet.",
                    "category": "nutrition",
                    "importance": 3
                })
            elif avg_calories > 2500:
                insights.append({
                    "id": "high_calories",
                    "title": "High Calorie Intake",
                    "content": f"Your average daily intake is {avg_calories:.0f} calories. If weight loss is your goal, consider reducing portion sizes or choosing lower-calorie options.",
                    "category": "nutrition",
                    "importance": 2
                })
            else:
                insights.append({
                    "id": "good_calories",
                    "title": "Good Calorie Balance",
                    "content": f"Your average daily intake of {avg_calories:.0f} calories appears to be in a healthy range. Keep up the good work!",
                    "category": "nutrition",
                    "importance": 1
                })
        
        # Protein insights
        if avg_protein > 0:
            if avg_protein < 50:
                insights.append({
                    "id": "low_protein",
                    "title": "Low Protein Intake",
                    "content": f"Your average protein intake is {avg_protein:.0f}g per day. Consider adding lean meats, fish, eggs, or plant-based proteins to reach 1.2-1.6g per kg of body weight.",
                    "category": "nutrition",
                    "importance": 3
                })
            elif avg_protein > 150:
                insights.append({
                    "id": "high_protein",
                    "title": "High Protein Intake",
                    "content": f"You're consuming {avg_protein:.0f}g of protein daily on average. This is excellent for muscle maintenance and satiety!",
                    "category": "nutrition",
                    "importance": 1
                })
            else:
                insights.append({
                    "id": "good_protein",
                    "title": "Adequate Protein Intake",
                    "content": f"Your protein intake of {avg_protein:.0f}g per day is in a good range. Protein helps with muscle maintenance and keeps you feeling full.",
                    "category": "nutrition",
                    "importance": 1
                })
        
        # Consistency insights
        if logged_days < days_to_analyze * 0.5:
            insights.append({
                "id": "low_consistency",
                "title": "Inconsistent Logging",
                "content": f"You've logged {logged_days} out of {days_to_analyze} days. More consistent logging will help provide better insights and track your progress.",
                "category": "habits",
                "importance": 2
            })
        elif logged_days >= days_to_analyze * 0.8:
            insights.append({
                "id": "good_consistency",
                "title": "Great Logging Consistency",
                "content": f"You've logged {logged_days} out of {days_to_analyze} days! This consistency will help you achieve your nutrition goals.",
                "category": "habits",
                "importance": 1
            })
        
        # Meal frequency insights
        total_meals = sum(len(log.meals) for log in food_logs)
        avg_meals_per_day = total_meals / logged_days if logged_days > 0 else 0
        
        if avg_meals_per_day < 2:
            insights.append({
                "id": "low_meal_frequency",
                "title": "Low Meal Frequency",
                "content": f"You're averaging {avg_meals_per_day:.1f} meals per day. Consider having 3-4 smaller meals to maintain steady energy levels throughout the day.",
                "category": "habits",
                "importance": 2
            })
        elif avg_meals_per_day > 6:
            insights.append({
                "id": "high_meal_frequency",
                "title": "High Meal Frequency",
                "content": f"You're averaging {avg_meals_per_day:.1f} meals per day. This frequent eating pattern can be beneficial for metabolism and appetite control.",
                "category": "habits",
                "importance": 1
            })
        
        # Macro balance insights
        total_macros = avg_protein * 4 + avg_carbs * 4 + avg_fat * 9
        if total_macros > 0:
            protein_percent = (avg_protein * 4) / total_macros * 100
            carbs_percent = (avg_carbs * 4) / total_macros * 100
            fat_percent = (avg_fat * 9) / total_macros * 100
            
            if protein_percent < 15:
                insights.append({
                    "id": "low_protein_ratio",
                    "title": "Low Protein Ratio",
                    "content": f"Protein makes up only {protein_percent:.1f}% of your calories. Aim for 20-30% to support muscle health and satiety.",
                    "category": "nutrition",
                    "importance": 2
                })
            
            if carbs_percent > 60:
                insights.append({
                    "id": "high_carb_ratio",
                    "title": "High Carb Intake",
                    "content": f"Carbohydrates make up {carbs_percent:.1f}% of your calories. Consider balancing with more protein and healthy fats.",
                    "category": "nutrition",
                    "importance": 2
                })
            
            if fat_percent < 20:
                insights.append({
                    "id": "low_fat_ratio",
                    "title": "Low Fat Intake",
                    "content": f"Fat makes up only {fat_percent:.1f}% of your calories. Healthy fats are essential for hormone production and nutrient absorption.",
                    "category": "nutrition",
                    "importance": 2
                })
        
        # Add recommendation insights
        insights.append({
            "id": "hydration_reminder",
            "title": "Stay Hydrated",
            "content": "Remember to drink plenty of water throughout the day. Aim for 8-10 glasses of water daily to support your metabolism and overall health.",
            "category": "recommendation",
            "importance": 1
        })
        
        insights.append({
            "id": "variety_recommendation",
            "title": "Food Variety",
            "content": "Try to include a variety of colorful fruits and vegetables in your diet to ensure you're getting a wide range of nutrients and antioxidants.",
            "category": "recommendation",
            "importance": 1
        })
        
        # Statistics for trends
        statistics = {
            "avg_calories": round(avg_calories, 1),
            "avg_protein": round(avg_protein, 1),
            "avg_carbs": round(avg_carbs, 1),
            "avg_fat": round(avg_fat, 1),
            "logged_days": logged_days,
            "total_days": days_to_analyze,
            "avg_meals_per_day": round(avg_meals_per_day, 1),
            "consistency_percentage": round((logged_days / days_to_analyze) * 100, 1) if days_to_analyze > 0 else 0
        }
        
        # Generate summary
        summary = f"Over the past {timeframe}, you've logged {logged_days} days of nutrition data. "
        summary += f"Your average daily intake is {avg_calories:.0f} calories, {avg_protein:.0f}g protein, {avg_carbs:.0f}g carbs, and {avg_fat:.0f}g fat. "
        
        if logged_days >= days_to_analyze * 0.8:
            summary += "Great job maintaining consistent logging! "
        
        high_priority_count = len([i for i in insights if i["importance"] == 3])
        if high_priority_count > 0:
            summary += f"There are {high_priority_count} high-priority areas that need attention. "
        else:
            summary += "Your nutrition patterns look good overall. "
        
        summary += "Keep up the great work and continue tracking your progress!"
        
        return {
            "insights": insights,
            "statistics": statistics,
            "summary": summary,
            "generated_at": datetime.now().isoformat(),
            "timeframe": timeframe,
            "is_cached": False
        }
        
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")

@router.get("/nutrition-trends")
async def get_nutrition_trends(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition trends over specified number of days"""
    logger.info(f"Nutrition trends requested for user {current_user.uid}, days={days}")
    
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get food logs for the period
        food_logs = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)
        
        if not food_logs:
            return {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "days_analyzed": 0,
                "trends": [],
                "message": "No food logs found for the specified period"
            }
        
        # Create trends data
        trends = []
        
        # Calculate averages for the period
        logged_days = len(food_logs)
        avg_calories = sum(log.total_nutrition.calories for log in food_logs) / logged_days
        avg_protein = sum(log.total_nutrition.protein for log in food_logs) / logged_days
        avg_carbs = sum(log.total_nutrition.carbs for log in food_logs) / logged_days
        avg_fat = sum(log.total_nutrition.fat for log in food_logs) / logged_days
        
        # Calculate trends (simplified - compare first half vs second half)
        if logged_days >= 4:
            midpoint = logged_days // 2
            first_half = food_logs[:midpoint]
            second_half = food_logs[midpoint:]
            
            first_half_calories = sum(log.total_nutrition.calories for log in first_half) / len(first_half)
            second_half_calories = sum(log.total_nutrition.calories for log in second_half) / len(second_half)
            
            calorie_trend = ((second_half_calories - first_half_calories) / first_half_calories) * 100 if first_half_calories > 0 else 0
            calorie_direction = "up" if calorie_trend > 5 else "down" if calorie_trend < -5 else "same"
            
            trends.append({
                "name": "Average Daily Calories",
                "value": round(avg_calories, 1),
                "unit": "kcal",
                "trend": round(calorie_trend, 1),
                "trend_direction": calorie_direction
            })
            
            # Similar calculations for other macros
            first_half_protein = sum(log.total_nutrition.protein for log in first_half) / len(first_half)
            second_half_protein = sum(log.total_nutrition.protein for log in second_half) / len(second_half)
            
            protein_trend = ((second_half_protein - first_half_protein) / first_half_protein) * 100 if first_half_protein > 0 else 0
            protein_direction = "up" if protein_trend > 5 else "down" if protein_trend < -5 else "same"
            
            trends.append({
                "name": "Average Daily Protein",
                "value": round(avg_protein, 1),
                "unit": "g",
                "trend": round(protein_trend, 1),
                "trend_direction": protein_direction
            })
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "days_analyzed": logged_days,
            "trends": trends,
            "message": f"Analyzed {logged_days} days of nutrition data"
        }
        
    except Exception as e:
        logger.error(f"Error getting nutrition trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition trends")

@router.get("/goal-progress")
async def get_goal_progress(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get goal progress data"""
    logger.info(f"Goal progress requested for user {current_user.uid}")
    
    try:
        # Get today's nutrition data
        today = date.today()
        daily_summary = await food_log_service.get_daily_logs(current_user.uid, today)
        
        # Get user's nutrition preferences/goals
        nutrition_goals = current_user.preferences.get("nutrition", {})
        
        # Default goals if not set
        calorie_goal = nutrition_goals.get("calorie_goal", 2000)
        protein_goal = nutrition_goals.get("protein_goal", 150)
        carb_goal = nutrition_goals.get("carb_goal", 250)
        fat_goal = nutrition_goals.get("fat_goal", 65)
        
        # Calculate progress
        current_nutrition = daily_summary.total_nutrition
        
        progress = {
            "calories": {
                "current": current_nutrition.calories,
                "target": calorie_goal,
                "percentage": (current_nutrition.calories / calorie_goal) * 100 if calorie_goal > 0 else 0
            },
            "protein": {
                "current": current_nutrition.protein,
                "target": protein_goal,
                "percentage": (current_nutrition.protein / protein_goal) * 100 if protein_goal > 0 else 0
            },
            "carbs": {
                "current": current_nutrition.carbs,
                "target": carb_goal,
                "percentage": (current_nutrition.carbs / carb_goal) * 100 if carb_goal > 0 else 0
            },
            "fat": {
                "current": current_nutrition.fat,
                "target": fat_goal,
                "percentage": (current_nutrition.fat / fat_goal) * 100 if fat_goal > 0 else 0
            }
        }
        
        return {
            "date": today.isoformat(),
            "progress": progress,
            "meals_logged": len(daily_summary.meals),
            "message": f"Progress for {today.strftime('%B %d, %Y')}"
        }
        
    except Exception as e:
        logger.error(f"Error getting goal progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get goal progress")

@router.get("/food-patterns")
async def get_food_patterns(
    days: int = Query(30, description="Number of days to analyze (default: 30)"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get food patterns data"""
    logger.info(f"Food patterns requested for user {current_user.uid}, days={days}")
    
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get food logs for the period
        food_logs = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)
        
        if not food_logs:
            return {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "days_analyzed": 0,
                "patterns": [],
                "message": "No food logs found for the specified period"
            }
        
        # Analyze patterns
        meal_type_counts = {}
        food_frequency = {}
        
        for log in food_logs:
            for meal in log.meals:
                # Count meal types
                meal_type = meal.meal_type
                meal_type_counts[meal_type] = meal_type_counts.get(meal_type, 0) + 1
                
                # Count food frequency
                food_name = meal.food_name
                food_frequency[food_name] = food_frequency.get(food_name, 0) + 1
        
        # Get top foods
        top_foods = sorted(food_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
        
        patterns = [
            {
                "type": "meal_types",
                "data": meal_type_counts,
                "description": "Distribution of meal types"
            },
            {
                "type": "top_foods",
                "data": [{"food": food, "frequency": freq} for food, freq in top_foods],
                "description": "Most frequently consumed foods"
            }
        ]
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "days_analyzed": len(food_logs),
            "patterns": patterns,
            "message": f"Analyzed {len(food_logs)} days of food patterns"
        }
        
    except Exception as e:
        logger.error(f"Error getting food patterns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get food patterns")

@router.get("/macro-breakdown")
async def get_macro_breakdown(
    timeframe: str = Query("week", description="Timeframe for analysis: day, week, month, all"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get macro breakdown data"""
    logger.info(f"Macro breakdown requested for user {current_user.uid}, timeframe={timeframe}")
    
    try:
        # Determine date range
        end_date = date.today()
        if timeframe == "day":
            start_date = end_date
        elif timeframe == "week":
            start_date = end_date - timedelta(days=7)
        elif timeframe == "month":
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get food logs
        food_logs = await food_log_service.get_date_range_logs(current_user.uid, start_date, end_date)
        
        if not food_logs:
            return {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "timeframe": timeframe,
                "breakdown": {},
                "message": "No food logs found for the specified period"
            }
        
        # Calculate totals
        total_calories = sum(log.total_nutrition.calories for log in food_logs)
        total_protein = sum(log.total_nutrition.protein for log in food_logs)
        total_carbs = sum(log.total_nutrition.carbs for log in food_logs)
        total_fat = sum(log.total_nutrition.fat for log in food_logs)
        
        # Calculate percentages
        protein_calories = total_protein * 4
        carbs_calories = total_carbs * 4
        fat_calories = total_fat * 9
        
        breakdown = {
            "totals": {
                "calories": round(total_calories, 1),
                "protein": round(total_protein, 1),
                "carbs": round(total_carbs, 1),
                "fat": round(total_fat, 1)
            },
            "percentages": {
                "protein": round((protein_calories / total_calories) * 100, 1) if total_calories > 0 else 0,
                "carbs": round((carbs_calories / total_calories) * 100, 1) if total_calories > 0 else 0,
                "fat": round((fat_calories / total_calories) * 100, 1) if total_calories > 0 else 0
            },
            "averages": {
                "calories": round(total_calories / len(food_logs), 1),
                "protein": round(total_protein / len(food_logs), 1),
                "carbs": round(total_carbs / len(food_logs), 1),
                "fat": round(total_fat / len(food_logs), 1)
            }
        }
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "timeframe": timeframe,
            "days_analyzed": len(food_logs),
            "breakdown": breakdown,
            "message": f"Macro breakdown for {len(food_logs)} days"
        }
        
    except Exception as e:
        logger.error(f"Error getting macro breakdown: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get macro breakdown")
