"""
API endpoints for AI-powered background removal
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List

from services.ai_background_remover import AIBackgroundRemover

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize AI background remover
ai_remover = AIBackgroundRemover()

class BackgroundRemovalRequest(BaseModel):
    """Request model for background removal"""
    image_url: HttpUrl = Field(..., description="URL of the image to process")
    method: str = Field(default="ai", description="Removal method: 'ai', 'hybrid', or 'traditional'")

class BackgroundRemovalResponse(BaseModel):
    """Response model for background removal"""
    success: bool
    processed_url: Optional[str] = None
    original_url: HttpUrl
    method_used: str
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

@router.post("/remove-background/ai")
async def remove_background_ai(request: BackgroundRemovalRequest):
    """
    Remove background using AI-powered rembg
    
    Args:
        request: Background removal request
        
    Returns:
        BackgroundRemovalResponse with transparent image
    """
    try:
        result = await ai_remover.remove_background_ai(str(request.image_url))
        
        if result["success"]:
            return BackgroundRemovalResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                method_used=result["method"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return BackgroundRemovalResponse(
                success=False,
                original_url=request.image_url,
                method_used=result["method"],
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"AI background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI background removal failed: {str(e)}")

@router.post("/remove-background/hybrid")
async def remove_background_hybrid(request: BackgroundRemovalRequest):
    """
    Remove background using hybrid AI + manual cleanup
    
    Args:
        request: Background removal request
        
    Returns:
        BackgroundRemovalResponse with transparent image
    """
    try:
        result = await ai_remover.remove_background_hybrid(str(request.image_url))
        
        if result["success"]:
            return BackgroundRemovalResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                method_used=result["method"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return BackgroundRemovalResponse(
                success=False,
                original_url=request.image_url,
                method_used=result["method"],
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"Hybrid background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Hybrid background removal failed: {str(e)}")

@router.post("/remove-background/auto")
async def remove_background_auto(request: BackgroundRemovalRequest):
    """
    Automatically choose the best background removal method
    
    Args:
        request: Background removal request
        
    Returns:
        BackgroundRemovalResponse with transparent image
    """
    try:
        # Try AI first, fallback to hybrid if needed
        result = await ai_remover.remove_background_ai(str(request.image_url))
        
        if not result["success"]:
            logger.info("AI method failed, trying hybrid approach...")
            result = await ai_remover.remove_background_hybrid(str(request.image_url))
        
        if result["success"]:
            return BackgroundRemovalResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                method_used=result["method"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return BackgroundRemovalResponse(
                success=False,
                original_url=request.image_url,
                method_used=result["method"],
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"Auto background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Auto background removal failed: {str(e)}")
