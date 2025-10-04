"""
Asset Pack Creation API endpoints - Simplified version without logging
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import asyncio
import time

from src.services.asset_cleanup import AssetCleanupService
from src.services.logo_overlay import LogoOverlayService
from src.validators import InputValidator, ValidationError, FileValidator

router = APIRouter()

# Initialize services
cleanup_service = AssetCleanupService()
overlay_service = LogoOverlayService()

class Player(BaseModel):
    """Player model for team roster"""
    number: int = Field(..., ge=1, le=99, description="Player number")
    name: str = Field(..., min_length=1, max_length=50, description="Player name")

class AssetPackRequest(BaseModel):
    """Request model for asset pack creation"""
    logo_url: str = Field(..., description="URL of the logo to process")
    team_name: str = Field(..., min_length=1, max_length=100, description="Team name")
    players: List[Player] = Field(..., min_length=1, max_length=20, description="Team roster")
    tshirt_color: str = Field("black", description="T-shirt color (black, white)")
    include_banner: bool = Field(True, description="Include banner generation")
    output_format: str = Field("png", description="Output format (png, jpg, webp)")
    quality: int = Field(95, ge=1, le=100, description="Output quality (1-100)")

class AssetPackResponse(BaseModel):
    """Response model for asset pack creation"""
    success: bool
    team_name: str
    clean_logo_url: Optional[str] = None
    tshirt_front_url: Optional[str] = None
    tshirt_back_url: Optional[str] = None
    banner_url: Optional[str] = None
    processing_time_ms: int
    error: Optional[str] = None

@router.post("/asset-pack", response_model=AssetPackResponse)
async def create_asset_pack(request: AssetPackRequest):
    """
    Create a complete asset pack for a team
    
    This endpoint processes a logo and generates:
    - Clean logo (background removed)
    - T-shirt front with logo
    - T-shirt back with roster
    - Banner with logo and roster (optional)
    """
    start_time = time.time()
    print(f"DEBUG: Asset pack request received: {request}")
    
    try:
        # Validate input
        try:
            validator = InputValidator()
            validated_url = validator.validate_image_url(request.logo_url)
        except ValidationError as e:
            return AssetPackResponse(
                success=False,
                team_name=request.team_name,
                processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"Invalid logo URL: {e.message}"
            )
        
        # Step 1: Clean the logo (remove background, enhance)
        print(f"DEBUG: Starting logo cleanup for {request.logo_url}")
        cleanup_result = await cleanup_service.cleanup_logo(
            logo_url=request.logo_url,
            output_format=request.output_format,
            quality=request.quality
        )
        print(f"DEBUG: Cleanup result: {cleanup_result}")
        
        if not cleanup_result["success"]:
            return AssetPackResponse(
                success=False,
                team_name=request.team_name,
                processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"Logo cleanup failed: {cleanup_result['error']}"
            )
        
        clean_logo_url = cleanup_result["output_url"]
        print(f"DEBUG: Clean logo URL: {clean_logo_url}")
        
        # Step 2: Create t-shirt front with logo
        tshirt_front_result = await overlay_service.overlay_logo_on_tshirt(
            logo_url=clean_logo_url,
            tshirt_color=request.tshirt_color,
            position="left_chest",
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not tshirt_front_result["success"]:
            return AssetPackResponse(
                success=False,
                team_name=request.team_name,
                processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"T-shirt front creation failed: {tshirt_front_result['error']}"
            )
        
        tshirt_front_url = tshirt_front_result["output_url"]
        
        # Step 3: Create t-shirt back with roster
        players_data = [{"number": p.number, "name": p.name} for p in request.players]
        tshirt_back_result = await overlay_service.overlay_roster_on_tshirt_back(
            players=players_data,
            tshirt_color=request.tshirt_color,
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not tshirt_back_result["success"]:
            return AssetPackResponse(
                success=False,
                team_name=request.team_name,
                processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"T-shirt back creation failed: {tshirt_back_result['error']}"
            )
        
        tshirt_back_url = tshirt_back_result["output_url"]
        
        # Step 4: Create banner (optional)
        banner_url = None
        if request.include_banner:
            roster_text = "\n".join([f"{p.number} {p.name}" for p in request.players])
            banner_result = await overlay_service.create_banner(
                logo_url=clean_logo_url,
                team_name=request.team_name,
                players=players_data
            )
            
            if banner_result["success"]:
                banner_url = banner_result["output_url"]
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return AssetPackResponse(
            success=True,
            team_name=request.team_name,
            clean_logo_url=clean_logo_url,
            tshirt_front_url=tshirt_front_url,
            tshirt_back_url=tshirt_back_url,
            banner_url=banner_url,
            processing_time_ms=processing_time_ms
        )
        
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        print(f"DEBUG: Exception occurred: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        return AssetPackResponse(
            success=False,
            team_name=request.team_name,
            processing_time_ms=processing_time_ms,
            error=f"{type(e).__name__}: {str(e)}"
        )
