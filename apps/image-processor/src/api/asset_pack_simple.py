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
from src.services.supabase_service import supabase_service
from src.validators import InputValidator, ValidationError, FileValidator
from src.api.color_analysis import analyze_image_colors

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
    logo_id: Optional[str] = Field(None, description="ID of the logo in the database")
    logo_url: Optional[str] = Field(None, description="URL of the logo to process")
    team_name: str = Field(..., min_length=1, max_length=100, description="Team name")
    players: Optional[List[Player]] = Field(default=None, description="Team roster (optional, will use default if not provided)")
    tshirt_color: str = Field("black", description="T-shirt color (black, white)")
    include_banner: bool = Field(True, description="Include banner generation")
    output_format: str = Field("png", description="Output format (png, jpg, webp)")
    quality: int = Field(95, ge=1, le=100, description="Output quality (1-100)")
    
    class Config:
        # Allow extra fields and make all fields optional by default
        extra = "allow"

class ColorAnalysis(BaseModel):
    """Color analysis result"""
    colors: List[str] = Field(..., description="Top 3 colors as hex codes")
    frequencies: List[int] = Field(..., description="Color frequencies")
    percentages: List[float] = Field(..., description="Color percentages")
    total_pixels_analyzed: int = Field(..., description="Total pixels analyzed")

