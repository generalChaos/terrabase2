"""
T-Shirt Creation API
Handles t-shirt image generation with logos and rosters
"""

import time
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from src.services.logo_overlay import LogoOverlayService
# from src.services.asset_cleanup import AssetCleanupService  # Not used - AI logos don't need cleanup

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
overlay_service = LogoOverlayService()
# cleanup_service = AssetCleanupService()  # Not used - AI logos don't need cleanup

class Player(BaseModel):
    """Player model for roster"""
    number: int = Field(..., ge=1, le=99, description="Player number (1-99)")
    name: str = Field(..., min_length=1, max_length=50, description="Player name")

class TShirtFrontRequest(BaseModel):
    """Request model for t-shirt front creation"""
    logo_url: str = Field(..., description="URL or file path of the logo image")
    tshirt_color: str = Field(default="black", description="T-shirt color: 'black' or 'white'")
    position: str = Field(default="left_chest", description="Logo position: 'left_chest' or 'center_chest'")
    output_format: str = Field(default="png", description="Output format: 'png', 'jpg', or 'webp'")
    quality: int = Field(default=95, ge=1, le=100, description="Output quality (1-100)")

class TShirtBackRequest(BaseModel):
    """Request model for t-shirt back creation with roster"""
    players: List[Player] = Field(..., min_items=1, max_items=10, description="List of players (1-10)")
    tshirt_color: str = Field(default="black", description="T-shirt color: 'black' or 'white'")
    output_format: str = Field(default="png", description="Output format: 'png', 'jpg', or 'webp'")
    quality: int = Field(default=95, ge=1, le=100, description="Output quality (1-100)")
    logo_url: Optional[str] = Field(default=None, description="Optional URL of logo to display above roster")

class TShirtResponse(BaseModel):
    """Response model for t-shirt creation"""
    success: bool
    tshirt_url: Optional[str] = None
    processing_time_ms: int
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

