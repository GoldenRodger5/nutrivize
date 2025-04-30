from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date
import json
import os
import hashlib
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
import requests
from .constants import USER_ID
from .models import get_user_food_logs, get_user_active_goal, get_user_nutrition_aggregates
from .database import get_database
from .auth import get_current_user_id
from .utils import get_openai_client, format_date
from .food_logs import get_food_logs_for_timeframe
from .goals import get_user_goals

router = APIRouter()

# Pydantic models for insights
class InsightRequest(BaseModel):
    user_id: str
    force_refresh: bool = False
    days_to_analyze: int = 7

class Insight(BaseModel):
    title: str
    content: str
    category: str  # nutrition, progress, habit, etc.
    importance: int  # 1-5, with 5 being most important

class Statistic(BaseModel):
    name: str
    value: float
    unit: str
    trend: Optional[float] = None  # percentage change from previous period
    trend_direction: Optional[str] = None  # "up", "down", or "same"

class Chart(BaseModel):
    chart_type: str  # "line", "bar", "pie", etc.
    title: str
    data: Dict[str, Any]  # Flexible structure for chart data

class InsightResponse(BaseModel):
    insights: List[Insight]
    statistics: List[Statistic]
    charts: List[Chart]
    generated_at: datetime
    is_cached: bool

# Database collection for caching insights
db = get_database()
insights_cache = db["insights_cache"]

# Initialize cache if needed
if "insights_cache" not in db.list_collection_names():
    insights_cache.create_index("user_id")
    insights_cache.create_index("generated_at")

# Cache insights for 24 hours
INSIGHTS_CACHE = {}
CACHE_DURATION = 60 * 60 * 24  # 24 hours in seconds

class InsightCategory:
    NUTRITION = "nutrition"
    HABITS = "habits"
    PROGRESS = "progress"
    RECOMMENDATION = "recommendation"

