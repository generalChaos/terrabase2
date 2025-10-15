"""
Image Processor Service
FastAPI application for image upscaling and SVG generation
"""

import os
from dotenv import load_dotenv

# Load environment variables FIRST before any other imports
load_dotenv("local.env")

# Log startup immediately after environment is loaded
print("🚀 Image Processor Service Starting...")
print("📊 Service Configuration:")
print(f"   - Environment loaded from: local.env")
print(f"   - Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")
print(f"   - Supabase Key: {'*' * 20}{os.getenv('SUPABASE_SERVICE_KEY', '')[-4:] if os.getenv('SUPABASE_SERVICE_KEY') else 'Not set'}")
print(f"   - API Host: {os.getenv('API_HOST', '0.0.0.0')}")
print(f"   - API Port: {os.getenv('API_PORT', '8000')}")
print(f"   - Log Level: {os.getenv('LOG_LEVEL', 'INFO')}")

# Now import everything else
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from src.api.upscaling import router as upscaling_router
from src.api.asset_pack_simple import router as asset_pack_router
from src.api.stats import router as stats_router
from src.api.storage import router as storage_router
from src.api.background_removal import router as background_removal_router
from src.api.tshirt import router as tshirt_router
from src.api.banner_generator import router as banner_router
from src.api.color_analysis import analyze_colors_endpoint
from src.api.color_analysis_v2 import register_routes as register_color_analysis_v2
from src.models.schemas import HealthResponse
from src.middleware.request_id import RequestIDMiddleware
from src.custom_logging import logger
from src.services.logo_overlay import LogoOverlayService
from pydantic import BaseModel
from typing import List, Dict, Any

print("✅ All imports completed successfully")

# Initialize Supabase client
from supabase import create_client
import os

# Supabase configuration
print("🔧 Initializing Supabase client...")
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
# Try multiple environment variable names for the service key
SUPABASE_SERVICE_KEY = (os.getenv("SUPABASE_SERVICE_KEY") or 
                       os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
                       os.getenv("SUPABASE_ANON_KEY"))

print(f"   - Supabase URL: {SUPABASE_URL}")
print(f"   - Supabase Key found: {'Yes' if SUPABASE_SERVICE_KEY else 'No'}")

if not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required")
    print("   Available environment variables:")
    for key, value in os.environ.items():
        if 'SUPABASE' in key:
            print(f"   - {key}: {'*' * 20}{value[-4:] if value else 'None'}")
    raise ValueError("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client initialized successfully")
except Exception as e:
    print(f"❌ ERROR: Failed to initialize Supabase client: {e}")
    raise

# Log startup configuration
logger.info("🚀 Image Processor Service Starting...")
logger.info(f"📊 Service Configuration:")
logger.info(f"   - Supabase URL: {SUPABASE_URL}")
logger.info(f"   - Supabase Key: {'*' * 20}{SUPABASE_SERVICE_KEY[-4:] if SUPABASE_SERVICE_KEY else 'None'}")
logger.info(f"   - API Host: {os.getenv('API_HOST', '0.0.0.0')}")
logger.info(f"   - API Port: {os.getenv('API_PORT', '8000')}")
logger.info(f"   - Log Level: {os.getenv('LOG_LEVEL', 'INFO')}")
logger.info(f"   - CORS Origins: {os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3003')}")
logger.info(f"   - Temp Directory: {os.getenv('TEMP_DIR', '/app/temp')}")
logger.info(f"   - Output Directory: {os.getenv('OUTPUT_DIR', '/app/output')}")
logger.info(f"   - Models Directory: {os.getenv('MODELS_DIR', './models')}")

# Logging is configured in the structured_logger module

# Create FastAPI app
logger.info("🔧 Creating FastAPI application...")
app = FastAPI(
    title="Image Processor Service",
    description="Image upscaling and SVG generation service for party-game",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
logger.info("✅ FastAPI application created successfully")

# Request ID middleware (must be first)
logger.info("🔧 Adding middleware...")
app.add_middleware(RequestIDMiddleware)
logger.info("   ✅ Request ID middleware added")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3003").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"   ✅ CORS middleware added (origins: {cors_origins})")

# Include routers
logger.info("🔧 Registering API routes...")
app.include_router(upscaling_router, prefix="/api/v1", tags=["upscaling"])
logger.info("   ✅ Upscaling router registered")
app.include_router(asset_pack_router, prefix="/api/v1", tags=["asset-pack"])
logger.info("   ✅ Asset pack router registered")
app.include_router(stats_router, prefix="/api/v1", tags=["stats"])
logger.info("   ✅ Stats router registered")
app.include_router(storage_router, prefix="/api/v1", tags=["storage"])
logger.info("   ✅ Storage router registered")
app.include_router(background_removal_router, prefix="/api/v1", tags=["background-removal"])
logger.info("   ✅ Background removal router registered")
app.include_router(tshirt_router, prefix="/api/v1", tags=["tshirt"])
logger.info("   ✅ T-shirt router registered")
app.include_router(banner_router, prefix="/api/v1", tags=["banner"])
logger.info("   ✅ Banner router registered")

# Register color analysis v2 routes
register_color_analysis_v2(app)
logger.info("   ✅ Color analysis v2 routes registered")

# Add startup event handler
@app.on_event("startup")
async def startup_event():
    """Log when the FastAPI application starts"""
    logger.info("🎉 FastAPI application started successfully!")
    logger.info("🔗 Available endpoints:")
    logger.info("   - Health: /health")
    logger.info("   - API Health: /api/v1/health")
    logger.info("   - Documentation: /docs")
    logger.info("   - ReDoc: /redoc")
    logger.info("   - Root: /")
    logger.info("🎯 Service is ready to accept requests!")

# Add shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Log when the FastAPI application shuts down"""
    logger.info("🛑 Image Processor Service shutting down...")
    logger.info("👋 Goodbye!")

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
logger.info("🔧 Initializing services...")
logo_overlay_service = LogoOverlayService()
logger.info("   ✅ Logo overlay service initialized")

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
    # Log startup completion
    logger.info("🎉 Image Processor Service initialization complete!")
    logger.info("🌐 Starting server...")
    
    # Get server configuration
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("LOG_LEVEL") == "DEBUG"
    
    logger.info(f"🚀 Starting server on {host}:{port}")
    logger.info(f"🔄 Reload mode: {'enabled' if reload else 'disabled'}")
    logger.info(f"📚 API Documentation available at: http://{host}:{port}/docs")
    logger.info(f"🔍 Health check available at: http://{host}:{port}/health")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload
    )
