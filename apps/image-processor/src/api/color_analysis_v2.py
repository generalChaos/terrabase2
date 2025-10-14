"""
Color Analysis API v2 - Using the new systematic approach
"""

import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import tempfile
import requests

from src.services.color_analysis import analyze_image_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2", tags=["color-analysis-v2"])

class ColorAnalysisRequest(BaseModel):
    image_url: str
    mode: str = "logo"  # "logo" or "photo"
    max_edge: int = 1024
    k_lo: int = 4
    k_hi: int = 10
    min_cluster_pct: float = 0.8
    dilate_alpha: bool = True

class ColorAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/analyze-colors", response_model=ColorAnalysisResponse)
async def analyze_colors_v2(request: ColorAnalysisRequest):
    """
    Analyze colors in an image using the new systematic approach
    
    This endpoint provides:
    - Deterministic color extraction
    - Background detection for logos
    - Optimal cluster selection (elbow method)
    - Role assignment with confidence scores
    - OKLCH color space throughout
    - Near-duplicate merging
    """
    try:
        logger.info(f"🎨 API_V2: Starting color analysis for {request.image_url}")
        
        # Download image
        response = requests.get(request.image_url, timeout=30)
        response.raise_for_status()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        
        try:
            # Analyze image
            result = analyze_image_to_dict(
                tmp_path,
                mode=request.mode,
                max_edge=request.max_edge,
                k_lo=request.k_lo,
                k_hi=request.k_hi,
                min_cluster_pct=request.min_cluster_pct,
                dilate_alpha=request.dilate_alpha
            )
            
            logger.info(f"🎨 API_V2: Analysis complete - {len(result['data']['swatches'])} swatches, K={result['data']['k']}")
            
            return ColorAnalysisResponse(
                success=True,
                data=result["data"]
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except requests.RequestException as e:
        logger.error(f"🎨 API_V2: Failed to download image: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    
    except Exception as e:
        logger.error(f"🎨 API_V2: Color analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Color analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "v2"}

# Add the router to the main app
def register_routes(app):
    app.include_router(router)
