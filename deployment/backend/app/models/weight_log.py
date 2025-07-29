from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class WeightLogCreate(BaseModel):
    date: date
    weight: float  # Weight in kg (backend storage)
    notes: Optional[str] = ""


class WeightLogEntry(BaseModel):
    user_id: str
    date: date
    weight: float
    notes: Optional[str] = ""
    logged_at: datetime = datetime.utcnow()


class WeightLogResponse(BaseModel):
    id: str
    date: date
    weight: float
    notes: Optional[str] = ""
    logged_at: datetime
