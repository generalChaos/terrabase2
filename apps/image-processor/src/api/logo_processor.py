"""
Comprehensive logo processing API - combines AI background removal, Python cleanup, and optimized upscaling
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
import asyncio
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import os

from services.ai_background_remover import AIBackgroundRemover
from services.upscaler import ImageUpscaler
from services.preprocessor import ImagePreprocessor
from utils.filename_utils import generate_pipeline_filename
from validators import InputValidator, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
ai_remover = AIBackgroundRemover()
upscaler = ImageUpscaler()
preprocessor = ImagePreprocessor()

class OptimizedLogoProcessor:
    """Optimized logo processor combining AI and Python tools for best results"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def process_logo_optimized(self, image_url: str, scale_factor: int = 4) -> dict:
        """
        Optimized logo processing pipeline:
        1. AI background removal (rembg)
        2. Python-based cleanup and enhancement
        3. AI-powered upscaling (Real-ESRGAN if available, fallback to OpenCV)
        4. Final Python optimization
        """
        import time
        start_time = time.time()
        processing_steps = []
        
        try:
            # Step 1: AI Background Removal (best quality)
            logger.info("Step 1: AI background removal...")
            processing_steps.append("ai_background_removal")
            
            bg_result = await ai_remover.remove_background_hybrid(image_url)
            if not bg_result["success"]:
                return {"success": False, "error": f"Background removal failed: {bg_result['error']}"}
            
            bg_removed_path = bg_result["processed_path"]
            processing_steps.append("ai_background_removal_complete")
            
            # Step 2: Python-based cleanup and enhancement
            logger.info("Step 2: Python cleanup and enhancement...")
            processing_steps.append("python_cleanup")
            
            enhanced_path = await self._enhance_with_python(bg_removed_path)
            processing_steps.append("python_cleanup_complete")
            
            # Step 3: AI-powered upscaling
            logger.info("Step 3: AI upscaling...")
            processing_steps.append("ai_upscaling")
            
            # Convert local path to file URL for upscaler
            file_url = f"file://{os.path.abspath(enhanced_path)}"
            upscale_result = await upscaler.upscale_image(
                image_url=file_url,
                scale_factor=scale_factor,
                output_format="png"
            )
            
            if not upscale_result["success"]:
                return {"success": False, "error": f"Upscaling failed: {upscale_result['error']}"}
            
            upscaled_path = upscale_result["upscaled_path"]
            processing_steps.append("ai_upscaling_complete")
            
            # Step 4: Final Python optimization
            logger.info("Step 4: Final Python optimization...")
            processing_steps.append("final_optimization")
            
            final_path = await self._final_optimization(upscaled_path)
            processing_steps.append("final_optimization_complete")
            
            # Calculate metrics
            total_time_ms = int((time.time() - start_time) * 1000)
            file_size = os.path.getsize(final_path) if os.path.exists(final_path) else 0
            
            return {
                "success": True,
                "processed_path": final_path,
                "background_removed_path": bg_removed_path,
                "enhanced_path": enhanced_path,
                "upscaled_path": upscaled_path,
                "processing_steps": processing_steps,
                "total_processing_time_ms": total_time_ms,
                "file_size_bytes": file_size
            }
            
        except Exception as e:
            logger.error(f"Optimized logo processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_steps": processing_steps,
                "total_processing_time_ms": int((time.time() - start_time) * 1000)
            }
    
    async def _enhance_with_python(self, image_path: str) -> str:
        """Python-based image enhancement using OpenCV and PIL"""
        try:
            # Load image
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                raise ValueError("Could not load image")
            
            # Convert to PIL for better processing
            if len(image.shape) == 3:
                if image.shape[2] == 4:  # RGBA
                    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA))
                else:  # RGB
                    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image)
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(1.2)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            # Enhance color saturation
            enhancer = ImageEnhance.Color(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            # Apply subtle unsharp mask
            pil_image = pil_image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
            
            # Save enhanced image
            enhanced_path = image_path.replace("_no_bg.png", "_enhanced.png")
            pil_image.save(enhanced_path, 'PNG', optimize=True)
            
            return enhanced_path
            
        except Exception as e:
            logger.warning(f"Python enhancement failed: {e}")
            return image_path
    
    async def _final_optimization(self, image_path: str) -> str:
        """Final optimization using OpenCV for print quality"""
        try:
            # Load image
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                raise ValueError("Could not load image")
            
            # Convert to float for better processing
            if image.dtype != np.float32:
                image = image.astype(np.float32) / 255.0
            
            # Apply bilateral filter for noise reduction while preserving edges
            if len(image.shape) == 3:
                if image.shape[2] == 4:  # RGBA
                    # Process RGB channels separately
                    rgb = image[:, :, :3]
                    alpha = image[:, :, 3:4]
                    
                    # Apply bilateral filter to RGB
                    rgb_filtered = cv2.bilateralFilter(rgb, 9, 75, 75)
                    
                    # Reconstruct image
                    image = np.concatenate([rgb_filtered, alpha], axis=2)
                else:  # RGB
                    image = cv2.bilateralFilter(image, 9, 75, 75)
            
            # Convert back to uint8
            image = (image * 255).astype(np.uint8)
            
            # Generate final filename with timestamp
            import urllib.parse
            # Extract original URL from the upscaled path (it should contain the original URL info)
            # For now, we'll generate a clean final filename
            timestamp = int(time.time() * 1000)
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            # Remove the "_upscaled" suffix if present
            if base_name.endswith("_upscaled"):
                base_name = base_name[:-9]  # Remove "_upscaled"
            final_path = os.path.join(os.path.dirname(image_path), f"{base_name}_final_{timestamp}.png")
            cv2.imwrite(final_path, image)
            
            return final_path
            
        except Exception as e:
            logger.warning(f"Final optimization failed: {e}")
            return image_path

# Initialize optimized processor
optimized_processor = OptimizedLogoProcessor()

class LogoProcessRequest(BaseModel):
    """Request model for comprehensive logo processing"""
    image_url: HttpUrl = Field(..., description="URL of the logo to process")
    background_removal_method: str = Field(default="hybrid", description="Background removal method: 'ai', 'hybrid', or 'auto'")
    upscale_factor: int = Field(default=4, description="Upscaling factor (2, 4, or 8)")
    cleanup_options: dict = Field(default_factory=dict, description="Additional cleanup options")
    output_format: str = Field(default="png", description="Output format: 'png' or 'jpg'")

class LogoProcessResponse(BaseModel):
    """Response model for comprehensive logo processing"""
    success: bool
    original_url: HttpUrl
    processed_url: Optional[str] = None
    background_removed_url: Optional[str] = None
    upscaled_url: Optional[str] = None
    processing_steps: List[str] = Field(default_factory=list)
    total_processing_time_ms: int
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

@router.post("/process-logo/optimized")
async def process_logo_optimized(request: LogoProcessRequest):
    """
    Optimized logo processing: AI + Python tools for best quality
    
    Pipeline:
    1. AI background removal (rembg hybrid)
    2. Python enhancement (PIL + OpenCV)
    3. AI upscaling (Real-ESRGAN)
    4. Final Python optimization
    
    Args:
        request: Logo processing request
        
    Returns:
        LogoProcessResponse with processed logo
    """
    try:
        # Validate input parameters
        InputValidator.validate_image_url(str(request.image_url), "image_url")
        InputValidator.validate_output_format(request.output_format, "output_format")
        
        # Validate upscale factor
        if request.upscale_factor not in [2, 4, 8]:
            raise ValidationError("upscale_factor must be 2, 4, or 8", "upscale_factor")
        
        # Validate background removal method
        if request.background_removal_method not in ["ai", "hybrid", "auto"]:
            raise ValidationError("background_removal_method must be 'ai', 'hybrid', or 'auto'", "background_removal_method")
        
        result = await optimized_processor.process_logo_optimized(
            image_url=str(request.image_url),
            scale_factor=request.upscale_factor
        )
        
        if result["success"]:
            return LogoProcessResponse(
                success=True,
                original_url=request.image_url,
                processed_url=result["processed_path"],
                background_removed_url=result["background_removed_path"],
                upscaled_url=result["upscaled_path"],
                processing_steps=result["processing_steps"],
                total_processing_time_ms=result["total_processing_time_ms"],
                file_size_bytes=result["file_size_bytes"]
            )
        else:
            return LogoProcessResponse(
                success=False,
                original_url=request.image_url,
                processing_steps=result.get("processing_steps", []),
                total_processing_time_ms=result.get("total_processing_time_ms", 0),
                error=result["error"]
            )
            
    except ValidationError as e:
        logger.warning(f"Validation error in process_logo_optimized: {e.message}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "message": e.message,
                "field": e.field
            }
        )
    except Exception as e:
        logger.error(f"Optimized logo processing failed: {e}")
        return LogoProcessResponse(
            success=False,
            original_url=request.image_url,
            error=str(e)
        )

