"""
AI Dashboard Routes - API endpoints for the AI-first dashboard
"""

from fastapi import APIRouter, Depends, HTTPException
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.ai_dashboard_service import ai_dashboard_service
from typing import Dict, Any
from datetime import datetime

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

@router.get("/health-score", response_model=Dict[str, Any])
async def get_health_score(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comprehensive AI-calculated health score"""
    try:
        health_score_data = await ai_dashboard_service.unified_ai.get_dashboard_data(current_user.uid, "health_score")
        return health_score_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating health score: {str(e)}")

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
