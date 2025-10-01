"""
Non-AI processor for cost comparison
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
import time
import requests
from io import BytesIO

logger = logging.getLogger(__name__)

router = APIRouter()

class NoAIProcessor:
    """Processor using only traditional computer vision (no AI)"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def process_logo_no_ai(self, image_url: str, scale_factor: int = 4) -> dict:
        """
        Process logo using only traditional CV (no AI)
        
        Pipeline:
        1. Traditional background removal (OpenCV)
        2. Python enhancement (PIL + OpenCV)
        3. Traditional upscaling (OpenCV)
        4. Final optimization (OpenCV)
        """
        start_time = time.time()
        processing_steps = []
        
        try:
            # Step 1: Traditional background removal
            logger.info("Step 1: Traditional background removal...")
            processing_steps.append("traditional_background_removal")
            
            bg_removed_path = await self._traditional_background_removal(image_url)
            processing_steps.append("traditional_background_removal_complete")
            
            # Step 2: Python enhancement
            logger.info("Step 2: Python enhancement...")
            processing_steps.append("python_enhancement")
            
            enhanced_path = await self._enhance_image(bg_removed_path)
            processing_steps.append("python_enhancement_complete")
            
            # Step 3: Traditional upscaling
            logger.info("Step 3: Traditional upscaling...")
            processing_steps.append("traditional_upscaling")
            
            upscaled_path = await self._upscale_image(enhanced_path, scale_factor)
            processing_steps.append("traditional_upscaling_complete")
            
            # Step 4: Final optimization
            logger.info("Step 4: Final optimization...")
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
                "file_size_bytes": file_size,
                "ai_used": False
            }
            
        except Exception as e:
            logger.error(f"No-AI processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_steps": processing_steps,
                "total_processing_time_ms": int((time.time() - start_time) * 1000),
                "ai_used": False
            }
    
    async def _traditional_background_removal(self, image_url: str) -> str:
        """Traditional background removal using OpenCV"""
        try:
            # Download image
            response = requests.get(image_url, timeout=30)
            image_data = BytesIO(response.content)
            image = Image.open(image_data)
            
            # Convert to OpenCV
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Create mask using multiple thresholds
            _, mask1 = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY)
            _, mask2 = cv2.threshold(blurred, 220, 255, cv2.THRESH_BINARY)
            _, mask3 = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)
            
            # Combine masks
            combined_mask = cv2.bitwise_or(mask1, cv2.bitwise_or(mask2, mask3))
            
            # Apply morphological operations
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
            cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel)
            
            # Invert mask
            mask_inv = cv2.bitwise_not(cleaned_mask)
            
            # Create RGBA image
            result = cv2.cvtColor(cv_image, cv2.COLOR_BGR2BGRA)
            result[:, :, 3] = mask_inv
            
            # Save
            bg_removed_path = os.path.join(self.output_dir, "no_ai_bg_removed.png")
            cv2.imwrite(bg_removed_path, result)
            
            return bg_removed_path
            
        except Exception as e:
            raise ValueError(f"Traditional background removal failed: {str(e)}")
    
    async def _enhance_image(self, image_path: str) -> str:
        """Enhance image using PIL"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                return image_path
            
            # Convert to PIL
            if len(image.shape) == 3:
                if image.shape[2] == 4:
                    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA))
                else:
                    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image)
            
            # Enhance
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(1.2)
            
            enhancer = ImageEnhance.Sharpness(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            enhancer = ImageEnhance.Color(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            # Apply unsharp mask
            pil_image = pil_image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
            
            # Save
            enhanced_path = image_path.replace("_bg_removed.png", "_enhanced.png")
            pil_image.save(enhanced_path, 'PNG', optimize=True)
            
            return enhanced_path
            
        except Exception as e:
            logger.warning(f"Enhancement failed: {e}")
            return image_path
    
    async def _upscale_image(self, image_path: str, scale_factor: int) -> str:
        """Upscale image using OpenCV"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                raise ValueError("Could not load image")
            
            # Get dimensions
            height, width = image.shape[:2]
            new_height, new_width = height * scale_factor, width * scale_factor
            
            # Upscale using INTER_CUBIC (good quality)
            upscaled = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            # Save
            upscaled_path = image_path.replace("_enhanced.png", "_upscaled.png")
            cv2.imwrite(upscaled_path, upscaled)
            
            return upscaled_path
            
        except Exception as e:
            raise ValueError(f"Upscaling failed: {str(e)}")
    
    async def _final_optimization(self, image_path: str) -> str:
        """Final optimization using OpenCV"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                return image_path
            
            # Convert to float
            if image.dtype != np.float32:
                image = image.astype(np.float32) / 255.0
            
            # Apply bilateral filter
            if len(image.shape) == 3:
                if image.shape[2] == 4:
                    rgb = image[:, :, :3]
                    alpha = image[:, :, 3:4]
                    rgb_filtered = cv2.bilateralFilter(rgb, 9, 75, 75)
                    image = np.concatenate([rgb_filtered, alpha], axis=2)
                else:
                    image = cv2.bilateralFilter(image, 9, 75, 75)
            
            # Convert back to uint8
            image = (image * 255).astype(np.uint8)
            
            # Save
            final_path = image_path.replace("_upscaled.png", "_final.png")
            cv2.imwrite(final_path, image)
            
            return final_path
            
        except Exception as e:
            logger.warning(f"Final optimization failed: {e}")
            return image_path

# Initialize processor
no_ai_processor = NoAIProcessor()

class NoAIRequest(BaseModel):
    """Request model for no-AI processing"""
    image_url: HttpUrl = Field(..., description="URL of the logo to process")
    scale_factor: int = Field(default=4, description="Upscaling factor")

class NoAIResponse(BaseModel):
    """Response model for no-AI processing"""
    success: bool
    original_url: HttpUrl
    processed_url: Optional[str] = None
    background_removed_url: Optional[str] = None
    enhanced_url: Optional[str] = None
    upscaled_url: Optional[str] = None
    processing_steps: List[str] = Field(default_factory=list)
    total_processing_time_ms: int
    file_size_bytes: Optional[int] = None
    ai_used: bool = False
    error: Optional[str] = None

@router.post("/process-logo/no-ai")
async def process_logo_no_ai(request: NoAIRequest):
    """
    Process logo without AI (traditional computer vision only)
    
    Pipeline:
    1. Traditional background removal (OpenCV)
    2. Python enhancement (PIL + OpenCV)
    3. Traditional upscaling (OpenCV)
    4. Final optimization (OpenCV)
    
    Args:
        request: No-AI processing request
        
    Returns:
        NoAIResponse with processed logo
    """
    try:
        result = await no_ai_processor.process_logo_no_ai(
            image_url=str(request.image_url),
            scale_factor=request.scale_factor
        )
        
        if result["success"]:
            return NoAIResponse(
                success=True,
                original_url=request.image_url,
                processed_url=result["processed_path"],
                background_removed_url=result["background_removed_path"],
                enhanced_url=result["enhanced_path"],
                upscaled_url=result["upscaled_path"],
                processing_steps=result["processing_steps"],
                total_processing_time_ms=result["total_processing_time_ms"],
                file_size_bytes=result["file_size_bytes"],
                ai_used=False
            )
        else:
            return NoAIResponse(
                success=False,
                original_url=request.image_url,
                processing_steps=result.get("processing_steps", []),
                total_processing_time_ms=result.get("total_processing_time_ms", 0),
                ai_used=False,
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"No-AI processing failed: {e}")
        return NoAIResponse(
            success=False,
            original_url=request.image_url,
            ai_used=False,
            error=str(e)
        )
