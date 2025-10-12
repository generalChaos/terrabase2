"""
Image Processor Service
FastAPI application for image upscaling and SVG generation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from src.api.upscaling import router as upscaling_router
from src.api.asset_pack_simple import router as asset_pack_router
from src.api.stats import router as stats_router
from src.api.storage import router as storage_router
from src.api.background_removal import router as background_removal_router
from src.api.tshirt import router as tshirt_router
from src.api.banner_generator import router as banner_router
from src.api.color_analysis import analyze_colors_endpoint
from src.models.schemas import HealthResponse
from src.middleware.request_id import RequestIDMiddleware
from src.custom_logging import logger
from src.services.logo_overlay import LogoOverlayService
from pydantic import BaseModel
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

# Initialize Supabase client
from supabase import create_client
import os

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
# Try multiple environment variable names for the service key
SUPABASE_SERVICE_KEY = (os.getenv("SUPABASE_SERVICE_KEY") or 
                       os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
                       os.getenv("SUPABASE_ANON_KEY"))

if not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Logging is configured in the structured_logger module

# Create FastAPI app
app = FastAPI(
    title="Image Processor Service",
    description="Image upscaling and SVG generation service for party-game",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request ID middleware (must be first)
app.add_middleware(RequestIDMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upscaling_router, prefix="/api/v1", tags=["upscaling"])
app.include_router(asset_pack_router, prefix="/api/v1", tags=["asset-pack"])
app.include_router(stats_router, prefix="/api/v1", tags=["stats"])
app.include_router(storage_router, prefix="/api/v1", tags=["storage"])
app.include_router(background_removal_router, prefix="/api/v1", tags=["background-removal"])
app.include_router(tshirt_router, prefix="/api/v1", tags=["tshirt"])
app.include_router(banner_router, prefix="/api/v1", tags=["banner"])

# Add health endpoint under /api/v1 for consistency with frontend
@app.get("/api/v1/health", response_model=HealthResponse)
async def api_health_check():
    """API health check endpoint (for frontend compatibility)"""

# Color analysis endpoint
class ColorAnalysisRequest(BaseModel):
    image_url: str

class ColorAnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any] = None
    error: str = None

@app.post("/api/v1/analyze-colors", response_model=ColorAnalysisResponse)
async def analyze_colors(request: ColorAnalysisRequest):
    """Analyze an image and return the top 3 most frequent colors"""
    try:
        result = analyze_colors_endpoint({"image_url": request.image_url})
        return ColorAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Color analysis endpoint error: {e}")
        return ColorAnalysisResponse(success=False, error=str(e))

# Test models for banner generation
class TestPlayer(BaseModel):
    number: int
    name: str

class TestBannerRequest(BaseModel):
    logo_url: str
    team_name: str
    players: List[TestPlayer]
    output_format: str = "png"
    quality: int = 95

# Initialize logo overlay service
logo_overlay_service = LogoOverlayService()

# Test banner endpoint
@app.post("/api/v1/test-banner")
async def test_banner_generation(request: TestBannerRequest):
    """Test banner generation with Impact font"""
    try:
        # Convert players to the format expected by the service
        players_data = [{"number": p.number, "name": p.name} for p in request.players]
        
        # Call the create_banner method directly
        result = await logo_overlay_service.create_banner(
            logo_url=request.logo_url,
            team_name=request.team_name,
            players=players_data,
            output_format=request.output_format,
            quality=request.quality
        )
        
        return result
    except Exception as e:
        logger.error(f"Banner generation failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "banner_url": None
        }

@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": "Image Processor",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "upscaling": "/api/v1/upscale",
            "asset_pack": "/api/v1/asset-pack",
            "background_removal": "/api/v1/remove-background",
            "tshirt_front": "/api/v1/tshirt/front",
            "tshirt_back": "/api/v1/tshirt/back",
            "tshirt_both": "/api/v1/tshirt/both",
            "stats": "/api/v1/stats",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check if required directories exist
        temp_dir = os.getenv("TEMP_DIR", "/app/temp")
        output_dir = os.getenv("OUTPUT_DIR", "/app/output")
        
        temp_exists = os.path.exists(temp_dir)
        output_exists = os.path.exists(output_dir)
        
        # Check if models are available (optional)
        models_dir = os.getenv("MODELS_DIR", "./models")
        realesrgan_model = os.getenv("REALESRGAN_MODEL_PATH", os.path.join(models_dir, "RealESRGAN_x4plus.pth"))
        model_exists = os.path.exists(realesrgan_model)
        
        healthy = temp_exists and output_exists
        
        return HealthResponse(
            status="healthy" if healthy else "unhealthy",
            service="image-processor",
            version="1.0.0",
            checks={
                "temp_directory": temp_exists,
                "output_directory": output_exists,
                "model_available": model_exists
            }
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            service="image-processor",
            version="1.0.0",
            checks={"error": str(e)}
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url),
            "request_id": request_id
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "path": str(request.url),
            "request_id": request_id,
            "detail": str(exc) if os.getenv("LOG_LEVEL") == "DEBUG" else "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("LOG_LEVEL") == "DEBUG"
    )
