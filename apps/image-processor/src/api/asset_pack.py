"""
Asset Pack Creation API endpoints
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
import asyncio
import time

from src.services.asset_cleanup import AssetCleanupService
from src.services.logo_overlay import LogoOverlayService
from src.validators import InputValidator, ValidationError, FileValidator
from src.storage import storage_client
from src.custom_logging import logger

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

@router.post("/asset-pack-legacy", response_model=AssetPackResponse)
async def create_asset_pack(request: AssetPackRequest):
    """
    Create a complete asset pack for a team logo
    
    This endpoint:
    1. Cleans up the logo (removes background, enhances)
    2. Creates t-shirt front with logo
    3. Creates t-shirt back with roster
    4. Creates banner with logo and roster (optional)
    
    Args:
        request: Asset pack request with logo URL and team details
        
    Returns:
        URLs for all generated assets
    """
    request_id = getattr(request, 'request_id', 'unknown')
    start_time = time.time()
    
    try:
        # Log the request (temporarily disabled - database tables don't exist)
        # await storage.log_request(
        #     request_id=request_id,
        #     endpoint="asset-pack",
        #     image_url=str(request.logo_url),
        #     parameters={
        #         "team_name": request.team_name,
        #         "player_count": len(request.players),
        #         "tshirt_color": request.tshirt_color,
        #         "include_banner": request.include_banner
        #     }
        # )
        
        # Validate input parameters
        InputValidator.validate_image_url(str(request.logo_url), "logo_url")
        InputValidator.validate_team_name(request.team_name, "team_name")
        InputValidator.validate_output_format(request.output_format, "output_format")
        InputValidator.validate_quality(request.quality, "quality")
        
        # Validate players
        for i, player in enumerate(request.players):
            InputValidator.validate_player_number(player.number, f"players[{i}].number")
            InputValidator.validate_player_name(player.name, f"players[{i}].name")
        
        # Validate file based on URL scheme
        logo_url = str(request.logo_url)
        from urllib.parse import urlparse
        parsed_url = urlparse(logo_url)
        
        if parsed_url.scheme == 'file':
            # For file URLs, validate local file
            file_path = parsed_url.path
            is_valid, error_msg, validation_info = FileValidator.validate_file_for_processing(
                file_path, "logo"
            )
        else:
            # For HTTP/HTTPS URLs, validate remote file
            is_valid, error_msg, validation_info = FileValidator.validate_remote_file_for_processing(
                logo_url, "logo"
            )
        
        if not is_valid:
            raise ValidationError(error_msg, "logo_url")
        
        logger.info("Starting asset pack creation", 
                   request_id=request_id,
                   team_name=request.team_name,
                   player_count=len(request.players),
                   logo_url=str(request.logo_url))
        
        # Step 1: Clean the logo using cleanup service and get Supabase URL
        logger.info("Step 1: Cleaning logo with Supabase storage", request_id=request_id)
        cleanup_result = await cleanup_service.cleanup_logo(
            logo_url=str(request.logo_url),
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not cleanup_result["success"]:
            raise Exception(f"Logo cleanup failed: {cleanup_result['error']}")
        
        clean_logo_url = cleanup_result["output_url"]
        logger.info(f"Cleaned logo URL: {clean_logo_url}")
        
        # Step 2: Create t-shirt front with logo
        logger.info("Step 2: Creating t-shirt front", request_id=request_id)
        tshirt_front_result = await overlay_service.overlay_logo_on_tshirt(
            logo_url=clean_logo_url,
            tshirt_color=request.tshirt_color,
            position="left_chest",
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not tshirt_front_result["success"]:
            raise Exception(f"T-shirt front creation failed: {tshirt_front_result['error']}")
        
        tshirt_front_url = tshirt_front_result["tshirt_url"]
        
        # Step 3: Create t-shirt back with roster
        logger.info("Step 3: Creating t-shirt back with roster", request_id=request_id)
        tshirt_back_result = await overlay_service.overlay_roster_on_tshirt_back(
            players=request.players,
            tshirt_color=request.tshirt_color,
            output_format=request.output_format,
            quality=request.quality,
            logo_url=clean_logo_url
        )
        
        if not tshirt_back_result["success"]:
            raise Exception(f"T-shirt back creation failed: {tshirt_back_result['error']}")
        
        tshirt_back_url = tshirt_back_result["tshirt_url"]
        
        # Step 4: Create banner (optional)
        banner_url = None
        if request.include_banner:
            logger.info("Step 4: Creating banner", request_id=request_id)
            banner_result = await overlay_service.create_banner(
                logo_url=clean_logo_url,
                team_name=request.team_name,
                players=request.players,
                output_format=request.output_format,
                quality=request.quality
            )
            
            if banner_result["success"]:
                banner_url = banner_result["banner_url"]
            else:
                logger.warning("Banner creation failed, continuing without banner",
                             request_id=request_id,
                             error_message=banner_result["error"])
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Log success (temporarily disabled - database tables don't exist)
        # await storage.log_success(
        #     request_id=request_id,
        #     processing_time_ms=processing_time_ms,
        #     output_url=clean_logo_url,
        #     processing_steps=[
        #         "logo_cleanup",
        #         "tshirt_front_creation", 
        #         "tshirt_back_creation",
        #         "banner_creation" if request.include_banner else None
        #     ],
        #     endpoint="asset-pack"
        # )
        
        logger.info("Asset pack creation completed successfully",
                   request_id=request_id,
                   team_name=request.team_name,
                   processing_time_ms=processing_time_ms)
        
        return AssetPackResponse(
            success=True,
            team_name=request.team_name,
            clean_logo_url=clean_logo_url,
            tshirt_front_url=tshirt_front_url,
            tshirt_back_url=tshirt_back_url,
            banner_url=banner_url,
            processing_time_ms=processing_time_ms
        )

# New simplified asset pack endpoint for testing
@app.post("/api/v1/asset-pack-clean-only")
async def asset_pack_clean_only(request: AssetPackRequest):
    """Simplified asset pack that only does logo cleaning"""
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    try:
        logger.info("Starting simplified asset pack (clean only)", 
                   request_id=request_id,
                   team_name=request.team_name,
                   logo_url=str(request.logo_url))
        
        # Step 1: Clean the logo using cleanup service and get Supabase URL
        logger.info("Step 1: Cleaning logo with Supabase storage", request_id=request_id)
        from src.services.asset_cleanup import AssetCleanupService
        cleanup_service = AssetCleanupService()
        
        cleanup_result = await cleanup_service.cleanup_logo(
            logo_url=str(request.logo_url),
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not cleanup_result["success"]:
            raise Exception(f"Logo cleanup failed: {cleanup_result['error']}")
        
        clean_logo_url = cleanup_result["output_url"]
        logger.info(f"Cleaned logo URL: {clean_logo_url}")
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "team_name": request.team_name,
            "original_logo_url": str(request.logo_url),
            "clean_logo_url": clean_logo_url,
            "processing_time_ms": processing_time_ms,
            "message": "Logo cleaning completed successfully"
        }
        
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Simplified asset pack failed: {str(e)}", request_id=request_id)
        return {
            "success": False,
            "team_name": request.team_name,
            "original_logo_url": str(request.logo_url),
            "clean_logo_url": None,
            "processing_time_ms": processing_time_ms,
            "error": str(e)
        }
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "message": e.message,
                "field": e.field
            }
        )
        
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # await storage.log_failure(
        #     request_id=request_id,
        #     error_message=str(e),
        #     processing_time_ms=processing_time_ms,
        #     endpoint="asset-pack"
        # )
        
        logger.error("Asset pack creation failed",
                    request_id=request_id,
                    team_name=request.team_name,
                    error_message=str(e),
                    processing_time_ms=processing_time_ms)
        
        return AssetPackResponse(
            success=False,
            team_name=request.team_name,
            processing_time_ms=processing_time_ms,
            error=str(e)
        )
