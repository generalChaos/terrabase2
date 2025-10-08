"""
Asset Cleanup Service - Handles logo background removal and enhancement
"""

import os
import logging
from typing import Dict, Any
import asyncio
import time
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np

from src.services.ai_background_remover import AIBackgroundRemover
from src.services.preprocessor import ImagePreprocessor
from src.utils.filename_utils import generate_pipeline_filename
from src.storage.storage_service import StorageService
import logging

logger = logging.getLogger(__name__)

class AssetCleanupService:
    """Service for cleaning up logos and assets"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.ai_remover = AIBackgroundRemover()
        self.preprocessor = ImagePreprocessor()
        self.storage = StorageService()
        
        # Only create directories if not using Supabase
        storage_type = os.getenv("STORAGE_TYPE", "supabase")
        if storage_type != "supabase":
            try:
                os.makedirs(self.temp_dir, exist_ok=True)
                os.makedirs(self.output_dir, exist_ok=True)
            except OSError:
                # If we can't create directories, continue without them
                pass
    
    async def cleanup_logo(self, logo_url: str, 
                          output_format: str = "png", quality: int = 95) -> Dict[str, Any]:
        """
        Clean up a logo by removing background and enhancing quality
        
        Args:
            logo_url: URL of the logo to clean
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and cleaned logo URL
        """
        start_time = time.time()
        
        try:
            # logger.info("Starting logo cleanup", logo_url=logo_url)
            
            # Step 1: AI Background Removal
            # logger.info("Step 1: AI background removal")
            print(f"DEBUG: Starting AI background removal for {logo_url}")
            bg_result = await self.ai_remover.remove_background_hybrid(logo_url)
            print(f"DEBUG: Background removal result: {bg_result}")
            if not bg_result["success"]:
                return {
                    "success": False,
                    "error": f"Background removal failed: {bg_result['error']}"
                }
            
            print(f"DEBUG: Accessing output_url from bg_result")
            bg_removed_path = bg_result["output_url"]
            print(f"DEBUG: Got bg_removed_path: {bg_removed_path}")
            
            # Step 2: Python-based Enhancement
            # logger.info("Step 2: Python enhancement")
            enhanced_path = await self._enhance_with_python(bg_removed_path)
            
            # Step 3: Generate final filename and save to storage
            # logger.info("Step 3: Final processing")
            final_filename = generate_pipeline_filename(
                logo_url, ["clean-logo"], output_format
            )
            
            # Convert to final format and quality
            with Image.open(enhanced_path) as img:
                # Convert to bytes
                import io
                img_bytes = io.BytesIO()
                if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                    # Convert RGBA to RGB for JPEG
                    if img.mode == "RGBA":
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[-1])
                        img = background
                    img.save(img_bytes, "JPEG", quality=quality, optimize=True)
                    content_type = "image/jpeg"
                else:
                    # For PNG, preserve transparency
                    if output_format.lower() == "png" and img.mode == "RGBA":
                        img.save(img_bytes, "PNG", optimize=True)
                    else:
                        img.save(img_bytes, output_format.upper(), quality=quality, optimize=True)
                    content_type = f"image/{output_format.lower()}"
                
                img_bytes.seek(0)
                
            # Upload to Supabase storage
            storage_file = await self.storage.upload_file(
                file_data=img_bytes.getvalue(),
                file_name=final_filename,
                bucket="team-logos",
                content_type=content_type
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "output_url": storage_file.public_url,
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": storage_file.file_size
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            # logger.error("Logo cleanup failed",
            #             error_message=str(e),
            #             processing_time_ms=processing_time_ms)
            
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }
    
    async def _enhance_with_python(self, image_path: str) -> str:
        """
        Enhance image using Python-based processing
        
        Args:
            image_path: Path to the image to enhance
            
        Returns:
            Path to the enhanced image
        """
        try:
            # Load image
            img = Image.open(image_path)
            
            # Convert to RGBA if needed to preserve transparency
            if img.mode not in ["RGB", "RGBA"]:
                img = img.convert("RGBA")
            elif img.mode == "RGB":
                # Convert RGB to RGBA to preserve any existing alpha
                img = img.convert("RGBA")
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.1)
            
            # Enhance color saturation
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.1)
            
            # Apply slight noise reduction
            img = img.filter(ImageFilter.MedianFilter(size=3))
            
            # Save enhanced image
            enhanced_path = image_path.replace(".png", "_enhanced.png")
            img.save(enhanced_path, "PNG", optimize=True)
            
            return enhanced_path
            
        except Exception as e:
            # logger.error("Python enhancement failed", error_message=str(e))
            # Return original if enhancement fails
            return image_path
