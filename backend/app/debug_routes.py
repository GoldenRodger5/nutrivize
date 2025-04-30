from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from app.database import get_database
import traceback
from app.utils import jsonify

router = APIRouter()

@router.get("/debug/ping")
async def ping():
    """Simple endpoint to check if server is responsive"""
    return {"message": "pong", "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/debug/db-status")
async def db_status():
    """Check database connectivity"""
    try:
        db = get_database()
        db.command('ping')
        
        # Count test user's data
        test_uid = "5jlPr83skvNJMePGQCWC46Nq5LS2"
        food_logs_count = db.food_logs.count_documents({"user_id": test_uid})
        goals_count = db.goals.count_documents({"user_id": test_uid})
        food_items_count = db.food_index.count_documents({"created_by": test_uid})
        
        return {
            "status": "connected",
            "food_logs_count": food_logs_count,
            "goals_count": goals_count,
            "food_items_count": food_items_count
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )

@router.get("/debug/test-log/{date}")
async def test_log(date: str):
    """Test retrieving logs for a specific date"""
    try:
        from app.models import get_user_food_logs_by_date
        test_uid = "5jlPr83skvNJMePGQCWC46Nq5LS2"
        
        # Convert string date to datetime date
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        
        logs = get_user_food_logs_by_date(test_uid, date_obj)
        return {"logs": logs, "count": len(logs), "date": date}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )

@router.get("/debug/exception-test")
async def exception_test(request: Request):
    """Deliberately raise an exception to see how it's handled"""
    try:
        # Access middleware and settings to check configuration
        middleware_info = [str(m.__class__.__name__) for m in request.app.middleware]
        
        # Force an exception
        result = 1 / 0
        return {"result": result}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc(),
                "middleware": middleware_info
            }
        )

@router.get("/debug/logs")
async def debug_logs(date: str = None, user_id: str = "5jlPr83skvNJMePGQCWC46Nq5LS2"):
    """Get food logs without authentication"""
    try:
        from app.models import get_user_food_logs_by_date
        
        # Default to today if no date provided
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            
        # Convert string date to datetime date
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        
        logs = get_user_food_logs_by_date(user_id, date_obj)
        return {"logs": jsonify(logs)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )

@router.get("/debug/foods")
async def debug_foods(user_id: str = "5jlPr83skvNJMePGQCWC46Nq5LS2"):
    """Get food items without authentication"""
    try:
        from app.models import search_food_items
        
        foods = search_food_items("", user_id=user_id)
        return {"foods": jsonify(foods)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )

@router.get("/debug/goals")
async def debug_goals(user_id: str = "5jlPr83skvNJMePGQCWC46Nq5LS2"):
    """Get goals without authentication"""
    try:
        from app.models import get_user_active_goal, get_user_all_goals
        
        active_goal = get_user_active_goal(user_id)
        all_goals = get_user_all_goals(user_id)
        return {"active_goal": jsonify(active_goal), "all_goals": jsonify(all_goals)} 
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        ) 