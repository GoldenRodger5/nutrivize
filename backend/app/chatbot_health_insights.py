import sys
import os
from datetime import datetime, timedelta
import numpy as np
from typing import List, Dict, Any, Optional
from .models import get_healthkit_data
import json

def get_health_data_for_prompt(user_id: str) -> str:
    """
    Get Apple HealthKit data formatted specifically for the AI prompt.
    
    Args:
        user_id: The user's ID to fetch health data for
        
    Returns:
        A formatted string with the user's health data, ready to include in the AI prompt
    """
    try:
        # Get data from the last 30 days
        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)
        
        # Get data from MongoDB
        healthkit_data = get_healthkit_data(
            user_id=user_id,
            start_date=thirty_days_ago,
            end_date=today
        )
        
        if not healthkit_data:
            return "No Apple HealthKit data is available for this user."
            
        # Process data into a structured format
        dates = []
        steps_data = {}
        calories_data = {}
        exercise_data = {}
        sleep_data = {}
        resting_hr_data = {}
        walking_hr_data = {}
        distance_data = {}
        
        # Organize data by date
        for entry in healthkit_data:
            date_str = None
            
            # Extract date from entry
            if isinstance(entry.get("date"), datetime):
                date_str = entry["date"].strftime("%Y-%m-%d")
            elif "date_key" in entry:
                date_str = entry["date_key"]
            else:
                continue
                
            if date_str:
                if date_str not in dates:
                    dates.append(date_str)
                
                steps_data[date_str] = entry.get("steps", 0)
                calories_data[date_str] = entry.get("calories", 0)
                exercise_data[date_str] = entry.get("exercise_minutes", 0)
                sleep_data[date_str] = entry.get("sleep_hours", 0)
                resting_hr_data[date_str] = entry.get("resting_heart_rate", 0)
                walking_hr_data[date_str] = entry.get("walking_heart_rate", 0)
                distance_data[date_str] = entry.get("distance", 0)
        
        # Sort dates
        dates.sort()
        
        # Calculate analytics for insights
        if len(dates) > 0:
            # Convert to numpy arrays for easier calculations
            steps_values = np.array([steps_data.get(d, 0) for d in dates])
            calories_values = np.array([calories_data.get(d, 0) for d in dates])
            exercise_values = np.array([exercise_data.get(d, 0) for d in dates])
            sleep_values = np.array([sleep_data.get(d, 0) for d in dates])
            
            # Calculate statistics
            avg_steps = np.mean(steps_values)
            avg_calories = np.mean(calories_values)
            avg_exercise = np.mean(exercise_values)
            avg_sleep = np.mean(sleep_values[sleep_values > 0]) if np.any(sleep_values > 0) else 0
            
            # Get latest values
            latest_date = dates[-1] if dates else "N/A"
            latest_steps = steps_data.get(latest_date, 0)
            latest_calories = calories_data.get(latest_date, 0)
            latest_exercise = exercise_data.get(latest_date, 0)
            latest_sleep = sleep_data.get(latest_date, 0)
            latest_resting_hr = resting_hr_data.get(latest_date, 0)
            
            # Calculate trends (comparing latest week to previous week)
            if len(dates) >= 14:
                last_week = dates[-7:]
                prev_week = dates[-14:-7]
                
                last_week_steps = np.mean([steps_data.get(d, 0) for d in last_week])
                prev_week_steps = np.mean([steps_data.get(d, 0) for d in prev_week])
                steps_trend = (last_week_steps - prev_week_steps) / prev_week_steps * 100 if prev_week_steps > 0 else 0
                
                last_week_calories = np.mean([calories_data.get(d, 0) for d in last_week])
                prev_week_calories = np.mean([calories_data.get(d, 0) for d in prev_week])
                calories_trend = (last_week_calories - prev_week_calories) / prev_week_calories * 100 if prev_week_calories > 0 else 0
                
                last_week_exercise = np.mean([exercise_data.get(d, 0) for d in last_week])
                prev_week_exercise = np.mean([exercise_data.get(d, 0) for d in prev_week])
                exercise_trend = (last_week_exercise - prev_week_exercise) / prev_week_exercise * 100 if prev_week_exercise > 0 else 0
            else:
                steps_trend = 0
                calories_trend = 0
                exercise_trend = 0
            
            # Create health assessment
            steps_assessment = ""
            if avg_steps >= 10000:
                steps_assessment = "excellent (meeting recommended guidelines)"
            elif avg_steps >= 7500:
                steps_assessment = "good (approaching recommended guidelines)"
            elif avg_steps >= 5000:
                steps_assessment = "moderate (increasing would be beneficial)"
            else:
                steps_assessment = "below recommended levels"
                
            sleep_assessment = ""
            if avg_sleep >= 7 and avg_sleep <= 9:
                sleep_assessment = "within healthy recommended range"
            elif avg_sleep < 7 and avg_sleep > 0:
                sleep_assessment = "below recommended 7-9 hours"
            elif avg_sleep > 9:
                sleep_assessment = "above typical recommendations"
            else:
                sleep_assessment = "insufficient data"
                
            exercise_assessment = ""
            if avg_exercise >= 30:
                exercise_assessment = "meets daily recommendations"
            else:
                exercise_assessment = "below the recommended 30 minutes/day"
            
            # Format the health data for prompt
            prompt_data = {
                "date_range": {
                    "start": dates[0] if dates else "N/A",
                    "end": dates[-1] if dates else "N/A",
                    "days_count": len(dates)
                },
                "averages": {
                    "steps": round(float(avg_steps), 1),
                    "calories": round(float(avg_calories), 1),
                    "exercise_minutes": round(float(avg_exercise), 1),
                    "sleep_hours": round(float(avg_sleep), 1) if avg_sleep > 0 else "No data"
                },
                "latest": {
                    "date": latest_date,
                    "steps": round(float(latest_steps), 1),
                    "calories": round(float(latest_calories), 1),
                    "exercise_minutes": round(float(latest_exercise), 1),
                    "sleep_hours": round(float(latest_sleep), 1) if latest_sleep > 0 else "No data",
                    "resting_heart_rate": round(float(latest_resting_hr), 1) if latest_resting_hr > 0 else "No data"
                },
                "trends": {
                    "steps": f"{steps_trend:.1f}% compared to previous week",
                    "calories": f"{calories_trend:.1f}% compared to previous week",
                    "exercise": f"{exercise_trend:.1f}% compared to previous week"
                },
                "assessment": {
                    "steps": steps_assessment,
                    "sleep": sleep_assessment,
                    "exercise": exercise_assessment
                },
                "all_data": []
            }
            
            # Add daily data
            for date in dates:
                prompt_data["all_data"].append({
                    "date": date,
                    "steps": steps_data.get(date, 0),
                    "calories": calories_data.get(date, 0),
                    "exercise_minutes": exercise_data.get(date, 0),
                    "sleep_hours": sleep_data.get(date, 0),
                    "resting_heart_rate": resting_hr_data.get(date, 0),
                    "walking_heart_rate": walking_hr_data.get(date, 0),
                    "distance_meters": distance_data.get(date, 0)
                })
            
            # Format as string for the prompt
            return json.dumps(prompt_data, indent=2)
            
        else:
            return "No Apple HealthKit data available for the past 30 days."
            
    except Exception as e:
        print(f"Error generating health data for prompt: {str(e)}")
        import traceback
        traceback.print_exc()
        return "Error processing Apple HealthKit data."

