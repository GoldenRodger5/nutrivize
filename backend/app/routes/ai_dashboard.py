"""
AI Dashboard Routes - API endpoints for the AI-first dashboard
"""

from fastapi import APIRouter, Depends, HTTPException
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_dashboard_service import ai_dashboard_service
from typing import Dict, Any
from datetime import datetime
from collections import defaultdict

router = APIRouter(prefix="/ai-dashboard", tags=["ai-dashboard"])

@router.get("/coaching", response_model=Dict[str, Any])
async def get_ai_coaching(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get personalized AI health coaching insights"""
    try:
        coaching_data = await ai_dashboard_service.get_ai_health_coaching(current_user.uid)
        return coaching_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AI coaching: {str(e)}")

@router.get("/nutrition", response_model=Dict[str, Any])
async def get_smart_nutrition(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get real-time smart nutrition data"""
    try:
        nutrition_data = await ai_dashboard_service.get_smart_nutrition_data(current_user.uid)
        return nutrition_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting nutrition data: {str(e)}")

@router.get("/predictions", response_model=Dict[str, Any])
async def get_predictive_analytics(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get AI-powered predictive health analytics"""
    try:
        predictions = await ai_dashboard_service.get_predictive_analytics(current_user.uid)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

@router.get("/optimizations", response_model=Dict[str, Any])
async def get_live_optimizations(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get real-time meal and nutrition optimizations"""
    try:
        optimizations = await ai_dashboard_service.get_live_optimizations(current_user.uid)
        return optimizations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating optimizations: {str(e)}")

@router.get("/weekly-progress", response_model=Dict[str, Any])
async def get_weekly_progress(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get weekly progress summary for dashboard"""
    try:
        from datetime import date, timedelta
        from collections import defaultdict
        
        # Get last 7 days of data
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        # Get food logs for the week
        food_logs = list(ai_dashboard_service.db.food_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
        }))
        
        # Get water logs for the week (include tomorrow's date to handle timezone issues)
        tomorrow = end_date + timedelta(days=1)
        water_logs = list(ai_dashboard_service.db.water_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": start_date.isoformat(), "$lte": tomorrow.isoformat()}
        }))
        
        # Calculate metrics
        daily_logs = defaultdict(lambda: {"food_count": 0, "water_amount": 0})
        total_calories = 0
        
        for log in food_logs:
            log_date = log.get("date")
            daily_logs[log_date]["food_count"] += 1
            total_calories += log.get("nutrition", {}).get("calories", 0)
        
        for log in water_logs:
            log_date = log.get("date")
            daily_logs[log_date]["water_amount"] += log.get("amount", 0)
        
        # Calculate streak (consecutive days with food logs)
        streak = 0
        current_date = end_date
        while current_date >= start_date:
            if daily_logs[current_date.isoformat()]["food_count"] > 0:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        # Calculate goal achievement (simplified)
        days_with_logs = len([d for d in daily_logs.values() if d["food_count"] > 0])
        goal_achievement = round((days_with_logs / 7) * 100)
        
        # Calculate total metrics
        total_meals = sum(d["food_count"] for d in daily_logs.values())
        total_water = sum(d["water_amount"] for d in daily_logs.values())
        
        return {
            "streak_days": streak,
            "goal_achievement": goal_achievement,
            "meals_logged": total_meals,
            "water_intake": f"{total_water}L",
            "trend": "improving" if streak >= 3 else "stable",
            "weekly_calories": round(total_calories),
            "consistency_score": round((days_with_logs / 7) * 100)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting weekly progress: {str(e)}")

@router.get("/nutrition-streak", response_model=Dict[str, Any])
async def get_nutrition_streak(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get nutrition logging streak information"""
    try:
        from datetime import date, timedelta
        
        # Get last 30 days of data to calculate streak
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Get food logs for the period
        food_logs = list(ai_dashboard_service.db.food_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
        }))
        
        # Group by date
        daily_logs = defaultdict(int)
        for log in food_logs:
            daily_logs[log.get("date")] += 1
        
        # Calculate current streak
        current_streak = 0
        current_date = end_date
        while current_date >= start_date:
            date_str = current_date.isoformat()
            if daily_logs[date_str] > 0:
                current_streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        # Calculate best streak in last 30 days
        best_streak = 0
        temp_streak = 0
        for i in range(30):
            check_date = end_date - timedelta(days=i)
            if daily_logs[check_date.isoformat()] > 0:
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
            else:
                temp_streak = 0
        
        # Calculate next milestone
        milestones = [7, 14, 30, 50, 100]
        next_milestone = next((m for m in milestones if m > current_streak), 100)
        
        return {
            "current_streak": current_streak,
            "best_streak": best_streak,
            "next_milestone": next_milestone,
            "progress_to_milestone": round((current_streak / next_milestone) * 100),
            "milestone_name": f"{next_milestone} Day Champion" if next_milestone <= 30 else "Consistency Master",
            "streak_status": "on_fire" if current_streak >= 5 else "building" if current_streak >= 2 else "starting"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting nutrition streak: {str(e)}")

@router.get("/health-score", response_model=Dict[str, Any])
async def get_health_score(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comprehensive AI-calculated health score based on nutrition and habits"""
    try:
        from datetime import date, timedelta
        import random
        
        # Get last 7 days of data
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        # Get food logs for analysis
        food_logs = list(ai_dashboard_service.db.food_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
        }))
        
        # Get water logs (include tomorrow's date to handle timezone issues)
        tomorrow = end_date + timedelta(days=1)
        water_logs = list(ai_dashboard_service.db.water_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": start_date.isoformat(), "$lte": tomorrow.isoformat()}
        }))
        
        # Calculate health metrics
        total_calories = sum(log.get("nutrition", {}).get("calories", 0) for log in food_logs)
        total_protein = sum(log.get("nutrition", {}).get("protein", 0) for log in food_logs)
        total_carbs = sum(log.get("nutrition", {}).get("carbs", 0) for log in food_logs)
        total_fat = sum(log.get("nutrition", {}).get("fat", 0) for log in food_logs)
        total_fiber = sum(log.get("nutrition", {}).get("fiber", 0) for log in food_logs)
        total_water = sum(log.get("amount", 0) for log in water_logs)
        
        days_logged = len(set(log.get("date") for log in food_logs))
        consistency_score = (days_logged / 7) * 100
        
        # Calculate macro balance score (protein should be 15-30%, carbs 45-65%, fat 20-35%)
        daily_calories = max(total_calories / max(days_logged, 1), 1)  # Prevent division by zero
        protein_percent = (total_protein * 4) / daily_calories * 100 if daily_calories > 0 else 0
        carbs_percent = (total_carbs * 4) / daily_calories * 100 if daily_calories > 0 else 0
        fat_percent = (total_fat * 9) / daily_calories * 100 if daily_calories > 0 else 0
        
        # Score components (0-100) with proper validation
        macro_balance_score = 100
        if protein_percent < 15 or protein_percent > 30:
            macro_balance_score -= 20
        if carbs_percent < 45 or carbs_percent > 65:
            macro_balance_score -= 20
        if fat_percent < 20 or fat_percent > 35:
            macro_balance_score -= 20
        
        # Ensure macro_balance_score is not negative
        macro_balance_score = max(0, macro_balance_score)
        
        # Nutrient density score (based on variety and fiber)
        avg_daily_fiber = total_fiber / max(days_logged, 1)
        nutrient_density_score = min(100, (avg_daily_fiber / 25) * 100)
        
        # Hydration score
        avg_daily_water = total_water / max(days_logged, 1)
        hydration_score = min(100, (avg_daily_water / 64) * 100)
        
        # Meal timing score (based on frequency of meals)
        avg_meals_per_day = len(food_logs) / max(days_logged, 1)
        meal_timing_score = min(100, (avg_meals_per_day / 3) * 100)
        
        # Calculate overall health score with validation
        health_score = round(
            (consistency_score * 0.25) + 
            (macro_balance_score * 0.25) + 
            (nutrient_density_score * 0.2) + 
            (hydration_score * 0.15) + 
            (meal_timing_score * 0.15)
        )
        
        # Ensure health_score is valid
        health_score = max(0, min(100, health_score))
        
        # Generate AI insights
        ai_insights = await ai_dashboard_service.unified_ai.get_dashboard_data(current_user.uid, "health_insights")
        
        # Determine status
        if health_score >= 85:
            status = "Excellent"
            trend = "improving"
        elif health_score >= 70:
            status = "Good"
            trend = "improving"
        elif health_score >= 50:
            status = "Fair"
            trend = "stable"
        else:
            status = "Needs Improvement"
            trend = "declining"
        
        # Generate specific areas to improve
        areas_to_improve = []
        if consistency_score < 80:
            areas_to_improve.append("Improve logging consistency to track progress better")
        if macro_balance_score < 80:
            areas_to_improve.append("Balance your macronutrients better (protein, carbs, fat)")
        if nutrient_density_score < 70:
            areas_to_improve.append("Increase fiber intake with more vegetables and whole grains")
        if hydration_score < 70:
            areas_to_improve.append("Increase water intake to stay properly hydrated")
        if meal_timing_score < 70:
            areas_to_improve.append("Eat more regular meals throughout the day")
        
        return {
            "overall_score": health_score,
            "trend": trend,
            "component_scores": {
                "nutrition": round(macro_balance_score),
                "hydration": round(hydration_score),
                "consistency": round(consistency_score),
                "meal_timing": round(meal_timing_score)
            },
            "improvement_areas": [
                {
                    "area": area,
                    "score": 60,
                    "recommendations": [area]
                } for area in areas_to_improve
            ],
            "ai_insights": {
                "short_term_insights": ai_insights.get("insights", "Keep up the great work!"),
                "long_term_recommendations": "Focus on consistency and balanced nutrition",
                "nutrition_insights": f"Your macro balance score is {macro_balance_score:.0f}/100",
                "lifestyle_insights": f"Your consistency score is {consistency_score:.0f}/100",
                "next_steps": areas_to_improve[:3]
            },
            "calculation_breakdown": {
                "consistency": {
                    "score": round(consistency_score),
                    "weight": 25,
                    "description": f"Logged {days_logged} out of 7 days"
                },
                "macro_balance": {
                    "score": round(macro_balance_score),
                    "weight": 25,
                    "description": f"Protein: {protein_percent:.1f}%, Carbs: {carbs_percent:.1f}%, Fat: {fat_percent:.1f}%"
                },
                "nutrient_density": {
                    "score": round(nutrient_density_score),
                    "weight": 20,
                    "description": f"Average fiber: {avg_daily_fiber:.1f}g/day"
                },
                "hydration": {
                    "score": round(hydration_score),
                    "weight": 15,
                    "description": f"Average water: {avg_daily_water:.1f}oz/day"
                },
                "meal_timing": {
                    "score": round(meal_timing_score),
                    "weight": 15,
                    "description": f"Average meals: {avg_meals_per_day:.1f}/day"
                }
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating health score: {str(e)}")

@router.post("/health-score/refresh")
async def refresh_health_score(
    current_user: UserResponse = Depends(get_current_user)
):
    """Refresh health score analysis with latest data"""
    try:
        # This endpoint allows manual refresh of health score
        refreshed_score = await get_health_score(current_user)
        return {
            "success": True,
            "message": "Health score refreshed successfully",
            "data": refreshed_score,
            "refreshed_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing health score: {str(e)}")

@router.get("/progress-analytics", response_model=Dict[str, Any])
async def get_progress_analytics(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comprehensive progress analytics for dashboard"""
    try:
        from datetime import date, timedelta
        
        # Get date ranges
        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get weight logs
        weight_logs = list(ai_dashboard_service.db.weight_logs.find({
            "user_id": current_user.uid
        }).sort("date", -1).limit(30))
        
        # Get food logs for calorie tracking
        food_logs = list(ai_dashboard_service.db.food_logs.find({
            "user_id": current_user.uid,
            "date": {"$gte": month_ago.isoformat()}
        }))
        
        # Get user goals
        goals = list(ai_dashboard_service.db.goals.find({
            "user_id": current_user.uid,
            "active": True
        }))
        
        # Calculate weight progress
        weight_progress = {
            "start_weight": 0,
            "current_weight": 0,
            "target_weight": 0,
            "weight_lost_so_far": "0 lbs",
            "remaining_weight": "0 lbs",
            "percent_complete": 0,
            "current_rate": "0 lbs/week",
            "weekly_goal": 1.0,
            "estimated_completion": "No data available"
        }
        
        if weight_logs:
            current_weight = weight_logs[0].get("weight", 0)
            start_weight = weight_logs[-1].get("weight", current_weight) if len(weight_logs) > 1 else current_weight
            
            # Get target from goals
            target_weight = current_weight - 10  # Default target
            for goal in goals:
                if goal.get("type") == "weight_loss" and goal.get("target_weight"):
                    target_weight = goal["target_weight"]
                    break
            
            weight_lost = start_weight - current_weight
            remaining_weight = current_weight - target_weight
            percent_complete = (weight_lost / max(start_weight - target_weight, 1)) * 100
            
            # Calculate rate (last 2 weeks)
            recent_weights = [log for log in weight_logs if log.get("date") >= week_ago.isoformat()]
            if len(recent_weights) >= 2:
                recent_change = recent_weights[0].get("weight", 0) - recent_weights[-1].get("weight", 0)
                weeks_span = len(recent_weights) / 7
                current_rate = recent_change / max(weeks_span, 1)
            else:
                current_rate = 0
            
            # Calculate estimated completion
            if current_rate > 0 and remaining_weight > 0:
                weeks_to_goal = remaining_weight / current_rate
                if weeks_to_goal > 0:
                    from datetime import timedelta
                    completion_date = today + timedelta(weeks=weeks_to_goal)
                    estimated_completion = completion_date.strftime("%b %d, %Y")
                else:
                    estimated_completion = "Goal achieved"
            else:
                estimated_completion = "Need more data"
            
            weight_progress.update({
                "start_weight": round(start_weight * 10) / 10,
                "current_weight": round(current_weight * 10) / 10,
                "target_weight": round(target_weight * 10) / 10,
                "weight_lost_so_far": f"{round(weight_lost * 10) / 10} lbs",
                "remaining_weight": f"{round(remaining_weight * 10) / 10} lbs",
                "percent_complete": max(0, min(100, round(percent_complete))),
                "current_rate": f"{round(current_rate * 10) / 10} lbs/week",
                "estimated_completion": estimated_completion
            })
        
        # Calculate achievement rate
        daily_goals = {}
        for log in food_logs:
            log_date = log.get("date")
            if log_date not in daily_goals:
                daily_goals[log_date] = {"calories": 0, "protein": 0, "target_calories": 2000, "target_protein": 150}
            
            nutrition = log.get("nutrition", {})
            daily_goals[log_date]["calories"] += nutrition.get("calories", 0)
            daily_goals[log_date]["protein"] += nutrition.get("protein", 0)
        
        # Calculate achievement rate
        achievement_days = 0
        total_days = len(daily_goals)
        
        for day_data in daily_goals.values():
            calories_ok = abs(day_data["calories"] - day_data["target_calories"]) <= 300
            protein_ok = day_data["protein"] >= day_data["target_protein"] * 0.8
            if calories_ok and protein_ok:
                achievement_days += 1
        
        achievement_rate = (achievement_days / max(total_days, 1)) * 100
        
        # Consistency score
        logged_days = len(set(log.get("date") for log in food_logs))
        consistency_score = (logged_days / 30) * 100
        
        return {
            "weight_progress": weight_progress,
            "achievement_rate": round(achievement_rate),
            "streak_days": logged_days,
            "consistency_score": round(consistency_score),
            "ai_insights": {
                "progress_summary": f"You've logged {logged_days} days this month with {achievement_rate:.0f}% goal achievement rate",
                "achievement_insights": "Great consistency!" if consistency_score >= 80 else "Try to log more regularly",
                "milestone_projections": [],
                "focus_areas": ["Consistent logging", "Meeting calorie goals", "Adequate protein intake"]
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting progress analytics: {str(e)}")

@router.get("/health-insights", response_model=Dict[str, Any])
async def get_health_insights(
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate comprehensive health insights and recommendations"""
    try:
        # Get comprehensive health insights using the unified AI service
        insights = await ai_dashboard_service.unified_ai.get_health_insights(current_user.uid)
        return {
            "success": True,
            "insights": insights,
            "generated_at": datetime.now().isoformat(),
            "user_id": current_user.uid
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating health insights: {str(e)}")

@router.get("/todays-nutrition-detail", response_model=Dict[str, Any])
async def get_todays_nutrition_detail(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get detailed breakdown of today's nutrition by meal and time"""
    try:
        from datetime import date
        today = date.today()
        
        # Get today's food logs
        food_logs = list(ai_dashboard_service.db.food_logs.find({
            "user_id": current_user.uid,
            "date": today.isoformat()
        }).sort("logged_at", 1))
        
        # Get user's nutrition targets
        active_goals = list(ai_dashboard_service.db.goals.find({
            "user_id": current_user.uid,
            "active": True
        }))
        
        # Default targets
        targets = {
            "calories": 2000,
            "protein": 150,
            "carbs": 250,
            "fat": 65,
            "fiber": 25,
            "sodium": 2300,
            "sugar": 50
        }
        
        # Update with user's goals if available
        for goal in active_goals:
            if goal.get("nutrition_targets"):
                targets.update(goal["nutrition_targets"])
                break
        
        # Organize by meal type and calculate totals
        meals_breakdown = {
            "breakfast": {"logs": [], "totals": {}},
            "lunch": {"logs": [], "totals": {}},
            "dinner": {"logs": [], "totals": {}},
            "snack": {"logs": [], "totals": {}}
        }
        
        overall_totals = {
            "calories": 0, "protein": 0, "carbs": 0, "fat": 0, 
            "fiber": 0, "sodium": 0, "sugar": 0
        }
        
        # Process each food log
        for log in food_logs:
            # Clean the log data
            clean_log = {
                "_id": str(log["_id"]),
                "food_name": log.get("food_name", "Unknown Food"),
                "amount": log.get("amount", 0),
                "unit": log.get("unit", "serving"),
                "meal_type": log.get("meal_type", "snack"),
                "logged_at": log.get("logged_at").isoformat() if log.get("logged_at") else None,
                "nutrition": log.get("nutrition", {}),
                "notes": log.get("notes", "")
            }
            
            meal_type = clean_log["meal_type"].lower()
            if meal_type not in meals_breakdown:
                meal_type = "snack"
            
            meals_breakdown[meal_type]["logs"].append(clean_log)
            
            # Add to totals
            nutrition = clean_log["nutrition"]
            for nutrient in overall_totals:
                amount = nutrition.get(nutrient, 0)
                overall_totals[nutrient] += amount
                
                # Add to meal totals
                if nutrient not in meals_breakdown[meal_type]["totals"]:
                    meals_breakdown[meal_type]["totals"][nutrient] = 0
                meals_breakdown[meal_type]["totals"][nutrient] += amount
        
        # Calculate percentages of targets
        target_percentages = {}
        for nutrient, total in overall_totals.items():
            target = targets.get(nutrient, 100)
            percentage = round((total / target) * 100, 1) if target > 0 else 0
            target_percentages[nutrient] = {
                "current": round(total, 1),
                "target": target,
                "percentage": min(100, percentage),  # Cap at 100% for display
                "remaining": max(0, target - total)
            }
        
        # Calculate meal timing insights
        meal_times = []
        for log in food_logs:
            if log.get("logged_at"):
                try:
                    log_time = log["logged_at"]
                    if isinstance(log_time, str):
                        log_time = datetime.fromisoformat(log_time.replace('Z', '+00:00'))
                    meal_times.append({
                        "time": log_time.strftime("%H:%M"),
                        "meal_type": log.get("meal_type", "snack"),
                        "food": log.get("food_name", "Unknown")
                    })
                except:
                    continue
        
        return {
            "success": True,
            "date": today.isoformat(),
            "meals_breakdown": meals_breakdown,
            "overall_totals": overall_totals,
            "target_percentages": target_percentages,
            "targets": targets,
            "meal_timing": sorted(meal_times, key=lambda x: x["time"]),
            "total_foods_logged": len(food_logs),
            "meals_with_data": len([meal for meal, data in meals_breakdown.items() if data["logs"]]),
            "summary": {
                "calories_consumed": round(overall_totals["calories"]),
                "protein_consumed": round(overall_totals["protein"], 1),
                "carbs_consumed": round(overall_totals["carbs"], 1),
                "fat_consumed": round(overall_totals["fat"], 1),
                "fiber_consumed": round(overall_totals["fiber"], 1),
                "calories_remaining": max(0, targets["calories"] - overall_totals["calories"]),
                "protein_remaining": max(0, targets["protein"] - overall_totals["protein"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting today's nutrition detail: {str(e)}")

@router.get("/cache-status", response_model=Dict[str, Any])
async def get_cache_status(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get cache status for debugging"""
    try:
        status = await ai_dashboard_service.get_cache_status(current_user.uid)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting cache status: {str(e)}")

@router.post("/invalidate-cache")
async def invalidate_cache(
    cache_type: str = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Invalidate cache for user (for testing/debugging)"""
    try:
        success = await ai_dashboard_service.invalidate_user_cache(current_user.uid, cache_type)
        return {
            "success": success,
            "message": f"Cache {'invalidated' if success else 'invalidation failed'}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error invalidating cache: {str(e)}")

@router.post("/feedback")
async def provide_ai_feedback(
    feedback_data: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_user)
):
    """Allow users to provide feedback on AI suggestions to improve recommendations"""
    try:
        # Store feedback for AI learning (could be implemented with a feedback collection)
        # This is where you'd implement ML feedback loops
        
        return {
            "message": "Thank you for your feedback! Our AI will learn from this to provide better recommendations.",
            "feedback_id": "ai_feedback_" + current_user.uid + "_" + str(int(datetime.now().timestamp()))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

@router.get("/insights/weekly")
async def get_weekly_insights(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comprehensive weekly AI insights and recommendations"""
    try:
        # This could generate detailed weekly reports
        coaching = await ai_dashboard_service.get_ai_health_coaching(current_user.uid)
        predictions = await ai_dashboard_service.get_predictive_analytics(current_user.uid)
        
        return {
            "week_summary": {
                "overall_trend": predictions.get("healthScore", {}).get("current", 75),
                "key_wins": [
                    "Consistent protein intake",
                    "Improved meal timing",
                    "Better hydration habits"
                ],
                "focus_areas": [
                    "Increase fiber intake",
                    "Add more colorful vegetables",
                    "Optimize post-workout nutrition"
                ]
            },
            "next_week_plan": {
                "priority_goals": ["Increase vegetable variety", "Maintain protein targets"],
                "smart_swaps": ["Rice → Quinoa", "Snacks → Nuts"],
                "meal_timing_optimization": "Consider eating larger breakfast for better energy"
            },
            "ai_coaching_note": coaching.get("personalizedInsight", "Keep up the great work!")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating weekly insights: {str(e)}")