@router.get("/insights")
async def get_insights(
    timeframe: str = "week",
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate AI insights based on user's food logs, goals, and patterns.
    Timeframe can be 'week', 'month', or 'all'.
    """
    # Generate cache key based on user_id and timeframe
    cache_key = f"{user_id}_{timeframe}_{datetime.now().strftime('%Y-%m-%d')}"
    cache_key_hash = hashlib.md5(cache_key.encode()).hexdigest()
    
    # Check if insights are in cache and still valid
    if cache_key_hash in INSIGHTS_CACHE:
        cached_time, cached_data = INSIGHTS_CACHE[cache_key_hash]
        if (datetime.now() - cached_time).total_seconds() < CACHE_DURATION:
            cached_data["cached"] = True
            cached_data["cached_time"] = cached_time.isoformat()
            return cached_data
    
    # Get user data from MongoDB
    db = get_database()
    users_collection = db["users"]
    user = users_collection.find_one({"uid": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get food logs for the specified timeframe
    start_date = None
    if timeframe == "week":
        start_date = datetime.now() - timedelta(days=7)
    elif timeframe == "month":
        start_date = datetime.now() - timedelta(days=30)
    
    food_logs = await get_food_logs_for_timeframe(
        db, 
        user_id, 
        start_date=start_date
    )
    
    # Get user goals
    goals = await get_user_goals(db, user_id)
    
    # Calculate basic statistics
    statistics = await calculate_statistics(user_id, food_logs, timeframe)
    
    # Generate insights using AI
    insights = await generate_ai_insights(user, food_logs, goals, statistics, timeframe)
    
    # Generate charts data
    charts = await generate_charts_data(user_id, food_logs, timeframe)
    
    # Prepare response
    response = {
        "cached": False,
        "generated_time": datetime.now().isoformat(),
        "timeframe": timeframe,
        "statistics": statistics,
        "insights": insights,
        "charts": charts
    }
    
    # Cache the response
    INSIGHTS_CACHE[cache_key_hash] = (datetime.now(), response)
    
    return response

async def calculate_statistics(
    user_id: str, 
    food_logs: List[Dict], 
    timeframe: str
) -> Dict[str, Any]:
    """Calculate basic statistics from food logs."""
    stats = {}
    
    # Only calculate if we have logs
    if not food_logs:
        return {
            "total_logs": 0,
            "avg_calories": 0,
            "avg_protein": 0,
            "avg_carbs": 0,
            "avg_fat": 0,
            "most_eaten_food": None,
            "most_consistent_meal": None
        }
    
    # Count logs
    stats["total_logs"] = len(food_logs)
    
    # Average nutritional values
    total_calories = sum([log.get("calories", 0) for log in food_logs])
    total_protein = sum([log.get("protein_g", 0) for log in food_logs])
    total_carbs = sum([log.get("carbs_g", 0) for log in food_logs])
    total_fat = sum([log.get("fat_g", 0) for log in food_logs])
    
    # Calculate daily averages if we have more than one day of logs
    unique_days = len(set([log.get("date").split("T")[0] for log in food_logs]))
    if unique_days > 0:
        stats["avg_calories"] = round(total_calories / unique_days, 1)
        stats["avg_protein"] = round(total_protein / unique_days, 1)
        stats["avg_carbs"] = round(total_carbs / unique_days, 1)
        stats["avg_fat"] = round(total_fat / unique_days, 1)
    else:
        stats["avg_calories"] = 0
        stats["avg_protein"] = 0
        stats["avg_carbs"] = 0
        stats["avg_fat"] = 0
    
    # Find most eaten food
    food_counts = {}
    for log in food_logs:
        food_name = log.get("food_name", "Unknown")
        food_counts[food_name] = food_counts.get(food_name, 0) + 1
    
    if food_counts:
        most_eaten = max(food_counts.items(), key=lambda x: x[1])
        stats["most_eaten_food"] = {
            "name": most_eaten[0],
            "count": most_eaten[1]
        }
    else:
        stats["most_eaten_food"] = None
    
    # Calculate meal consistency
    meal_times = {}
    for log in food_logs:
        meal_type = log.get("meal_type", "Unknown")
        meal_times[meal_type] = meal_times.get(meal_type, 0) + 1
    
    if meal_times:
        most_consistent = max(meal_times.items(), key=lambda x: x[1])
        stats["most_consistent_meal"] = {
            "name": most_consistent[0],
            "count": most_consistent[1]
        }
    else:
        stats["most_consistent_meal"] = None
    
    # Get comparative data from previous timeframe if available
    if timeframe == "week":
        previous_start = datetime.now() - timedelta(days=14)
        previous_end = datetime.now() - timedelta(days=7)
    elif timeframe == "month":
        previous_start = datetime.now() - timedelta(days=60)
        previous_end = datetime.now() - timedelta(days=30)
    else:
        previous_start = None
        previous_end = None
    
    if previous_start and previous_end:
        previous_logs = await db.fetch_all(
            """
            SELECT *
            FROM food_logs
            WHERE user_id = :user_id
            AND date BETWEEN :start_date AND :end_date
            ORDER BY date DESC
            """,
            {
                "user_id": user_id,
                "start_date": previous_start.isoformat(),
                "end_date": previous_end.isoformat()
            }
        )
        
        if previous_logs:
            unique_prev_days = len(set([log.get("date").split("T")[0] for log in previous_logs]))
            if unique_prev_days > 0:
                prev_total_calories = sum([log.get("calories", 0) for log in previous_logs])
                prev_total_protein = sum([log.get("protein_g", 0) for log in previous_logs])
                
                prev_avg_calories = prev_total_calories / unique_prev_days
                prev_avg_protein = prev_total_protein / unique_prev_days
                
                stats["calories_change"] = round(((stats["avg_calories"] - prev_avg_calories) / prev_avg_calories * 100 
                                                if prev_avg_calories > 0 else 0), 1)
                stats["protein_change"] = round(((stats["avg_protein"] - prev_avg_protein) / prev_avg_protein * 100 
                                               if prev_avg_protein > 0 else 0), 1)
    
    return stats

async def generate_charts_data(
    user_id: str,
    food_logs: List[Dict], 
    timeframe: str
) -> Dict[str, Any]:
    """Generate data for charts based on food logs."""
    
    # Initialize charts data
    charts = {
        "calories_over_time": {
            "labels": [],
            "datasets": [{
                "label": "Calories",
                "data": []
            }]
        },
        "macros_distribution": {
            "labels": ["Protein", "Carbs", "Fat"],
            "datasets": [{
                "data": [0, 0, 0],
                "backgroundColor": ["#3498db", "#2ecc71", "#f39c12"]
            }]
        },
        "meal_type_distribution": {
            "labels": [],
            "datasets": [{
                "label": "Meal Count",
                "data": [],
                "backgroundColor": ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"]
            }]
        }
    }
    
    if not food_logs:
        return charts
    
    # Group logs by date for calories over time
    date_calories = {}
    for log in food_logs:
        date_str = log.get("date", "").split("T")[0]
        date_calories[date_str] = date_calories.get(date_str, 0) + log.get("calories", 0)
    
    # Sort dates for consistent display
    sorted_dates = sorted(date_calories.keys())
    
    # Prepare calories over time data
    charts["calories_over_time"]["labels"] = [format_date(date) for date in sorted_dates]
    charts["calories_over_time"]["datasets"][0]["data"] = [date_calories[date] for date in sorted_dates]
    
    # Calculate macro totals for distribution chart
    total_protein = sum([log.get("protein_g", 0) for log in food_logs])
    total_carbs = sum([log.get("carbs_g", 0) for log in food_logs])
    total_fat = sum([log.get("fat_g", 0) for log in food_logs])
    
    charts["macros_distribution"]["datasets"][0]["data"] = [
        round(total_protein, 1),
        round(total_carbs, 1),
        round(total_fat, 1)
    ]
    
    # Calculate meal type distribution
    meal_types = {}
    for log in food_logs:
        meal_type = log.get("meal_type", "Unknown")
        meal_types[meal_type] = meal_types.get(meal_type, 0) + 1
    
    charts["meal_type_distribution"]["labels"] = list(meal_types.keys())
    charts["meal_type_distribution"]["datasets"][0]["data"] = list(meal_types.values())
    
    return charts

async def generate_ai_insights(
    user: Dict, 
    food_logs: List[Dict], 
    goals: Dict, 
    statistics: Dict,
    timeframe: str
) -> List[Dict]:
    """Generate AI insights based on user data."""
    if not food_logs:
        return [
            {
                "id": "no_data",
                "title": "No Data Available",
                "content": "Start logging your meals to receive personalized insights and recommendations.",
                "category": InsightCategory.RECOMMENDATION,
                "importance": 2
            }
        ]
    
    # Prepare data for the AI prompt
    user_data = {
        "name": user["name"],
        "age": user.get("age"),
        "gender": user.get("gender"),
        "height": user.get("height"),
        "weight": user.get("weight"),
        "activity_level": user.get("activity_level")
    }
    
    # Filter out None values
    user_data = {k: v for k, v in user_data.items() if v is not None}
    
    # Format logs to be more concise for the prompt
    simplified_logs = []
    for log in food_logs:
        simplified_logs.append({
            "date": log.get("date"),
            "food_name": log.get("food_name"),
            "meal_type": log.get("meal_type"),
            "calories": log.get("calories"),
            "protein_g": log.get("protein_g"),
            "carbs_g": log.get("carbs_g"),
            "fat_g": log.get("fat_g")
        })
    
    # Create prompt for AI
    prompt = f"""
    You are a nutrition and health expert. Analyze the following user data and food logs to provide 5-7 insightful observations, tips, or recommendations.
    
    User Information:
    {json.dumps(user_data, indent=2)}
    
    User Goals:
    {json.dumps(goals, indent=2)}
    
    Food Logs Overview ({timeframe}):
    {json.dumps(statistics, indent=2)}
    
    Recent Food Logs (last {min(len(simplified_logs), 10)} entries):
    {json.dumps(simplified_logs[:10], indent=2)}
    
    For each insight, provide:
    1. A short, specific title (5-7 words)
    2. A brief explanation or recommendation (2-3 sentences)
    3. Categorize it as one of: "nutrition", "habits", "progress", or "recommendation"
    4. Assign an importance level from 1-3 (3 being most important)
    
    Format your response as a valid JSON array of objects with the keys: "title", "content", "category", and "importance".
    """
    
    # Get OpenAI client
    client = get_openai_client()
    if not client:
        # If OpenAI client is not available, return basic insights
        return generate_basic_insights(statistics, timeframe)
    
    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a nutrition analysis expert that provides concise, specific insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Parse the response as JSON
        content = response.choices[0].message.content.strip()
        
        # Extract JSON from the response - handle potential formatting issues
        json_start = content.find('[')
        json_end = content.rfind(']') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_str = content[json_start:json_end]
            insights = json.loads(json_str)
            
            # Add IDs to each insight
            for i, insight in enumerate(insights):
                insight["id"] = f"insight_{i}"
            
            return insights
        else:
            # Fallback to basic insights if parsing fails
            return generate_basic_insights(statistics, timeframe)
            
    except Exception as e:
        print(f"Error generating AI insights: {str(e)}")
        return generate_basic_insights(statistics, timeframe)

def generate_basic_insights(statistics: Dict, timeframe: str) -> List[Dict]:
    """Generate basic insights without AI, based on statistics."""
    insights = []
    
    # Insight about calories
    if statistics.get("avg_calories", 0) > 0:
        insights.append({
            "id": "calories_insight",
            "title": "Your Caloric Intake Overview",
            "content": f"You've been consuming an average of {statistics['avg_calories']} calories per day. Pay attention to your energy needs based on your goals and activity level.",
            "category": InsightCategory.NUTRITION,
            "importance": 2
        })
    
    # Insight about protein
    if statistics.get("avg_protein", 0) > 0:
        importance = 1
        content = f"You're consuming an average of {statistics['avg_protein']}g of protein daily."
        
        if statistics["avg_protein"] < 50:
            content += " Consider increasing your protein intake to support muscle maintenance and recovery."
            importance = 3
        else:
            content += " Protein is essential for muscle maintenance and recovery."
        
        insights.append({
            "id": "protein_insight",
            "title": "Protein Intake Assessment",
            "content": content,
            "category": InsightCategory.NUTRITION,
            "importance": importance
        })
    
    # Insight about most eaten food
    if statistics.get("most_eaten_food"):
        insights.append({
            "id": "favorite_food",
            "title": "Your Favorite Food Item",
            "content": f"You've eaten {statistics['most_eaten_food']['name']} {statistics['most_eaten_food']['count']} times during this period. Food preferences can affect your overall nutrition profile.",
            "category": InsightCategory.HABITS,
            "importance": 1
        })
    
    # Insight about most consistent meal
    if statistics.get("most_consistent_meal"):
        insights.append({
            "id": "meal_consistency",
            "title": "Meal Pattern Detected",
            "content": f"You're most consistent with your {statistics['most_consistent_meal']['name']} meals. Consistent meal timing can help regulate metabolism and energy levels.",
            "category": InsightCategory.HABITS,
            "importance": 2
        })
    
    # Insight about logging consistency
    if statistics.get("total_logs", 0) > 0:
        days_in_period = 7 if timeframe == "week" else 30 if timeframe == "month" else 90
        avg_logs_per_day = statistics["total_logs"] / days_in_period
        
        content = f"You've logged {statistics['total_logs']} meals over this {timeframe}."
        
        if avg_logs_per_day < 1:
            content += " More consistent logging will provide better insights for your nutrition journey."
            insights.append({
                "id": "logging_consistency",
                "title": "Improve Your Logging Consistency",
                "content": content,
                "category": InsightCategory.RECOMMENDATION,
                "importance": 3
            })
        else:
            content += " Great job maintaining consistent food logging!"
            insights.append({
                "id": "logging_consistency",
                "title": "Good Logging Habits",
                "content": content,
                "category": InsightCategory.PROGRESS,
                "importance": 1
            })
    
    # Add generic recommendation if we have few insights
    if len(insights) < 3:
        insights.append({
            "id": "balanced_diet",
            "title": "Focus on a Balanced Diet",
            "content": "Aim for a balanced diet with a variety of fruits, vegetables, lean proteins, and whole grains. This helps ensure you get all necessary nutrients.",
            "category": InsightCategory.RECOMMENDATION,
            "importance": 2
        })
    
    return insights

@router.post("/insights", response_model=InsightResponse)
async def get_insights(request: InsightRequest):
    """
    Get AI-generated insights based on user's nutritional data
    """
    user_id = request.user_id or USER_ID
    force_refresh = request.force_refresh
    days_to_analyze = request.days_to_analyze
    
    # Check cache first unless forced refresh
    if not force_refresh:
        # Look for insights generated today
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        cached_insight = insights_cache.find_one({
            "user_id": user_id,
            "generated_at": {"$gte": today},
            "days_analyzed": days_to_analyze
        })
        
        if cached_insight:
            # Return cached insights
            cached_insight["is_cached"] = True
            # Convert ObjectId to string for JSON serialization
            cached_insight["_id"] = str(cached_insight["_id"])
            return InsightResponse(**cached_insight)
    
    # Generate new insights
    user_data = await get_user_data_for_insights(user_id, days_to_analyze)
    insights_data = await generate_insights_from_ai(user_data)
    
    # Prepare response
    now = datetime.now()
    response_data = {
        "user_id": user_id,
        "insights": insights_data.get("insights", []),
        "statistics": insights_data.get("statistics", []),
        "charts": insights_data.get("charts", []),
        "generated_at": now,
        "is_cached": False,
        "days_analyzed": days_to_analyze
    }
    
    # Save to cache
    insights_cache.update_one(
        {"user_id": user_id, "days_analyzed": days_to_analyze},
        {"$set": response_data},
        upsert=True
    )
    
    return InsightResponse(**response_data)

@router.delete("/insights/cache/{user_id}")
async def clear_insights_cache(user_id: str):
    """
    Clear cached insights for a user
    """
    result = insights_cache.delete_many({"user_id": user_id})
    return {"deleted_count": result.deleted_count} 