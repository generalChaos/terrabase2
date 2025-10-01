"""
Cost-optimized logo processor for production use
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

from services.ai_background_remover import AIBackgroundRemover
from services.upscaler import ImageUpscaler

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
ai_remover = AIBackgroundRemover()
upscaler = ImageUpscaler()

class CostOptimizedProcessor:
    """Cost-optimized processor with different quality tiers"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def process_logo_tier(self, image_url: str, tier: str = "standard") -> dict:
        """
        Process logo with different cost/quality tiers
        
        Tiers:
        - budget: Fast, basic quality (~10-15s)
        - standard: Balanced quality/speed (~30-40s) 
        - premium: Best quality (~50-60s)
        - enterprise: Maximum quality (~90-120s)
        """
        start_time = time.time()
        processing_steps = []
        
        try:
            if tier == "budget":
                return await self._process_budget_tier(image_url, start_time)
            elif tier == "standard":
                return await self._process_standard_tier(image_url, start_time)
            elif tier == "premium":
                return await self._process_premium_tier(image_url, start_time)
            elif tier == "enterprise":
                return await self._process_enterprise_tier(image_url, start_time)
            else:
                raise ValueError(f"Invalid tier: {tier}")
                
        except Exception as e:
            logger.error(f"Cost-optimized processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_steps": processing_steps,
                "total_processing_time_ms": int((time.time() - start_time) * 1000)
            }
    
    async def _process_budget_tier(self, image_url: str, start_time: float) -> dict:
        """Budget tier: Fast processing, basic quality"""
        processing_steps = []
        
        # Step 1: Simple background removal (OpenCV only)
        logger.info("Budget tier: Simple background removal...")
        processing_steps.append("simple_background_removal")
        
        # Download and process with OpenCV
        import requests
        response = requests.get(image_url, timeout=30)
        image_data = response.content
        
        # Load image
        image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_UNCHANGED)
        
        # Simple background removal
        if len(image.shape) == 3:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Create mask
            _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
            mask_inv = cv2.bitwise_not(mask)
            
            # Create RGBA
            result = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
            result[:, :, 3] = mask_inv
            
            # Save
            bg_removed_path = os.path.join(self.output_dir, "budget_bg_removed.png")
            cv2.imwrite(bg_removed_path, result)
        else:
            bg_removed_path = os.path.join(self.output_dir, "budget_input.png")
            cv2.imwrite(bg_removed_path, image)
        
        processing_steps.append("simple_background_removal_complete")
        
        # Step 2: Basic upscaling (OpenCV only)
        logger.info("Budget tier: Basic upscaling...")
        processing_steps.append("basic_upscaling")
        
        # Load and upscale
        img = cv2.imread(bg_removed_path, cv2.IMREAD_UNCHANGED)
        height, width = img.shape[:2]
        new_height, new_width = height * 2, width * 2  # 2x upscaling for budget
        
        upscaled = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Save
        upscaled_path = os.path.join(self.output_dir, "budget_upscaled.png")
        cv2.imwrite(upscaled_path, upscaled)
        
        processing_steps.append("basic_upscaling_complete")
        
        # Calculate metrics
        total_time_ms = int((time.time() - start_time) * 1000)
        file_size = os.path.getsize(upscaled_path) if os.path.exists(upscaled_path) else 0
        
        return {
            "success": True,
            "processed_path": upscaled_path,
            "background_removed_path": bg_removed_path,
            "processing_steps": processing_steps,
            "total_processing_time_ms": total_time_ms,
            "file_size_bytes": file_size,
            "tier": "budget",
            "estimated_cost_usd": 0.01  # ~$0.01
        }
    
    async def _process_standard_tier(self, image_url: str, start_time: float) -> dict:
        """Standard tier: Balanced quality/speed"""
        processing_steps = []
        
        # Step 1: AI background removal (faster model)
        logger.info("Standard tier: AI background removal...")
        processing_steps.append("ai_background_removal")
        
        bg_result = await ai_remover.remove_background_ai(str(image_url))
        if not bg_result["success"]:
            return {"success": False, "error": f"Background removal failed: {bg_result['error']}"}
        
        bg_removed_path = bg_result["processed_path"]
        processing_steps.append("ai_background_removal_complete")
        
        # Step 2: Basic enhancement
        logger.info("Standard tier: Basic enhancement...")
        processing_steps.append("basic_enhancement")
        
        enhanced_path = await self._basic_enhancement(bg_removed_path)
        processing_steps.append("basic_enhancement_complete")
        
        # Step 3: 2x upscaling
        logger.info("Standard tier: 2x upscaling...")
        processing_steps.append("upscaling_2x")
        
        file_url = f"file://{os.path.abspath(enhanced_path)}"
        upscale_result = await upscaler.upscale_image(
            image_url=file_url,
            scale_factor=2,
            output_format="png"
        )
        
        if not upscale_result["success"]:
            return {"success": False, "error": f"Upscaling failed: {upscale_result['error']}"}
        
        upscaled_path = upscale_result["upscaled_path"]
        processing_steps.append("upscaling_2x_complete")
        
        # Calculate metrics
        total_time_ms = int((time.time() - start_time) * 1000)
        file_size = os.path.getsize(upscaled_path) if os.path.exists(upscaled_path) else 0
        
        return {
            "success": True,
            "processed_path": upscaled_path,
            "background_removed_path": bg_removed_path,
            "enhanced_path": enhanced_path,
            "processing_steps": processing_steps,
            "total_processing_time_ms": total_time_ms,
            "file_size_bytes": file_size,
            "tier": "standard",
            "estimated_cost_usd": 0.05  # ~$0.05
        }
    
    async def _process_premium_tier(self, image_url: str, start_time: float) -> dict:
        """Premium tier: High quality (current optimized processor)"""
        processing_steps = []
        
        # Use the existing optimized processor
        from api.logo_processor import OptimizedLogoProcessor
        processor = OptimizedLogoProcessor()
        
        result = await processor.process_logo_optimized(str(image_url), scale_factor=4)
        
        if result["success"]:
            result["tier"] = "premium"
            result["estimated_cost_usd"] = 0.15  # ~$0.15
            return result
        else:
            return result
    
    async def _process_enterprise_tier(self, image_url: str, start_time: float) -> dict:
        """Enterprise tier: Maximum quality with multiple passes"""
        processing_steps = []
        
        # Step 1: AI background removal (hybrid)
        logger.info("Enterprise tier: Hybrid AI background removal...")
        processing_steps.append("hybrid_ai_background_removal")
        
        bg_result = await ai_remover.remove_background_hybrid(str(image_url))
        if not bg_result["success"]:
            return {"success": False, "error": f"Background removal failed: {bg_result['error']}"}
        
        bg_removed_path = bg_result["processed_path"]
        processing_steps.append("hybrid_ai_background_removal_complete")
        
        # Step 2: Advanced enhancement (multiple passes)
        logger.info("Enterprise tier: Advanced enhancement...")
        processing_steps.append("advanced_enhancement")
        
        enhanced_path = await self._advanced_enhancement(bg_removed_path)
        processing_steps.append("advanced_enhancement_complete")
        
        # Step 3: 4x upscaling
        logger.info("Enterprise tier: 4x upscaling...")
        processing_steps.append("upscaling_4x")
        
        file_url = f"file://{os.path.abspath(enhanced_path)}"
        upscale_result = await upscaler.upscale_image(
            image_url=file_url,
            scale_factor=4,
            output_format="png"
        )
        
        if not upscale_result["success"]:
            return {"success": False, "error": f"Upscaling failed: {upscale_result['error']}"}
        
        upscaled_path = upscale_result["upscaled_path"]
        processing_steps.append("upscaling_4x_complete")
        
        # Step 4: Final optimization (multiple passes)
        logger.info("Enterprise tier: Final optimization...")
        processing_steps.append("final_optimization")
        
        final_path = await self._enterprise_optimization(upscaled_path)
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
            "tier": "enterprise",
            "estimated_cost_usd": 0.30  # ~$0.30
        }
    
    async def _basic_enhancement(self, image_path: str) -> str:
        """Basic enhancement for standard tier"""
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
            
            # Basic enhancement
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            # Save
            enhanced_path = image_path.replace("_no_bg.png", "_enhanced.png")
            pil_image.save(enhanced_path, 'PNG', optimize=True)
            
            return enhanced_path
            
        except Exception as e:
            logger.warning(f"Basic enhancement failed: {e}")
            return image_path
    
    async def _advanced_enhancement(self, image_path: str) -> str:
        """Advanced enhancement for enterprise tier"""
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
            
            # Advanced enhancement
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(1.2)
            
            enhancer = ImageEnhance.Sharpness(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            enhancer = ImageEnhance.Color(pil_image)
            pil_image = enhancer.enhance(1.1)
            
            # Apply unsharp mask
            pil_image = pil_image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
            
            # Save
            enhanced_path = image_path.replace("_no_bg.png", "_enhanced.png")
            pil_image.save(enhanced_path, 'PNG', optimize=True)
            
            return enhanced_path
            
        except Exception as e:
            logger.warning(f"Advanced enhancement failed: {e}")
            return image_path
    
    async def _enterprise_optimization(self, image_path: str) -> str:
        """Enterprise optimization with multiple passes"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            if image is None:
                return image_path
            
            # Convert to float
            if image.dtype != np.float32:
                image = image.astype(np.float32) / 255.0
            
            # Multiple optimization passes
            if len(image.shape) == 3:
                if image.shape[2] == 4:
                    rgb = image[:, :, :3]
                    alpha = image[:, :, 3:4]
                    
                    # Apply bilateral filter
                    rgb_filtered = cv2.bilateralFilter(rgb, 9, 75, 75)
                    
                    # Apply additional noise reduction
                    rgb_filtered = cv2.bilateralFilter(rgb_filtered, 5, 50, 50)
                    
                    image = np.concatenate([rgb_filtered, alpha], axis=2)
                else:
                    image = cv2.bilateralFilter(image, 9, 75, 75)
                    image = cv2.bilateralFilter(image, 5, 50, 50)
            
            # Convert back to uint8
            image = (image * 255).astype(np.uint8)
            
            # Save
            final_path = image_path.replace("_upscaled.png", "_enterprise_final.png")
            cv2.imwrite(final_path, image)
            
            return final_path
            
        except Exception as e:
            logger.warning(f"Enterprise optimization failed: {e}")
            return image_path

# Initialize processor
cost_processor = CostOptimizedProcessor()

class CostOptimizedRequest(BaseModel):
    """Request model for cost-optimized processing"""
    image_url: HttpUrl = Field(..., description="URL of the logo to process")
    tier: str = Field(default="standard", description="Processing tier: budget, standard, premium, enterprise")

class CostOptimizedResponse(BaseModel):
    """Response model for cost-optimized processing"""
    success: bool
    original_url: HttpUrl
    processed_url: Optional[str] = None
    background_removed_url: Optional[str] = None
    enhanced_url: Optional[str] = None
    upscaled_url: Optional[str] = None
    processing_steps: List[str] = Field(default_factory=list)
    total_processing_time_ms: int
    file_size_bytes: Optional[int] = None
    tier: str
    estimated_cost_usd: float
    error: Optional[str] = None

@router.post("/process-logo/cost-optimized")
async def process_logo_cost_optimized(request: CostOptimizedRequest):
    """
    Cost-optimized logo processing with different quality tiers
    
    Tiers:
    - budget: ~10-15s, basic quality, ~$0.01
    - standard: ~30-40s, good quality, ~$0.05  
    - premium: ~50-60s, high quality, ~$0.15
    - enterprise: ~90-120s, maximum quality, ~$0.30
    
    Args:
        request: Cost-optimized processing request
        
    Returns:
        CostOptimizedResponse with processed logo and cost info
    """
    try:
        result = await cost_processor.process_logo_tier(
            image_url=str(request.image_url),
            tier=request.tier
        )
        
        if result["success"]:
            return CostOptimizedResponse(
                success=True,
                original_url=request.image_url,
                processed_url=result["processed_path"],
                background_removed_url=result.get("background_removed_path"),
                enhanced_url=result.get("enhanced_path"),
                upscaled_url=result.get("upscaled_path"),
                processing_steps=result["processing_steps"],
                total_processing_time_ms=result["total_processing_time_ms"],
                file_size_bytes=result["file_size_bytes"],
                tier=result["tier"],
                estimated_cost_usd=result["estimated_cost_usd"]
            )
        else:
            return CostOptimizedResponse(
                success=False,
                original_url=request.image_url,
                processing_steps=result.get("processing_steps", []),
                total_processing_time_ms=result.get("total_processing_time_ms", 0),
                tier=request.tier,
                estimated_cost_usd=0.0,
                error=result["error"]
            )
            
    except Exception as e:
        logger.error(f"Cost-optimized processing failed: {e}")
        return CostOptimizedResponse(
            success=False,
            original_url=request.image_url,
            tier=request.tier,
            estimated_cost_usd=0.0,
            error=str(e)
        )
