"""
API endpoints for image preprocessing
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import time

from models.schemas import PreprocessRequest, PreprocessResponse
from services.preprocessor import preprocessor

router = APIRouter()

@router.post("/preprocess", response_model=PreprocessResponse)
async def preprocess_image(request: PreprocessRequest):
    """
    Preprocess an image for print preparation
    
    Args:
        request: Preprocessing request with image URL and options
        
    Returns:
        PreprocessResponse with results
    """
    try:
        result = await preprocessor.preprocess_for_print(
            image_url=str(request.image_url),
            preprocessing_options=request.options
        )
        
        if result["success"]:
            return PreprocessResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                preprocessing_applied=result["preprocessing_applied"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return PreprocessResponse(
                success=False,
                original_url=request.image_url,
                preprocessing_applied=[],
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

@router.get("/preprocess/options")
async def get_preprocessing_options():
    """
    Get available preprocessing options for print preparation
    
    Returns:
        List of available preprocessing options
    """
    return {
        "options": [
            {
                "name": "denoise",
                "display_name": "Noise Reduction",
                "description": "Remove image noise and artifacts",
                "default": True,
                "type": "boolean"
            },
            {
                "name": "sharpen",
                "display_name": "Image Sharpening",
                "description": "Enhance edges for crisp printing",
                "default": True,
                "type": "boolean"
            },
            {
                "name": "enhance_contrast",
                "display_name": "Contrast Enhancement",
                "description": "Improve contrast for better visibility",
                "default": True,
                "type": "boolean"
            },
            {
                "name": "color_correct",
                "display_name": "Color Correction",
                "description": "Optimize colors for print accuracy",
                "default": True,
                "type": "boolean"
            },
            {
                "name": "remove_background",
                "display_name": "Background Removal",
                "description": "Clean or remove background",
                "default": False,
                "type": "boolean"
            },
            {
                "name": "print_resolution",
                "display_name": "Print Resolution (DPI)",
                "description": "Resize for print resolution",
                "default": 300,
                "type": "integer",
                "min": 150,
                "max": 600
            },
            {
                "name": "convert_to_cmyk",
                "display_name": "CMYK Conversion",
                "description": "Convert to CMYK color space for print",
                "default": False,
                "type": "boolean"
            }
        ]
    }

@router.post("/preprocess/print-ready")
async def create_print_ready_image(request: PreprocessRequest):
    """
    Create a print-ready version of the image with optimal settings
    
    Args:
        request: Preprocessing request
        
    Returns:
        PreprocessResponse with print-ready image
    """
    # Use optimal print settings
    print_ready_options = {
        "denoise": True,
        "sharpen": True,
        "enhance_contrast": True,
        "color_correct": True,
        "remove_background": False,
        "print_resolution": 300,
        "convert_to_cmyk": False  # Keep RGB for web display
    }
    
    try:
        result = await preprocessor.preprocess_for_print(
            image_url=str(request.image_url),
            preprocessing_options=print_ready_options
        )
        
        if result["success"]:
            return PreprocessResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                preprocessing_applied=list(print_ready_options.keys()),
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return PreprocessResponse(
                success=False,
                original_url=request.image_url,
                preprocessing_applied=[],
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print-ready processing failed: {str(e)}")

@router.post("/preprocess/logo-ready")
async def create_logo_ready_image(request: PreprocessRequest):
    """
    Create a logo-ready version with background removal and transparency
    
    Args:
        request: Preprocessing request
        
    Returns:
        PreprocessResponse with logo-ready image
    """
    # Use optimal logo settings with background removal
    logo_ready_options = {
        "denoise": True,
        "sharpen": True,
        "enhance_contrast": True,
        "color_correct": True,
        "remove_background": True,  # Enable background removal
        "print_resolution": 300,
        "convert_to_cmyk": False  # Keep RGB for web display
    }
    
    try:
        result = await preprocessor.preprocess_for_print(
            image_url=str(request.image_url),
            preprocessing_options=logo_ready_options
        )
        
        if result["success"]:
            return PreprocessResponse(
                success=True,
                processed_url=result["processed_path"],
                original_url=request.image_url,
                preprocessing_applied=list(logo_ready_options.keys()),
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return PreprocessResponse(
                success=False,
                original_url=request.image_url,
                preprocessing_applied=[],
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logo-ready processing failed: {str(e)}")