@router.post("/process-logo/quick")
async def process_logo_quick(request: LogoProcessRequest):
    """
    Quick logo processing: background removal + upscaling (no final cleanup)
    
    Args:
        request: Logo processing request
        
    Returns:
        LogoProcessResponse with processed logo
    """
    import time
    start_time = time.time()
    processing_steps = []
    
    try:
        # Step 1: AI Background Removal
        logger.info("Quick processing: Starting AI background removal...")
        processing_steps.append("background_removal")
        
        if request.background_removal_method == "ai":
            bg_result = await ai_remover.remove_background_ai(str(request.image_url))
        elif request.background_removal_method == "hybrid":
            bg_result = await ai_remover.remove_background_hybrid(str(request.image_url))
        else:  # auto
            bg_result = await ai_remover.remove_background_ai(str(request.image_url))
            if not bg_result["success"]:
                bg_result = await ai_remover.remove_background_hybrid(str(request.image_url))
        
        if not bg_result["success"]:
            return LogoProcessResponse(
                success=False,
                original_url=request.image_url,
                processing_steps=processing_steps,
                total_processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"Background removal failed: {bg_result['error']}"
            )
        
        background_removed_url = bg_result["processed_path"]
        processing_steps.append("background_removal_complete")
        
        # Step 2: Upscaling
        logger.info("Quick processing: Starting upscaling...")
        processing_steps.append("upscaling")
        
        upscale_result = await upscaler.upscale_image(
            image_url=background_removed_url,
            scale_factor=request.upscale_factor,
            output_format=request.output_format
        )
        
        if not upscale_result["success"]:
            return LogoProcessResponse(
                success=False,
                original_url=request.image_url,
                background_removed_url=background_removed_url,
                processing_steps=processing_steps,
                total_processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"Upscaling failed: {upscale_result['error']}"
            )
        
        upscaled_url = upscale_result["upscaled_path"]
        processing_steps.append("upscaling_complete")
        
        # Calculate total processing time
        total_time_ms = int((time.time() - start_time) * 1000)
        
        # Get final file size
        import os
        file_size = os.path.getsize(upscaled_url) if os.path.exists(upscaled_url) else 0
        
        return LogoProcessResponse(
            success=True,
            original_url=request.image_url,
            processed_url=upscaled_url,
            background_removed_url=background_removed_url,
            upscaled_url=upscaled_url,
            processing_steps=processing_steps,
            total_processing_time_ms=total_time_ms,
            file_size_bytes=file_size
        )
        
    except Exception as e:
        logger.error(f"Quick logo processing failed: {e}")
        return LogoProcessResponse(
            success=False,
            original_url=request.image_url,
            processing_steps=processing_steps,
            total_processing_time_ms=int((time.time() - start_time) * 1000),
            error=str(e)
        )
