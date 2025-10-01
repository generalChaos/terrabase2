"""
API endpoints for image upscaling
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import os
import time

from models.schemas import (
    UpscaleRequest,
    UpscaleResponse,
    BatchUpscaleRequest,
    BatchUpscaleResponse
)
from services.upscaler import upscaler

router = APIRouter()

@router.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(request: UpscaleRequest):
    """
    Upscale a single image
    
    Args:
        request: Upscaling request with image URL and parameters
        
    Returns:
        UpscaleResponse with results
    """
    try:
        result = await upscaler.upscale_image(
            image_url=str(request.image_url),
            scale_factor=request.scale_factor,
            model=request.model.value,
            output_format=request.output_format,
            quality=request.quality
        )
        
        if result["success"]:
            # In a real implementation, you'd upload to Supabase storage
            # and return the public URL. For now, return a simple file path
            upscaled_url = result['upscaled_path']
            
            return UpscaleResponse(
                success=True,
                upscaled_url=upscaled_url,
                original_url=request.image_url,
                scale_factor=result["scale_factor"],
                model_used=result["model_used"],
                processing_time_ms=result["processing_time_ms"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return UpscaleResponse(
                success=False,
                original_url=request.image_url,
                scale_factor=request.scale_factor,
                model_used=request.model.value,
                processing_time_ms=result["processing_time_ms"],
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(e)}")

@router.post("/upscale/batch", response_model=BatchUpscaleResponse)
async def upscale_batch(request: BatchUpscaleRequest, background_tasks: BackgroundTasks):
    """
    Upscale multiple images in batch
    
    Args:
        request: Batch upscaling request
        background_tasks: FastAPI background tasks
        
    Returns:
        BatchUpscaleResponse with results
    """
    start_time = time.time()
    results = []
    
    try:
        # Process images concurrently
        for image_url in request.image_urls:
            result = await upscaler.upscale_image(
                image_url=str(image_url),
                scale_factor=request.scale_factor,
                model=request.model.value,
                output_format=request.output_format,
                quality=request.quality
            )
            
            if result["success"]:
                upscaled_url = f"file://{result['upscaled_path']}"
                response = UpscaleResponse(
                    success=True,
                    upscaled_url=upscaled_url,
                    original_url=image_url,
                    scale_factor=result["scale_factor"],
                    model_used=result["model_used"],
                    processing_time_ms=result["processing_time_ms"],
                    file_size_bytes=result["file_size_bytes"]
                )
            else:
                response = UpscaleResponse(
                    success=False,
                    original_url=image_url,
                    scale_factor=request.scale_factor,
                    model_used=request.model.value,
                    processing_time_ms=result["processing_time_ms"],
                    error=result["error"]
                )
            
            results.append(response)
        
        total_processing_time = int((time.time() - start_time) * 1000)
        total_processed = sum(1 for r in results if r.success)
        total_failed = len(results) - total_processed
        
        return BatchUpscaleResponse(
            success=total_failed == 0,
            results=results,
            total_processed=total_processed,
            total_failed=total_failed,
            processing_time_ms=total_processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch upscaling failed: {str(e)}")

@router.get("/upscale/models")
async def get_available_models():
    """
    Get list of available upscaling models
    
    Returns:
        List of available models with their capabilities
    """
    return {
        "models": [
            {
                "name": "realesrgan",
                "display_name": "Real-ESRGAN",
                "max_scale": 8,
                "description": "State-of-the-art upscaling with excellent quality",
                "available": True  # Would check if model is loaded
            },
            {
                "name": "esrgan",
                "display_name": "ESRGAN",
                "max_scale": 4,
                "description": "Enhanced Super-Resolution GAN",
                "available": True
            },
            {
                "name": "opencv",
                "display_name": "OpenCV Bicubic",
                "max_scale": 8,
                "description": "Fast bicubic interpolation (fallback)",
                "available": True
            }
        ]
    }

@router.get("/upscale/status/{job_id}")
async def get_upscale_status(job_id: str):
    """
    Get status of an upscaling job (for async processing)
    
    Args:
        job_id: Job identifier
        
    Returns:
        Job status information
    """
    # This would integrate with a job queue system like Redis
    # For now, return a placeholder
    return {
        "job_id": job_id,
        "status": "completed",
        "message": "Job status tracking not implemented yet"
    }