def generate_health_insights(healthkit_data):
    """
    Generate insights from the user's health data
    
    Args:
        healthkit_data: List of HealthKit data entries
        
    Returns:
        A dictionary with insights about the user's health data
    """
    if not healthkit_data or len(healthkit_data) == 0:
        return {"error": "No health data available"}
    
    # Organize data by date
    dates = []
    data_by_date = {}
    
    for entry in healthkit_data:
        date_str = None
        if isinstance(entry.get("date"), datetime):
            date_str = entry["date"].strftime("%Y-%m-%d")
        elif "date_key" in entry:
            date_str = entry["date_key"]
        else:
            continue
            
        if date_str not in dates:
            dates.append(date_str)
            data_by_date[date_str] = entry
    
    # Sort dates
    dates.sort()
    
    # Calculate statistics and generate insights
    insights = {
        "date_range": f"{dates[0]} to {dates[-1]}",
        "days_count": len(dates),
        "metrics": {},
        "patterns": [],
        "recommendations": []
    }
    
    # Process each health metric
    metrics = {
        "steps": {"values": [], "name": "Steps", "unit": "steps"},
        "calories": {"values": [], "name": "Active Energy", "unit": "kcal"},
        "exercise_minutes": {"values": [], "name": "Exercise", "unit": "minutes"},
        "sleep_hours": {"values": [], "name": "Sleep", "unit": "hours"},
        "distance": {"values": [], "name": "Distance", "unit": "meters"}
    }
    
    for date in dates:
        entry = data_by_date[date]
        for metric_key in metrics.keys():
            value = entry.get(metric_key, 0)
            metrics[metric_key]["values"].append(value)
    
    # Calculate statistics for each metric
    for metric_key, metric_data in metrics.items():
        values = np.array(metric_data["values"])
        if len(values) > 0:
            non_zero_values = values[values > 0]
            avg = np.mean(non_zero_values) if len(non_zero_values) > 0 else 0
            max_val = np.max(values)
            min_val = np.min(non_zero_values) if len(non_zero_values) > 0 else 0
            
            insights["metrics"][metric_key] = {
                "name": metric_data["name"],
                "unit": metric_data["unit"],
                "average": float(avg),
                "max": float(max_val),
                "min": float(min_val if min_val > 0 else 0),
                "trend": "stable"  # Default trend
            }
            
            # Calculate trend if enough data points
            if len(values) > 7:
                recent = values[-7:]
                older = values[-14:-7] if len(values) >= 14 else values[:-7]
                
                recent_avg = np.mean(recent[recent > 0]) if np.any(recent > 0) else 0
                older_avg = np.mean(older[older > 0]) if np.any(older > 0) else 0
                
                if older_avg > 0:
                    change_pct = (recent_avg - older_avg) / older_avg * 100
                    
                    if change_pct > 10:
                        insights["metrics"][metric_key]["trend"] = "increasing"
                    elif change_pct < -10:
                        insights["metrics"][metric_key]["trend"] = "decreasing"
    
    # Generate pattern insights
    if "steps" in insights["metrics"]:
        avg_steps = insights["metrics"]["steps"]["average"]
        if avg_steps >= 10000:
            insights["patterns"].append("You consistently achieve the recommended 10,000 steps per day")
        elif avg_steps >= 7500:
            insights["patterns"].append("You're approaching the recommended 10,000 daily steps")
        elif avg_steps < 5000:
            insights["patterns"].append("Your daily step count is below recommended levels")
    
    if "sleep_hours" in insights["metrics"]:
        avg_sleep = insights["metrics"]["sleep_hours"]["average"]
        if avg_sleep > 0:
            if avg_sleep < 7:
                insights["patterns"].append("You may not be getting enough sleep (recommended: 7-9 hours)")
            elif avg_sleep > 9:
                insights["patterns"].append("You appear to sleep more than the typical recommendation")
            else:
                insights["patterns"].append("Your sleep duration is within the recommended range")
    
    if "exercise_minutes" in insights["metrics"]:
        avg_exercise = insights["metrics"]["exercise_minutes"]["average"]
        if avg_exercise < 30:
            insights["patterns"].append("You're getting less than the recommended 30 minutes of daily exercise")
        else:
            insights["patterns"].append("You're meeting the recommended 30+ minutes of daily exercise")
    
    # Generate recommendations
    if "steps" in insights["metrics"] and insights["metrics"]["steps"]["average"] < 10000:
        insights["recommendations"].append("Try to gradually increase your daily step count toward 10,000 steps")
    
    if "sleep_hours" in insights["metrics"] and 0 < insights["metrics"]["sleep_hours"]["average"] < 7:
        insights["recommendations"].append("Aim for 7-9 hours of sleep per night for optimal health")
    
    if "exercise_minutes" in insights["metrics"] and insights["metrics"]["exercise_minutes"]["average"] < 30:
        insights["recommendations"].append("Work toward at least 30 minutes of exercise daily")
        
    return insights 