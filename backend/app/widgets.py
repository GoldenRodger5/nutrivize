from typing import List
from pydantic import BaseModel
from datetime import datetime

# Widget preference model
class WidgetPreference(BaseModel):
    id: str
    type: str
    title: str
    size: str
    position: int
    visible: bool

class WidgetPreferencesPayload(BaseModel):
    widgets: List[WidgetPreference]

# Default widget configuration
DEFAULT_WIDGETS = [
  {
    "id": "today-nutrition",
    "type": "today-nutrition",
    "title": "Today's Nutrition",
    "size": "medium",
    "position": 0,
    "visible": True
  },
  {
    "id": "weight-goal",
    "type": "weight-goal",
    "title": "Weight Goal",
    "size": "medium",
    "position": 1,
    "visible": True
  },
  {
    "id": "quick-actions",
    "type": "quick-actions",
    "title": "Quick Actions",
    "size": "small",
    "position": 2,
    "visible": True
  },
  {
    "id": "recent-meals",
    "type": "recent-meals",
    "title": "Recent Meals",
    "size": "medium",
    "position": 3,
    "visible": True
  },
  {
    "id": "weekly-trends",
    "type": "weekly-trends",
    "title": "Weekly Trends",
    "size": "medium",
    "position": 4,
    "visible": False
  },
  {
    "id": "water-intake",
    "type": "water-intake",
    "title": "Water Intake",
    "size": "small",
    "position": 5,
    "visible": False
  },
  {
    "id": "activity-log",
    "type": "activity-log",
    "title": "Activity Log",
    "size": "small",
    "position": 6,
    "visible": False
  }
] 