from ..core.config import get_database
from ..models.food_log import FoodLogEntry
from ..services.food_log_service import food_log_service
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from collections import defaultdict
import statistics
import asyncio


class AnalyticsService:
    """Analytics and insights service"""
    
    def __init__(self):
        self.db = get_database()
        self.food_logs_collection = None
        
        if self.db is not None:
            self.food_logs_collection = self.db["food_logs"]
        else:
            print("⚠️  AnalyticsService initialized without database connection")
    
    async def get_weekly_summary(self, user_id: str, end_date: date = None) -> Dict[str, Any]:
        """Get weekly nutrition summary"""
        if not end_date:
            end_date = date.today()
        
        start_date = end_date - timedelta(days=6)  # 7 days total
        
        weekly_data = []
        total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            daily_summary = await food_log_service.get_daily_logs(user_id, current_date)
            
            day_data = {
                "date": current_date.isoformat(),
                "day_name": current_date.strftime("%A"),
                "nutrition": daily_summary.total_nutrition.dict(),
                "meal_count": len(daily_summary.meals)
            }
            weekly_data.append(day_data)
            
            # Add to totals
            nutrition = daily_summary.total_nutrition
            total_nutrition["calories"] += nutrition.calories
            total_nutrition["protein"] += nutrition.protein
            total_nutrition["carbs"] += nutrition.carbs
            total_nutrition["fat"] += nutrition.fat
        
        # Calculate averages
        avg_nutrition = {k: round(v / 7, 1) for k, v in total_nutrition.items()}
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "daily_data": weekly_data,
            "weekly_totals": total_nutrition,
            "daily_averages": avg_nutrition
        }
    
    async def get_monthly_summary(self, user_id: str, year: int = None, month: int = None) -> Dict[str, Any]:
        """Get monthly nutrition summary"""
        from datetime import date
        import calendar
        
        if not year:
            year = date.today().year
        if not month:
            month = date.today().month
            
        # Get first and last day of month
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        # Get food logs for the month
        logs = await food_log_service.get_date_range_logs(user_id, start_date, end_date)
        
        if not logs:
            return {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "month_name": calendar.month_name[month],
                "year": year,
                "total_days": last_day,
                "logged_days": 0,
                "total_nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
                "average_daily": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
                "weekly_averages": []
            }
        
        # Group by week
        weekly_data = {}
        total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        logged_days = set()
        
        for log in logs:
            # log is a DailyNutritionSummary object, access its attributes
            log_date = log.date if hasattr(log, 'date') else datetime.now().date()
            if isinstance(log_date, str):
                log_date = datetime.fromisoformat(log_date.replace('Z', '+00:00')).date()
            
            logged_days.add(log_date)
            week_num = log_date.isocalendar()[1]
            
            if week_num not in weekly_data:
                weekly_data[week_num] = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "days": set()}
            
            nutrition = log.total_nutrition
            weekly_data[week_num]["calories"] += nutrition.calories
            weekly_data[week_num]["protein"] += nutrition.protein
            weekly_data[week_num]["carbs"] += nutrition.carbs
            weekly_data[week_num]["fat"] += nutrition.fat
            weekly_data[week_num]["days"].add(log_date)
            
            total_nutrition["calories"] += nutrition.calories
            total_nutrition["protein"] += nutrition.protein
            total_nutrition["carbs"] += nutrition.carbs
            total_nutrition["fat"] += nutrition.fat
        
        # Calculate weekly averages
        weekly_averages = []
        for week_num, week_data in weekly_data.items():
            days_in_week = len(week_data["days"])
            weekly_averages.append({
                "week": week_num,
                "days_logged": days_in_week,
                "average_daily": {
                    "calories": round(week_data["calories"] / days_in_week, 1) if days_in_week > 0 else 0,
                    "protein": round(week_data["protein"] / days_in_week, 1) if days_in_week > 0 else 0,
                    "carbs": round(week_data["carbs"] / days_in_week, 1) if days_in_week > 0 else 0,
                    "fat": round(week_data["fat"] / days_in_week, 1) if days_in_week > 0 else 0,
                }
            })
        
        num_logged_days = len(logged_days)
        average_daily = {
            "calories": round(total_nutrition["calories"] / num_logged_days, 1) if num_logged_days > 0 else 0,
            "protein": round(total_nutrition["protein"] / num_logged_days, 1) if num_logged_days > 0 else 0,
            "carbs": round(total_nutrition["carbs"] / num_logged_days, 1) if num_logged_days > 0 else 0,
            "fat": round(total_nutrition["fat"] / num_logged_days, 1) if num_logged_days > 0 else 0,
        }
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "month_name": calendar.month_name[month],
            "year": year,
            "total_days": last_day,
            "logged_days": num_logged_days,
            "total_nutrition": total_nutrition,
            "average_daily": average_daily,
            "weekly_averages": weekly_averages
        }

    async def generate_ai_insights(self, user_id: str, timeframe: str = "week", force_refresh: bool = False) -> Dict[str, Any]:
        """Generate AI-powered insights about user's nutrition patterns (caching disabled)"""
        from datetime import datetime, timedelta
        
        # Determine date range
        end_date = date.today()
        if timeframe == "week":
            start_date = end_date - timedelta(days=7)
            days_to_analyze = 7
        elif timeframe == "month":
            start_date = end_date - timedelta(days=30)
            days_to_analyze = 30
        else:  # "all"
            start_date = end_date - timedelta(days=90)  # Limit to 90 days for performance
            days_to_analyze = 90
        
        # Get user's food logs
        logs = await food_log_service.get_date_range_logs(user_id, start_date, end_date)
        
        # Get user's goals
        from ..services.goals_service import goals_service
        user_goals = await goals_service.get_user_goals(user_id)
        
        # Calculate statistics
        statistics = await self._calculate_nutrition_statistics(logs, days_to_analyze)
        
        # Generate insights using AI
        insights_response = await self._generate_ai_insights_content(
            user_id, logs, user_goals, statistics, timeframe
        )
        
        # Generate charts data
        charts = await self._generate_charts_data(logs, timeframe)
        
        result = {
            "insights": insights_response.get("insights", []),
            "statistics": statistics,
            "charts": charts,
            "generated_at": datetime.now(),
            "timeframe": timeframe,
            "is_cached": False,
            "summary": insights_response.get("summary", ""),
            "key_achievement": insights_response.get("key_achievement", ""),
            "main_opportunity": insights_response.get("main_opportunity", "")
        }
        
        return result

    async def get_nutrition_trends(self, user_id: str, days: int) -> Dict[str, Any]:
        """Get nutrition trends over specified number of days"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        logs = await food_log_service.get_date_range_logs(user_id, start_date, end_date)
        
        if not logs:
            return {
                "period": f"{start_date} to {end_date}",
                "days_analyzed": days,
                "trends": [],
                "message": "No data available for trend analysis"
            }
        
        # Group by date and calculate daily totals
        daily_totals = defaultdict(lambda: {"calories": 0, "protein": 0, "carbs": 0, "fat": 0})
        
        for daily_summary in logs:
            log_date = daily_summary.date
            nutrition = daily_summary.total_nutrition
            
            daily_totals[log_date]["calories"] = nutrition.calories
            daily_totals[log_date]["protein"] = nutrition.protein
            daily_totals[log_date]["carbs"] = nutrition.carbs
            daily_totals[log_date]["fat"] = nutrition.fat
        
        # Calculate trends (simple moving averages)
        trend_data = []
        dates = sorted(daily_totals.keys())
        
        for i, date_key in enumerate(dates):
            daily_data = daily_totals[date_key]
            
            # Calculate 3-day moving average if possible
            if i >= 2:
                recent_3_days = dates[i-2:i+1]
                avg_calories = sum(daily_totals[d]["calories"] for d in recent_3_days) / 3
                avg_protein = sum(daily_totals[d]["protein"] for d in recent_3_days) / 3
                avg_carbs = sum(daily_totals[d]["carbs"] for d in recent_3_days) / 3
                avg_fat = sum(daily_totals[d]["fat"] for d in recent_3_days) / 3
            else:
                avg_calories = daily_data["calories"]
                avg_protein = daily_data["protein"]
                avg_carbs = daily_data["carbs"]
                avg_fat = daily_data["fat"]
            
            trend_data.append({
                "date": date_key.isoformat(),
                "daily": daily_data,
                "3_day_average": {
                    "calories": round(avg_calories, 1),
                    "protein": round(avg_protein, 1),
                    "carbs": round(avg_carbs, 1),
                    "fat": round(avg_fat, 1)
                }
            })
        
        return {
            "period": f"{start_date} to {end_date}",
            "days_analyzed": days,
            "days_with_data": len(dates),
            "trends": trend_data
        }

    async def get_goal_progress(self, user_id: str) -> Dict[str, Any]:
        """Get progress towards user's nutrition and health goals"""
        from ..services.goals_service import goals_service
        
        # Get user's current goals
        user_goals = await goals_service.get_user_goals(user_id)
        
        if not user_goals:
            return {
                "message": "No goals set",
                "progress": {},
                "recommendations": ["Set nutrition goals to track your progress"]
            }
        
        # Get recent nutrition data (last 7 days)
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        weekly_summary = await self.get_weekly_summary(user_id, end_date)
        avg_daily = weekly_summary.get("average_daily", {})
        
        progress = {}
        recommendations = []
        
        # Check progress against each goal
        if "daily_calories" in user_goals:
            target = user_goals["daily_calories"]
            actual = avg_daily.get("calories", 0)
            progress["calories"] = {
                "target": target,
                "actual": actual,
                "percentage": round((actual / target) * 100, 1) if target > 0 else 0,
                "status": "on_track" if abs(actual - target) <= target * 0.1 else ("above" if actual > target else "below")
            }
            
            if progress["calories"]["status"] != "on_track":
                if actual < target:
                    recommendations.append(f"You're consuming {target - actual:.0f} fewer calories than your target. Consider adding healthy snacks.")
                else:
                    recommendations.append(f"You're consuming {actual - target:.0f} more calories than your target. Consider portion control.")
        
        # Similar logic for protein, carbs, fat goals...
        
        return {
            "period": f"{start_date} to {end_date}",
            "goals": user_goals,
            "progress": progress,
            "recommendations": recommendations
        }

    async def analyze_food_patterns(self, user_id: str, days: int) -> Dict[str, Any]:
        """Analyze food consumption patterns and habits"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        logs = await food_log_service.get_date_range_logs(user_id, start_date, end_date)
        
        if not logs:
            return {
                "period": f"{start_date} to {end_date}",
                "patterns": {},
                "message": "No data available for pattern analysis"
            }
        
        # Analyze patterns
        meal_type_counts = defaultdict(int)
        food_frequency = defaultdict(int)
        hourly_eating = defaultdict(int)
        daily_meal_counts = defaultdict(int)
        
        for daily_summary in logs:
            daily_meal_counts[daily_summary.date] = len(daily_summary.meals)
            
            for meal_entry in daily_summary.meals:
                # Meal type analysis
                meal_type = meal_entry.meal_type
                meal_type_counts[meal_type] += 1
                
                # Food frequency
                food_name = meal_entry.food_name
                food_frequency[food_name] += 1
                
                # Time-based patterns
                log_time = meal_entry.logged_at
                if log_time:
                    hourly_eating[log_time.hour] += 1
        
        # Find most common foods
        top_foods = sorted(food_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Find eating time patterns
        most_active_hours = sorted(hourly_eating.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Calculate average meals per day
        unique_days = len(set(daily_meal_counts.keys()))
        avg_meals_per_day = sum(daily_meal_counts.values()) / unique_days if unique_days > 0 else 0
        
        return {
            "period": f"{start_date} to {end_date}",
            "days_analyzed": days,
            "patterns": {
                "meal_type_distribution": dict(meal_type_counts),
                "top_foods": [{"food": food, "count": count} for food, count in top_foods],
                "eating_hours": [{"hour": hour, "meals": count} for hour, count in most_active_hours],
                "average_meals_per_day": round(avg_meals_per_day, 1),
                "total_unique_foods": len(food_frequency),
                "most_consistent_meal": max(meal_type_counts.items(), key=lambda x: x[1])[0] if meal_type_counts else None
            }
        }

    async def clear_insights_cache(self, user_id: str) -> int:
        """Clear cached insights for a user"""
        # Implement cache clearing logic
        # For now, return 0 as placeholder
        return 0

    async def _calculate_nutrition_statistics(self, daily_summaries: List, days: int) -> Dict[str, Any]:
        """Calculate nutrition statistics from daily nutrition summaries"""
        if not daily_summaries:
            return {
                "total_logs": 0,
                "avg_calories": 0,
                "avg_protein": 0,
                "avg_carbs": 0,
                "avg_fat": 0,
                "most_eaten_food": None,
                "most_consistent_meal": None
            }
        
        # Calculate totals from daily summaries
        total_calories = sum(summary.total_nutrition.calories for summary in daily_summaries)
        total_protein = sum(summary.total_nutrition.protein for summary in daily_summaries)
        total_carbs = sum(summary.total_nutrition.carbs for summary in daily_summaries)
        total_fat = sum(summary.total_nutrition.fat for summary in daily_summaries)
        
        # Calculate daily averages
        avg_calories = round(total_calories / days, 1) if days > 0 else 0
        avg_protein = round(total_protein / days, 1) if days > 0 else 0
        avg_carbs = round(total_carbs / days, 1) if days > 0 else 0
        avg_fat = round(total_fat / days, 1) if days > 0 else 0
        
        # Find most eaten food and meal patterns
        food_counts = defaultdict(int)
        meal_type_counts = defaultdict(int)
        total_log_entries = 0
        
        for daily_summary in daily_summaries:
            for meal_entry in daily_summary.meals:
                food_counts[meal_entry.food_name] += 1
                meal_type_counts[meal_entry.meal_type] += 1
                total_log_entries += 1
        
        most_eaten_food = None
        if food_counts:
            top_food = max(food_counts.items(), key=lambda x: x[1])
            most_eaten_food = {"name": top_food[0], "count": top_food[1]}
        
        most_consistent_meal = None
        if meal_type_counts:
            top_meal = max(meal_type_counts.items(), key=lambda x: x[1])
            most_consistent_meal = {"name": top_meal[0], "count": top_meal[1]}
        
        return {
            "total_logs": total_log_entries,
            "avg_calories": avg_calories,
            "avg_protein": avg_protein,
            "avg_carbs": avg_carbs,
            "avg_fat": avg_fat,
            "most_eaten_food": most_eaten_food,
            "most_consistent_meal": most_consistent_meal
        }

    async def _generate_ai_insights_content(self, user_id: str, daily_summaries: List, goals: Dict, statistics: Dict, timeframe: str) -> Dict[str, Any]:
        """Generate comprehensive AI insights content using enhanced LLM analysis"""
        from ..services.ai_service import AIService
        from ..services.goals_service import goals_service
        
        if not daily_summaries:
            return {
                "insights": [
                    {
                        "id": "no_data",
                        "title": "Start Logging Your Meals",
                        "content": "Begin tracking your food intake to receive personalized nutrition insights and recommendations.",
                        "category": "recommendation",
                        "importance": 3
                    }
                ],
                "summary": f"No meal data available for {timeframe} analysis.",
                "key_achievement": "Ready to start your nutrition journey",
                "main_opportunity": "Begin consistent meal logging"
            }

        try:
            # Get additional context
            weight_logs = []
            # TODO: Implement weight service integration
            # try:
            #     from ..services.weight_service import weight_service
            #     weight_logs = await weight_service.get_recent_weights(user_id, 14)  # Last 2 weeks
            # except Exception as e:
            #     print(f"Could not fetch weight logs: {e}")

            # Get food patterns
            food_patterns = await self._analyze_detailed_food_patterns(daily_summaries)
            
            # Get user goals with more detail
            user_goals = {}
            try:
                goals_data = await goals_service.get_user_goals(user_id)
                if goals_data:
                    active_goal = next((g for g in goals_data if g.get('active')), None)
                    if active_goal:
                        # Convert goal object to dict if needed
                        if hasattr(active_goal, 'dict'):
                            goal_dict = active_goal.dict()
                        else:
                            goal_dict = active_goal if isinstance(active_goal, dict) else {}
                        
                        user_goals = {
                            'goal_type': goal_dict.get('goal_type'),
                            'calorie_target': goal_dict.get('nutrition_targets', {}).get('calories'),
                            'protein_target': goal_dict.get('nutrition_targets', {}).get('protein'),
                            'carb_target': goal_dict.get('nutrition_targets', {}).get('carbs'),
                            'fat_target': goal_dict.get('nutrition_targets', {}).get('fat'),
                            'weight_target': goal_dict.get('weight_target', {}).get('target_weight'),
                            'current_weight': goal_dict.get('weight_target', {}).get('current_weight')
                        }
            except Exception as e:
                print(f"Could not fetch detailed goals: {e}")
            
            # Convert daily summaries to serializable format
            serializable_logs = []
            for daily_summary in daily_summaries:
                daily_data = {
                    "date": daily_summary.date.isoformat(),
                    "total_nutrition": daily_summary.total_nutrition.dict(),
                    "meals": [
                        {
                            "id": meal.id,
                            "meal_type": meal.meal_type,
                            "food_name": meal.food_name,
                            "amount": meal.amount,
                            "unit": meal.unit,
                            "nutrition": meal.nutrition.dict(),
                            "logged_at": meal.logged_at.isoformat() if meal.logged_at else None
                        }
                        for meal in daily_summary.meals
                    ],
                    "meal_breakdown": daily_summary.meal_breakdown
                }
                serializable_logs.append(daily_data)
            
            # Prepare comprehensive user data
            user_data = {
                "timeframe": timeframe,
                "food_logs": serializable_logs,
                "goals": user_goals,
                "weight_logs": weight_logs[:10] if weight_logs else [],
                "nutrition_stats": statistics,
                "food_patterns": food_patterns
            }
            
            # Generate comprehensive insights
            ai_service = AIService()
            ai_response = await ai_service.generate_comprehensive_insights(user_data)
            
            if ai_response and "insights" in ai_response:
                return ai_response
            else:
                return self._generate_basic_insights_dict(statistics, timeframe)
                
        except Exception as e:
            print(f"Error generating comprehensive AI insights: {e}")
            return self._generate_basic_insights_dict(statistics, timeframe)

    async def _analyze_detailed_food_patterns(self, daily_summaries: List) -> Dict[str, Any]:
        """Analyze detailed food consumption patterns"""
        if not daily_summaries:
            return {}
        
        patterns = {
            "top_foods": [],
            "meal_type_distribution": {},
            "cuisine_patterns": [],
            "timing_patterns": {},
            "frequency_patterns": {}
        }
        
        try:
            food_counts = {}
            meal_type_counts = {}
            hour_distribution = {}
            
            for daily_summary in daily_summaries:
                for meal_entry in daily_summary.meals:
                    # Count foods
                    food_name = meal_entry.food_name
                    food_counts[food_name] = food_counts.get(food_name, 0) + 1
                    
                    # Count meal types
                    meal_type = meal_entry.meal_type
                    meal_type_counts[meal_type] = meal_type_counts.get(meal_type, 0) + 1
                    
                    # Analyze timing if available
                    if hasattr(meal_entry, 'logged_at') and meal_entry.logged_at:
                        try:
                            hour = meal_entry.logged_at.hour
                            hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
                        except Exception:
                            pass
            
            # Get top foods
            patterns["top_foods"] = [
                {"name": food, "count": count} 
                for food, count in sorted(food_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            ]
            
            # Meal type distribution
            patterns["meal_type_distribution"] = meal_type_counts
            
            # Most active eating hour
            if hour_distribution:
                most_active_hour = max(hour_distribution.items(), key=lambda x: x[1])
                patterns["timing_patterns"] = {
                    "most_active_hour": most_active_hour[0],
                    "most_active_count": most_active_hour[1],
                    "hour_distribution": hour_distribution
                }
            
            return patterns
            
        except Exception as e:
            print(f"Error analyzing food patterns: {e}")
            return patterns

    def _generate_basic_insights_dict(self, statistics: Dict, timeframe: str) -> Dict[str, Any]:
        """Generate basic insights dictionary when AI is unavailable"""
        insights = []
        
        # Calorie insight
        if statistics.get("avg_calories", 0) > 0:
            insights.append({
                "id": "calories_overview",
                "title": "Daily Caloric Intake Pattern",
                "content": f"You're averaging {statistics['avg_calories']} calories per day this {timeframe}. Monitor this alongside your activity level to ensure it aligns with your goals.",
                "category": "nutrition",
                "importance": 2
            })
        
        # Protein insight
        if statistics.get("avg_protein", 0) > 0:
            protein_status = "adequate" if statistics["avg_protein"] >= 50 else "low"
            importance = 1 if protein_status == "adequate" else 3
            
            insights.append({
                "id": "protein_intake",
                "title": f"Protein Intake is {protein_status.title()}",
                "content": f"You're consuming {statistics['avg_protein']}g of protein daily. {'Good work maintaining adequate protein for muscle health!' if protein_status == 'adequate' else 'Consider adding more protein sources to support muscle maintenance and recovery.'}",
                "category": "nutrition",
                "importance": importance
            })
        
        return {
            "insights": insights,
            "summary": f"Basic nutrition analysis for your {timeframe}.",
            "key_achievement": "Maintaining food logging consistency",
            "main_opportunity": "Continue tracking for more detailed insights"
        }

    def _generate_basic_insights(self, statistics: Dict, timeframe: str) -> List[Dict]:
        """Generate basic insights without AI"""
        insights = []
        
        # Calorie insight
        if statistics.get("avg_calories", 0) > 0:
            insights.append({
                "id": "calories_overview",
                "title": "Daily Caloric Intake Pattern",
                "content": f"You're averaging {statistics['avg_calories']} calories per day this {timeframe}. Monitor this alongside your activity level to ensure it aligns with your goals.",
                "category": "nutrition",
                "importance": 2
            })
        
        # Protein insight
        if statistics.get("avg_protein", 0) > 0:
            protein_status = "adequate" if statistics["avg_protein"] >= 50 else "low"
            importance = 1 if protein_status == "adequate" else 3
            
            insights.append({
                "id": "protein_intake",
                "title": f"Protein Intake is {protein_status.title()}",
                "content": f"You're consuming {statistics['avg_protein']}g of protein daily. {'Good work maintaining adequate protein for muscle health!' if protein_status == 'adequate' else 'Consider adding more protein sources to support muscle maintenance and recovery.'}",
                "category": "nutrition",
                "importance": importance
            })
        
        # Food variety insight
        if statistics.get("most_eaten_food"):
            insights.append({
                "id": "food_variety",
                "title": "Food Preference Detected",
                "content": f"You've eaten {statistics['most_eaten_food']['name']} {statistics['most_eaten_food']['count']} times. While it's good to have favorites, try varying your diet for optimal nutrition.",
                "category": "habits",
                "importance": 1
            })
        
        # Consistency insight
        total_logs = statistics.get("total_logs", 0)
        expected_logs = 21 if timeframe == "week" else 90  # 3 meals/day * 7 days or 30 days
        
        if total_logs > 0:
            consistency_rate = (total_logs / expected_logs) * 100
            if consistency_rate >= 70:
                insights.append({
                    "id": "logging_consistency",
                    "title": "Great Logging Consistency",
                    "content": f"You've logged {total_logs} meals this {timeframe}. Consistent tracking helps you understand your nutrition patterns better.",
                    "category": "progress",
                    "importance": 1
                })
            else:
                insights.append({
                    "id": "improve_logging",
                    "title": "Improve Tracking Consistency",
                    "content": f"You've logged {total_logs} meals this {timeframe}. More consistent logging will provide better insights and help you reach your goals.",
                    "category": "recommendation",
                    "importance": 2
                })
        
        return insights

    async def _generate_charts_data(self, daily_summaries: List, timeframe: str) -> List[Dict]:
        """Generate chart data for visualizations"""
        if not daily_summaries:
            return []
        
        charts = []
        
        # Daily calories trend chart
        daily_calories = {}
        for daily_summary in daily_summaries:
            log_date = daily_summary.date.isoformat()
            daily_calories[log_date] = daily_summary.total_nutrition.calories
        
        sorted_dates = sorted(daily_calories.keys())
        charts.append({
            "chart_type": "line",
            "title": "Daily Calories Trend",
            "data": {
                "labels": sorted_dates,
                "datasets": [{
                    "label": "Calories",
                    "data": [daily_calories[date] for date in sorted_dates],
                    "borderColor": "#3B82F6",
                    "backgroundColor": "rgba(59, 130, 246, 0.1)"
                }]
            }
        })
        
        # Macro distribution pie chart
        total_protein = sum(summary.total_nutrition.protein for summary in daily_summaries)
        total_carbs = sum(summary.total_nutrition.carbs for summary in daily_summaries)
        total_fat = sum(summary.total_nutrition.fat for summary in daily_summaries)
        
        charts.append({
            "chart_type": "pie",
            "title": "Macronutrient Distribution",
            "data": {
                "labels": ["Protein", "Carbs", "Fat"],
                "datasets": [{
                    "data": [total_protein, total_carbs, total_fat],
                    "backgroundColor": ["#10B981", "#F59E0B", "#EF4444"]
                }]
            }
        })
        
        # Meal type distribution
        meal_type_counts = defaultdict(int)
        for daily_summary in daily_summaries:
            for meal_entry in daily_summary.meals:
                meal_type = meal_entry.meal_type
                meal_type_counts[meal_type] += 1
        
        charts.append({
            "chart_type": "bar",
            "title": "Meal Type Distribution",
            "data": {
                "labels": list(meal_type_counts.keys()),
                "datasets": [{
                    "label": "Number of Meals",
                    "data": list(meal_type_counts.values()),
                    "backgroundColor": "#8B5CF6"
                }]
            }
        })
        
        return charts

    async def get_macro_breakdown(self, user_id: str, timeframe: str = "week") -> Dict[str, Any]:
        """Get detailed macronutrient breakdown with visualizations"""
        try:
            # Determine date range
            end_date = date.today()
            if timeframe == "week":
                start_date = end_date - timedelta(days=6)
            else:  # month
                start_date = end_date - timedelta(days=29)
            
            # Get food logs for the period
            logs = []
            current_date = start_date
            while current_date <= end_date:
                daily_logs = await food_log_service.get_daily_logs(user_id, current_date)
                for meal_entry in daily_logs.meals:
                    log_data = {
                        "date": current_date.isoformat(),
                        "meal_type": meal_entry.meal_type,
                        "food_name": meal_entry.food_name,
                        "nutrition": meal_entry.nutrition.dict()
                    }
                    logs.append(log_data)
                current_date += timedelta(days=1)
            
            if not logs:
                return {
                    "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                    "timeframe": timeframe,
                    "total_days": (end_date - start_date).days + 1,
                    "macro_breakdown": {"protein": 0, "carbs": 0, "fat": 0, "calories": 0},
                    "daily_averages": {"protein": 0, "carbs": 0, "fat": 0, "calories": 0},
                    "macro_percentages": {"protein": 0, "carbs": 0, "fat": 0},
                    "charts": [],
                    "message": "No food logs found for the specified period"
                }
            
            # Calculate totals
            total_protein = sum(log["nutrition"]["protein"] for log in logs)
            total_carbs = sum(log["nutrition"]["carbs"] for log in logs)
            total_fat = sum(log["nutrition"]["fat"] for log in logs)
            total_calories = sum(log["nutrition"]["calories"] for log in logs)
            
            days_count = (end_date - start_date).days + 1
            
            # Calculate daily averages
            avg_protein = total_protein / days_count if days_count > 0 else 0
            avg_carbs = total_carbs / days_count if days_count > 0 else 0
            avg_fat = total_fat / days_count if days_count > 0 else 0
            avg_calories = total_calories / days_count if days_count > 0 else 0
            
            # Calculate macro percentages (based on calories)
            protein_calories = total_protein * 4  # 4 calories per gram
            carbs_calories = total_carbs * 4      # 4 calories per gram
            fat_calories = total_fat * 9          # 9 calories per gram
            
            total_macro_calories = protein_calories + carbs_calories + fat_calories
            
            if total_macro_calories > 0:
                protein_percentage = (protein_calories / total_macro_calories) * 100
                carbs_percentage = (carbs_calories / total_macro_calories) * 100
                fat_percentage = (fat_calories / total_macro_calories) * 100
            else:
                protein_percentage = carbs_percentage = fat_percentage = 0
            
            # Generate chart data for daily trends
            daily_data = defaultdict(lambda: {"protein": 0, "carbs": 0, "fat": 0, "calories": 0})
            for log in logs:
                day = log["date"]
                daily_data[day]["protein"] += log["nutrition"]["protein"]
                daily_data[day]["carbs"] += log["nutrition"]["carbs"]
                daily_data[day]["fat"] += log["nutrition"]["fat"]
                daily_data[day]["calories"] += log["nutrition"]["calories"]
            
            # Create chart data
            charts = [
                {
                    "chart_type": "pie",
                    "title": "Macronutrient Distribution (%)",
                    "data": {
                        "labels": ["Protein", "Carbohydrates", "Fat"],
                        "values": [
                            round(protein_percentage, 1),
                            round(carbs_percentage, 1),
                            round(fat_percentage, 1)
                        ],
                        "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"]
                    }
                },
                {
                    "chart_type": "line",
                    "title": f"Daily Macro Trends ({timeframe.title()})",
                    "data": {
                        "labels": list(daily_data.keys()),
                        "datasets": [
                            {
                                "label": "Protein (g)",
                                "data": [daily_data[day]["protein"] for day in sorted(daily_data.keys())],
                                "color": "#FF6B6B"
                            },
                            {
                                "label": "Carbs (g)",
                                "data": [daily_data[day]["carbs"] for day in sorted(daily_data.keys())],
                                "color": "#4ECDC4"
                            },
                            {
                                "label": "Fat (g)",
                                "data": [daily_data[day]["fat"] for day in sorted(daily_data.keys())],
                                "color": "#45B7D1"
                            }
                        ]
                    }
                }
            ]
            
            return {
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "timeframe": timeframe,
                "total_days": days_count,
                "macro_breakdown": {
                    "protein": round(total_protein, 1),
                    "carbs": round(total_carbs, 1),
                    "fat": round(total_fat, 1),
                    "calories": round(total_calories, 1)
                },
                "daily_averages": {
                    "protein": round(avg_protein, 1),
                    "carbs": round(avg_carbs, 1),
                    "fat": round(avg_fat, 1),
                    "calories": round(avg_calories, 1)
                },
                "macro_percentages": {
                    "protein": round(protein_percentage, 1),
                    "carbs": round(carbs_percentage, 1),
                    "fat": round(fat_percentage, 1)
                },
                "charts": charts
            }
            
        except Exception as e:
            print(f"Error in get_macro_breakdown: {str(e)}")
            raise e


# Global analytics service instance
analytics_service = AnalyticsService()