@router.post("/tshirt/front", response_model=TShirtResponse)
async def create_tshirt_front(request: TShirtFrontRequest) -> TShirtResponse:
    """
    Create t-shirt front with cleaned logo (background removed)
    
    Args:
        request: T-shirt front creation request with logo and settings
        
    Returns:
        TShirtResponse with success status and t-shirt URL
    """
    try:
        logger.info(f"T-shirt front creation request for: {request.logo_url}")
        
        # Validate t-shirt color
        if request.tshirt_color not in ["black", "white"]:
            raise HTTPException(
                status_code=400, 
                detail="tshirt_color must be 'black' or 'white'"
            )
        
        # Validate position
        if request.position not in ["left_chest", "center_chest"]:
            raise HTTPException(
                status_code=400, 
                detail="position must be 'left_chest' or 'center_chest'"
            )
        
        # Use the original logo URL - the service will handle background removal
        clean_logo_url = request.logo_url
        logger.info(f"Using logo URL: {clean_logo_url}")
        
        # Step 2: Create t-shirt front with cleaned logo
        logger.info("Step 2: Creating t-shirt front with cleaned logo")
        result = await overlay_service.overlay_logo_on_tshirt(
            logo_url=clean_logo_url,
            tshirt_color=request.tshirt_color,
            position=request.position,
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not result["success"]:
            return TShirtResponse(
                success=False,
                processing_time_ms=result.get("processing_time_ms", 0),
                error=result["error"]
            )
        
        return TShirtResponse(
            success=True,
            tshirt_url=result["output_url"],
            processing_time_ms=result["processing_time_ms"],
            file_size_bytes=result["file_size_bytes"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"T-shirt front creation failed: {e}")
        return TShirtResponse(
            success=False,
            processing_time_ms=0,
            error=str(e)
        )

@router.post("/tshirt/back", response_model=TShirtResponse)
async def create_tshirt_back(request: TShirtBackRequest) -> TShirtResponse:
    """
    Create t-shirt back with player roster
    
    Args:
        request: T-shirt back creation request with players and settings
        
    Returns:
        TShirtResponse with success status and t-shirt URL
    """
    try:
        logger.info(f"T-shirt back creation request with {len(request.players)} players")
        
        # Validate t-shirt color
        if request.tshirt_color not in ["black", "white"]:
            raise HTTPException(
                status_code=400, 
                detail="tshirt_color must be 'black' or 'white'"
            )
        
        # Convert players to the format expected by the service
        players_data = [{"number": p.number, "name": p.name} for p in request.players]
        
        # Use the original logo URL - the service will handle background removal
        clean_logo_url = request.logo_url
        logger.info(f"Using logo URL: {clean_logo_url}")
        
        # Create t-shirt back
        result = await overlay_service.overlay_roster_on_tshirt_back(
            players=players_data,
            tshirt_color=request.tshirt_color,
            output_format=request.output_format,
            quality=request.quality,
            logo_url=clean_logo_url
        )
        
        if not result["success"]:
            return TShirtResponse(
                success=False,
                processing_time_ms=result.get("processing_time_ms", 0),
                error=result["error"]
            )
        
        return TShirtResponse(
            success=True,
            tshirt_url=result["output_url"],
            processing_time_ms=result["processing_time_ms"],
            file_size_bytes=result["file_size_bytes"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"T-shirt back creation failed: {e}")
        return TShirtResponse(
            success=False,
            processing_time_ms=0,
            error=str(e)
        )

class TShirtBothRequest(BaseModel):
    """Request model for creating both t-shirt front and back"""
    logo_url: str = Field(..., description="URL or file path of the logo image")
    players: List[Player] = Field(..., min_items=1, max_items=10, description="List of players (1-10)")
    tshirt_color: str = Field(default="black", description="T-shirt color: 'black' or 'white'")
    logo_position: str = Field(default="left_chest", description="Logo position: 'left_chest' or 'center_chest'")
    output_format: str = Field(default="png", description="Output format: 'png', 'jpg', or 'webp'")
    quality: int = Field(default=95, ge=1, le=100, description="Output quality (1-100)")

@router.post("/tshirt/both", response_model=dict)
async def create_tshirt_both(request: TShirtBothRequest) -> dict:
    """
    Create both t-shirt front and back
    
    Args:
        request: T-shirt both creation request with logo, players, and settings
        
    Returns:
        Dictionary with both t-shirt URLs and processing info
    """
    try:
        start_time = time.time()
        logger.info(f"Creating both t-shirt front and back for: {request.logo_url}")
        
        # Validate inputs
        if request.tshirt_color not in ["black", "white"]:
            raise HTTPException(
                status_code=400, 
                detail="tshirt_color must be 'black' or 'white'"
            )
        
        if request.logo_position not in ["left_chest", "center_chest"]:
            raise HTTPException(
                status_code=400, 
                detail="logo_position must be 'left_chest' or 'center_chest'"
            )
        
        # Create t-shirt front
        front_result = await overlay_service.overlay_logo_on_tshirt(
            logo_url=request.logo_url,
            tshirt_color=request.tshirt_color,
            position=request.logo_position,
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not front_result["success"]:
            return {
                "success": False,
                "error": f"T-shirt front creation failed: {front_result['error']}",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        # Create t-shirt back
        players_data = [{"number": p.number, "name": p.name} for p in request.players]
        back_result = await overlay_service.overlay_roster_on_tshirt_back(
            players=players_data,
            tshirt_color=request.tshirt_color,
            output_format=request.output_format,
            quality=request.quality,
            logo_url=request.logo_url
        )
        
        if not back_result["success"]:
            return {
                "success": False,
                "error": f"T-shirt back creation failed: {back_result['error']}",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        total_processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "front": {
                "tshirt_url": front_result["output_url"],
                "processing_time_ms": front_result["processing_time_ms"],
                "file_size_bytes": front_result["file_size_bytes"]
            },
            "back": {
                "tshirt_url": back_result["output_url"],
                "processing_time_ms": back_result["processing_time_ms"],
                "file_size_bytes": back_result["file_size_bytes"]
            },
            "total_processing_time_ms": total_processing_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Both t-shirt creation failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
