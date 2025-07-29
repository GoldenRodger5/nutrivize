from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class WaterLogCreate(BaseModel):
    date: date
    amount: float  # Water amount in fluid ounces
    notes: Optional[str] = ""


class WaterLogEntry(BaseModel):
    user_id: str
    date: date
    amount: float  # Water amount in fluid ounces
    notes: Optional[str] = ""
    logged_at: datetime = datetime.utcnow()


class WaterLogResponse(BaseModel):
    id: str
    date: date
    amount: float  # Water amount in fluid ounces
    notes: Optional[str] = ""
    logged_at: datetime


class DailyWaterSummary(BaseModel):
    date: date
    total_amount: float  # Total fluid ounces
    target_amount: float = 64.0  # Default 64 fluid ounces per day (8 cups)
    percentage: float
    logs_count: int
