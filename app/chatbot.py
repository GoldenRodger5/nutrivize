from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

from app.constants import USER_ID

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    fetch_context: bool = True

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint - simplified version
    """
    return {
        "id": "simplified_response",
        "message": "This is a simplified version of the chatbot for testing purposes.",
        "created_at": "2023-05-17T12:00:00Z"
    } 