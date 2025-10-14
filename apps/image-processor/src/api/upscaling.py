"""
Upscaling API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
import asyncio
import time

from src.services.upscaler import ImageUpscaler
from src.validators import InputValidator, ValidationError, FileValidator
from src.storage import storage_client
from src.custom_logging import logger

router = APIRouter()

# Initialize upscaler service
upscaler = ImageUpscaler()

class UpscaleRequest(BaseModel):
    """Request model for image upscaling"""
    image_url: str = Field(..., description="URL of the image to upscale")
    scale_factor: int = Field(4, ge=2, le=8, description="Upscaling factor (2, 4, or 8)")
    output_format: str = Field("png", description="Output format (png, jpg, webp)")
    quality: int = Field(95, ge=1, le=100, description="Output quality (1-100)")

class UpscaleResponse(BaseModel):
    """Response model for image upscaling"""
    success: bool
    original_url: str
    upscaled_url: Optional[str] = None
    scale_factor: int
    processing_time_ms: int
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

@router.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(request: UpscaleRequest):
    """
    Upscale an image using AI-powered upscaling
    
    Args:
        request: Upscaling request with image URL and parameters
        
    Returns:
        Upscaled image URL and processing details
    """
    request_id = getattr(request, 'request_id', 'unknown')
    start_time = time.time()
    
    try:
        # Log the request
        await storage_client.log_processing_request(
            request_id=request_id,
            endpoint="upscale",
            image_url=str(request.image_url),
            parameters={
                "scale_factor": request.scale_factor,
                "output_format": request.output_format,
                "quality": request.quality
            }
        )
        
        # Validate input parameters
        InputValidator.validate_image_url(str(request.image_url), "image_url")
        InputValidator.validate_scale_factor(request.scale_factor, "scale_factor")
        InputValidator.validate_output_format(request.output_format, "output_format")
        InputValidator.validate_quality(request.quality, "quality")
        
        # Validate file based on URL scheme
        image_url = str(request.image_url)
        from urllib.parse import urlparse
        parsed_url = urlparse(image_url)
        
        if parsed_url.scheme == 'file':
            # For file URLs, validate local file
            file_path = parsed_url.path
            is_valid, error_msg, validation_info = FileValidator.validate_file_for_processing(
                file_path, "image"
            )
        else:
            # For HTTP/HTTPS URLs, validate remote file
            is_valid, error_msg, validation_info = FileValidator.validate_remote_file_for_processing(
                image_url, "image"
            )
        
        if not is_valid:
            raise ValidationError(error_msg, "image_url")
        
        logger.info("Starting image upscaling", 
                   request_id=request_id,
                   image_url=str(request.image_url),
                   scale_factor=request.scale_factor)
        
        # Perform upscaling
        result = await upscaler.upscale_image(
            image_url=str(request.image_url),
            scale_factor=request.scale_factor,
            output_format=request.output_format,
            quality=request.quality
        )
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        if result["success"]:
            # Log success
            await storage_client.log_processing_result(
                request_id=request_id,
                processing_time_ms=processing_time_ms,
                file_size_bytes=result.get("file_size_bytes"),
                output_url=result.get("upscaled_path"),
                endpoint="upscale"
            )
            
            logger.info("Image upscaling completed successfully",
                       request_id=request_id,
                       processing_time_ms=processing_time_ms,
                       file_size_bytes=result.get("file_size_bytes"))
            
            return UpscaleResponse(
                success=True,
                original_url=str(request.image_url),
                upscaled_url=result["upscaled_path"],
                scale_factor=request.scale_factor,
                processing_time_ms=processing_time_ms,
                file_size_bytes=result.get("file_size_bytes")
            )
        else:
            # Log failure
            await storage_client.log_processing_result(
                request_id=request_id,
                error_message=result["error"],
                processing_time_ms=processing_time_ms,
                endpoint="upscale"
            )
            
            logger.error("Image upscaling failed",
                        request_id=request_id,
                        error=result["error"],
                        processing_time_ms=processing_time_ms)
            
            return UpscaleResponse(
                success=False,
                original_url=str(request.image_url),
                scale_factor=request.scale_factor,
                processing_time_ms=processing_time_ms,
                error=result["error"]
            )
            
    except ValidationError as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        await storage_client.log_validation_error(
            request_id=request_id,
            field=e.field or "unknown",
            error_message=e.message,
            value=getattr(request, e.field, None) if e.field else None,
            endpoint="upscale"
        )
        
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
        
        await storage_client.log_processing_result(
            request_id=request_id,
            error_message=str(e),
            processing_time_ms=processing_time_ms,
            endpoint="upscale"
        )
        
        logger.error("Unexpected error during upscaling",
                    request_id=request_id,
                    error=str(e),
                    processing_time_ms=processing_time_ms)
        
        return UpscaleResponse(
            success=False,
            original_url=str(request.image_url),
            scale_factor=request.scale_factor,
            processing_time_ms=processing_time_ms,
            error=str(e)
        )