class AssetPackResponse(BaseModel):
    """Response model for asset pack creation"""
    success: bool
    team_name: str
    clean_logo_url: Optional[str] = None
    tshirt_front_url: Optional[str] = None
    tshirt_back_url: Optional[str] = None
    banner_url: Optional[str] = None
    colors: Optional[ColorAnalysis] = None
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
        # Use fallback players if none provided
        if request.players is None or len(request.players) == 0:
            request.players = [
                Player(number=1, name="Captain"),
                Player(number=2, name="Vice Captain"),
                Player(number=3, name="Starter"),
                Player(number=4, name="Starter"),
                Player(number=5, name="Starter")
            ]
            print(f"DEBUG: Using fallback players: {request.players}")
        
        # Determine logo source and get logo data
        logo_source = None
        logo_data = None
        
        if request.logo_id:
            print(f"DEBUG: Using logo_id approach: {request.logo_id}")
            logo_data = await supabase_service.get_logo_by_id(request.logo_id)
            if logo_data:
                # Try to download from storage first
                logo_image = await supabase_service.download_logo_image(logo_data)
                if logo_image:
                    logo_source = "image"
                    print(f"DEBUG: Successfully downloaded logo from storage")
                else:
                    # Fallback to URL approach
                    logo_source = "url"
                    logo_url = f"http://127.0.0.1:54321/storage/v1/object/public/{logo_data.get('storage_bucket', 'team-logos') if logo_data else 'team-logos'}/{logo_data.get('file_path') if logo_data else ''}"
                    print(f"DEBUG: Falling back to URL approach: {logo_url}")
            else:
                return AssetPackResponse(
                    success=False,
                    team_name=request.team_name,
                    processing_time_ms=int((time.time() - start_time) * 1000),
                    error=f"Logo not found with ID: {request.logo_id}"
                )
        elif request.logo_url:
            print(f"DEBUG: Using logo_url approach: {request.logo_url}")
            logo_source = "url"
            logo_url = request.logo_url
        else:
            return AssetPackResponse(
                success=False,
                team_name=request.team_name,
                processing_time_ms=int((time.time() - start_time) * 1000),
                error="Either logo_id or logo_url must be provided"
            )
        
        # Step 1: Clean the logo (remove background, enhance)
        if logo_source == "image":
            print(f"DEBUG: Starting logo cleanup from PIL Image")
            cleanup_result = await cleanup_service.cleanup_logo_from_image(
                logo_image=logo_image,
                output_format=request.output_format,
                quality=request.quality
            )
        else:
            print(f"DEBUG: Starting logo cleanup from URL")
            cleanup_result = await cleanup_service.cleanup_logo(
                logo_url=logo_url if request.logo_url else f"http://127.0.0.1:54321/storage/v1/object/public/{logo_data.get('storage_bucket', 'team-logos') if logo_data else 'team-logos'}/{logo_data.get('file_path') if logo_data else ''}",
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
        
        # Step 1.5: Analyze colors from the clean logo
        print(f"DEBUG: Starting color analysis for URL: {clean_logo_url}")
        color_analysis_result = None
        try:
            # Clean the URL by removing query parameters that might cause issues
            clean_url = clean_logo_url.split('?')[0] if '?' in clean_logo_url else clean_logo_url
            print(f"DEBUG: Cleaned URL for color analysis: {clean_url}")
            
            print(f"DEBUG: Calling analyze_image_colors function")
            color_analysis_data = analyze_image_colors(clean_url)
            print(f"DEBUG: Color analysis raw result type: {type(color_analysis_data)}")
            print(f"DEBUG: Color analysis raw result: {color_analysis_data}")
            
            # The function returns data directly
            if color_analysis_data and isinstance(color_analysis_data, dict) and "colors" in color_analysis_data:
                print(f"DEBUG: Color analysis successful, creating ColorAnalysis object")
                print(f"DEBUG: Colors found: {color_analysis_data['colors']}")
                color_analysis_result = ColorAnalysis(
                    colors=color_analysis_data["colors"],
                    frequencies=color_analysis_data["frequencies"],
                    percentages=color_analysis_data["percentages"],
                    total_pixels_analyzed=color_analysis_data["total_pixels_analyzed"]
                )
                print(f"DEBUG: Color analysis successful: {color_analysis_result.colors}")
            else:
                print(f"DEBUG: Color analysis failed: Invalid data format")
                print(f"DEBUG: Data type: {type(color_analysis_data)}")
                print(f"DEBUG: Data content: {color_analysis_data}")
        except Exception as e:
            print(f"DEBUG: Color analysis exception: {e}")
            import traceback
            traceback.print_exc()
        
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
        
        # Store asset pack in database
        print(f"DEBUG: Storing asset pack in database")
        flow_id = logo_data.get("flow_id") if logo_data else None
        if flow_id:
            asset_pack_data = {
                "team_name": request.team_name,
                "clean_logo": clean_logo_url,
                "tshirt_front": tshirt_front_url,
                "tshirt_back": tshirt_back_url,
                "banner": banner_url,
                "processing_time_ms": processing_time_ms,
                "colors": color_analysis_result.dict() if color_analysis_result else None
            }
            
            store_success = await supabase_service.store_asset_pack(
                flow_id=flow_id,
                logo_id=request.logo_id,
                asset_pack_data=asset_pack_data
            )
            if store_success:
                print(f"DEBUG: Asset pack stored successfully")
            else:
                print(f"DEBUG: Warning: Failed to store asset pack in database")
        else:
            print(f"DEBUG: Warning: No flow_id found in logo data, skipping database storage")
        
        return AssetPackResponse(
            success=True,
            team_name=request.team_name,
            clean_logo_url=clean_logo_url,
            tshirt_front_url=tshirt_front_url,
            tshirt_back_url=tshirt_back_url,
            banner_url=banner_url,
            colors=color_analysis_result,
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

# New simplified asset pack endpoint for testing
@router.post("/asset-pack-clean-only")
async def asset_pack_clean_only(request: AssetPackRequest):
    """Simplified asset pack that only does logo cleaning"""
    start_time = time.time()
    request_id = f"clean-only-{int(time.time())}"
    
    try:
        print(f"DEBUG: Starting simplified asset pack (clean only)", 
              f"request_id={request_id}",
              f"team_name={request.team_name}",
              f"logo_url={request.logo_url}")
        
        # Step 1: Clean the logo using cleanup service and get Supabase URL
        print(f"DEBUG: Step 1: Cleaning logo with Supabase storage")
        
        cleanup_result = await cleanup_service.cleanup_logo(
            logo_url=str(request.logo_url),
            output_format=request.output_format,
            quality=request.quality
        )
        
        if not cleanup_result["success"]:
            raise Exception(f"Logo cleanup failed: {cleanup_result['error']}")
        
        clean_logo_url = cleanup_result["output_url"]
        print(f"DEBUG: Cleaned logo URL: {clean_logo_url}")
        
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
        print(f"DEBUG: Simplified asset pack failed: {str(e)}")
        return {
            "success": False,
            "team_name": request.team_name,
            "original_logo_url": str(request.logo_url),
            "clean_logo_url": None,
            "processing_time_ms": processing_time_ms,
            "error": str(e)
        }
