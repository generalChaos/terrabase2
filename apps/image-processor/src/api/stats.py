"""
Statistics API endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from src.storage import storage_service
from src.logging import logger

router = APIRouter()

@router.get("/stats")
async def get_processing_stats(hours: int = 24) -> Dict[str, Any]:
    """
    Get overall processing statistics
    
    Args:
        hours: Number of hours to look back (default: 24)
        
    Returns:
        Dictionary with processing statistics
    """
    try:
        stats = await storage_service.get_stats(hours)
        
        logger.info("Retrieved processing stats", 
                   hours=hours,
                   total_requests=stats.get("total_requests", 0))
        
        return {
            "success": True,
            "data": stats,
            "period_hours": hours
        }
        
    except Exception as e:
        logger.error(f"Failed to get processing stats: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve statistics",
                "message": str(e)
            }
        )

@router.get("/stats/endpoint/{endpoint}")
async def get_endpoint_stats(endpoint: str, hours: int = 24) -> Dict[str, Any]:
    """
    Get statistics for a specific endpoint
    
    Args:
        endpoint: The endpoint name (e.g., 'process-logo/optimized')
        hours: Number of hours to look back (default: 24)
        
    Returns:
        Dictionary with endpoint statistics
    """
    try:
        stats = await storage_service.get_endpoint_stats(endpoint, hours)
        
        logger.info("Retrieved endpoint stats", 
                   endpoint=endpoint,
                   hours=hours,
                   total_requests=stats.get("total_requests", 0))
        
        return {
            "success": True,
            "data": stats,
            "endpoint": endpoint,
            "period_hours": hours
        }
        
    except Exception as e:
        logger.error(f"Failed to get endpoint stats: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve endpoint statistics",
                "message": str(e)
            }
        )

@router.post("/cleanup")
async def cleanup_old_records(days: int = 30) -> Dict[str, Any]:
    """
    Clean up old records to free up storage space
    
    Args:
        days: Number of days to keep (default: 30)
        
    Returns:
        Dictionary with cleanup results
    """
    try:
        deleted_count = await storage_service.cleanup(days)
        
        logger.info("Cleaned up old records", 
                   days=days,
                   deleted_count=deleted_count)
        
        return {
            "success": True,
            "deleted_records": deleted_count,
            "retention_days": days
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup old records: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to cleanup old records",
                "message": str(e)
            }
        )
