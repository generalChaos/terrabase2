"""
API endpoints for AI-powered background removal
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List

from src.services.ai_background_remover import AIBackgroundRemover

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

class SimpleBackgroundRemovalRequest(BaseModel):
    """Simple request model for background removal with file URLs"""
    image_url: str = Field(..., description="URL or file path of the image to process")
    output_format: str = Field(default="png", description="Output format: 'png' or 'jpg'")
    quality: int = Field(default=95, ge=1, le=100, description="Output quality (1-100)")

@router.post("/remove-background")
async def remove_background_simple(request: SimpleBackgroundRemovalRequest) -> dict:
    """
    Simple background removal endpoint that accepts file URLs and returns Supabase URLs
    
    Args:
        request: Background removal request with image URL and output settings
        
    Returns:
        Dictionary with processing results and Supabase URL
    """
    try:
        logger.info(f"Simple background removal request for: {request.image_url}")
        
        # Use hybrid method for best results
        result = await ai_remover.remove_background_hybrid(request.image_url)
        
        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "original_url": request.image_url
            }
        
        # Upload to storage
        from src.storage import storage_client
        
        # Read the processed image
        import os
        if os.path.exists(result["output_url"]):
            with open(result["output_url"], "rb") as f:
                file_data = f.read()
            
            # Generate filename
            import time
            timestamp = int(time.time() * 1000)
            filename = f"bg_removed_{timestamp}.{request.output_format}"
            
            # Upload to Supabase
            storage_file = await storage.upload_file(
                file_data=file_data,
                file_name=filename,
                bucket='team-logos',
                content_type=f'image/{request.output_format}'
            )
            
            # Clean up local file
            try:
                os.remove(result["output_url"])
            except:
                pass
            
            return {
                "success": True,
                "original_url": request.image_url,
                "processed_url": storage_file.public_url,
                "method_used": result["method"],
                "file_size_bytes": storage_file.file_size,
                "output_format": request.output_format,
                "quality": request.quality
            }
        else:
            return {
                "success": False,
                "error": "Processed image file not found",
                "original_url": request.image_url
            }
            
    except Exception as e:
        logger.error(f"Simple background removal failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "original_url": request.image_url
        }
