"""
Image Processor Service
FastAPI application for image upscaling and SVG generation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from dotenv import load_dotenv

from api.upscale import router as upscale_router
from api.preprocess import router as preprocess_router
from api.background_removal import router as background_removal_router
from api.logo_processor import router as logo_processor_router
from api.cost_optimized_processor import router as cost_optimized_router
from api.logo_placement import router as logo_placement_router
from api.web_assets import router as web_assets_router
from api.logo_asset_pack import router as logo_asset_pack_router
from api.banner_generator import router as banner_generator_router
from models.schemas import HealthResponse
from middleware.request_id import RequestIDMiddleware

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

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
app.include_router(upscale_router, prefix="/api/v1", tags=["upscale"])
app.include_router(preprocess_router, prefix="/api/v1", tags=["preprocess"])
app.include_router(background_removal_router, prefix="/api/v1", tags=["background-removal"])
app.include_router(logo_processor_router, prefix="/api/v1", tags=["logo-processor"])
app.include_router(cost_optimized_router, prefix="/api/v1", tags=["cost-optimized"])
app.include_router(logo_placement_router, prefix="/api/v1", tags=["logo-placement"])
app.include_router(web_assets_router, prefix="/api/v1", tags=["web-assets"])
app.include_router(logo_asset_pack_router, prefix="/api/v1", tags=["logo-asset-packs"])
app.include_router(banner_generator_router, prefix="/api/v1", tags=["banner-generator"])

@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": "Image Processor",
        "version": "1.0.0",
        "status": "running",
            "endpoints": {
                "upscale": "/api/v1/upscale",
                "preprocess": "/api/v1/preprocess",
                "background_removal": "/api/v1/remove-background",
                "logo_processor": "/api/v1/process-logo",
                "logo_placement": "/api/v1/place-logo",
                "web_assets": "/api/v1/preprocess-logo",
                "logo_asset_packs": "/api/v1/generate-asset-pack",
                "banner_generator": "/api/v1/generate-roster-banner",
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
        realesrgan_model = os.getenv("REALESRGAN_MODEL_PATH", "/app/models/RealESRGAN_x4plus.pth")
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
