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
from src.api.asset_pack import router as asset_pack_router
from src.api.stats import router as stats_router
from src.models.schemas import HealthResponse
from src.middleware.request_id import RequestIDMiddleware
from src.logging import logger

# Load environment variables
load_dotenv()

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
            "stats": "/api/v1/stats",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint - simple version for Railway"""
    try:
        # Create required directories if they don't exist
        temp_dir = os.getenv("TEMP_DIR", "/app/temp")
        output_dir = os.getenv("OUTPUT_DIR", "/app/output")
        
        os.makedirs(temp_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        # Simple health check response
        return {
            "status": "healthy",
            "service": "image-processor",
            "version": "1.0.0",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "image-processor",
            "version": "1.0.0",
            "error": str(e)
        }

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
