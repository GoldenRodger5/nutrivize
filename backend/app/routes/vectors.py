"""
Vector Management API Routes for Nutrivize V2
Provides endpoints for managing vectorization of user data
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..routes.auth import get_current_user
from ..models.user import UserResponse
from ..services.vector_management_service import vector_management_service
from ..services.pinecone_service import pinecone_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vectors", tags=["vectors"])

class VectorizeRequest(BaseModel):
    data_types: Optional[List[str]] = None
    force_rebuild: bool = False

class VectorQueryRequest(BaseModel):
    query: str
    data_types: Optional[List[str]] = None
    top_k: int = 10

class VectorStatsResponse(BaseModel):
    total_vectors: int
    data_types: List[str]
    last_updated: Optional[str]
    vectorization_enabled: bool

@router.post("/bulk-vectorize")
async def bulk_vectorize_user_data(
    request: VectorizeRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Bulk vectorize user's existing data for AI context
    Runs in background to avoid blocking the user
    """
    try:
        logger.info(f"Starting bulk vectorization for user {current_user.uid}")
        
        # Add vectorization task to background
        background_tasks.add_task(
            _background_vectorization,
            current_user.uid,
            request.data_types,
            request.force_rebuild
        )
        
        return {
            "message": "Vectorization started in background",
            "user_id": current_user.uid,
            "data_types": request.data_types or ["all"],
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Failed to start bulk vectorization: {e}")
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {str(e)}")

@router.post("/query")
async def query_user_vectors(
    request: VectorQueryRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Query user's vectorized data for relevant context
    Useful for testing and debugging vector retrieval
    """
    try:
        results = await pinecone_service.query_user_context(
            user_id=current_user.uid,
            query=request.query,
            top_k=request.top_k,
            data_types=request.data_types
        )
        
        return {
            "query": request.query,
            "results_count": len(results),
            "results": results[:5],  # Limit response size
            "user_id": current_user.uid
        }
        
    except Exception as e:
        logger.error(f"Failed to query vectors: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@router.get("/stats", response_model=VectorStatsResponse)
async def get_vector_stats(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get statistics about user's vectorized data
    """
    try:
        # Query Pinecone to get vector count and types
        stats = await _get_user_vector_stats(current_user.uid)
        
        return VectorStatsResponse(
            total_vectors=stats.get("total_vectors", 0),
            data_types=stats.get("data_types", []),
            last_updated=stats.get("last_updated"),
            vectorization_enabled=vector_management_service.vectorization_enabled
        )
        
    except Exception as e:
        logger.error(f"Failed to get vector stats: {e}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@router.delete("/clear")
async def clear_user_vectors(
    data_type: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Clear user's vectors (optionally by data type)
    """
    try:
        success = await pinecone_service.invalidate_user_vectors(
            user_id=current_user.uid,
            data_type=data_type
        )
        
        if success:
            return {
                "message": f"Successfully cleared {'all' if not data_type else data_type} vectors",
                "user_id": current_user.uid,
                "data_type": data_type or "all"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to clear vectors")
        
    except Exception as e:
        logger.error(f"Failed to clear vectors: {e}")
        raise HTTPException(status_code=500, detail=f"Clear operation failed: {str(e)}")

@router.post("/enable")
async def enable_vectorization(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Enable vectorization for the user (if disabled)
    """
    try:
        vector_management_service.vectorization_enabled = True
        
        return {
            "message": "Vectorization enabled",
            "user_id": current_user.uid,
            "status": "enabled"
        }
        
    except Exception as e:
        logger.error(f"Failed to enable vectorization: {e}")
        raise HTTPException(status_code=500, detail=f"Enable failed: {str(e)}")

@router.post("/disable")
async def disable_vectorization(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Disable vectorization for the user
    """
    try:
        vector_management_service.vectorization_enabled = False
        
        return {
            "message": "Vectorization disabled",
            "user_id": current_user.uid,
            "status": "disabled"
        }
        
    except Exception as e:
        logger.error(f"Failed to disable vectorization: {e}")
        raise HTTPException(status_code=500, detail=f"Disable failed: {str(e)}")

async def _background_vectorization(user_id: str, data_types: Optional[List[str]], force_rebuild: bool):
    """
    Background task for bulk vectorization
    """
    try:
        logger.info(f"Starting background vectorization for user {user_id}")
        
        # Clear existing vectors if force rebuild
        if force_rebuild:
            await pinecone_service.invalidate_user_vectors(user_id)
            logger.info(f"Cleared existing vectors for user {user_id}")
        
        # Perform bulk vectorization
        results = await vector_management_service.bulk_vectorize_user_data(
            user_id=user_id,
            data_types=data_types
        )
        
        logger.info(f"✅ Background vectorization completed for user {user_id}: {results}")
        
    except Exception as e:
        logger.error(f"❌ Background vectorization failed for user {user_id}: {e}")

async def _get_user_vector_stats(user_id: str) -> Dict[str, Any]:
    """
    Get statistics about user's vectors from Pinecone
    """
    try:
        if not pinecone_service.index:
            return {"total_vectors": 0, "data_types": [], "last_updated": None}
        
        # Query with a dummy vector to get metadata
        dummy_query = await pinecone_service.query_user_context(
            user_id=user_id,
            query="get stats",
            top_k=100  # Get more results to analyze data types
        )
        
        # Analyze results to get stats
        data_types = set()
        for item in dummy_query:
            metadata = item.get("metadata", {})
            data_type = metadata.get("data_type")
            if data_type:
                data_types.add(data_type)
        
        return {
            "total_vectors": len(dummy_query),
            "data_types": list(data_types),
            "last_updated": None  # Could be enhanced to track timestamps
        }
        
    except Exception as e:
        logger.error(f"Failed to get vector stats: {e}")
        return {"total_vectors": 0, "data_types": [], "last_updated": None}
