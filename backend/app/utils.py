from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import json
from bson import ObjectId

def format_date(date_str: str) -> str:
    """Format a date string for display."""
    try:
        dt = datetime.fromisoformat(date_str)
        return dt.strftime("%b %d")
    except:
        return date_str

def get_openai_client() -> Optional[Any]:
    """Get OpenAI client if available."""
    try:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        return OpenAI(api_key=api_key)
    except ImportError:
        return None
    except Exception:
        return None

# Custom JSON encoder to handle ObjectId and datetime
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

# Helper to convert MongoDB objects to JSON
def jsonify(data):
    if hasattr(data, 'dict'):
        # Handle Pydantic models
        return data.dict()
    return json.loads(json.dumps(data, cls=CustomJSONEncoder)) 