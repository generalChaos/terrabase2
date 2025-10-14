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
from io import BytesIO

from src.services.ai_background_remover import AIBackgroundRemover
from src.services.preprocessor import ImagePreprocessor
from src.utils.filename_utils import generate_pipeline_filename, generate_processing_filename
from src.storage import storage
import logging

logger = logging.getLogger(__name__)

class AssetCleanupService:
    """Service for cleaning up logos and assets"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.ai_remover = AIBackgroundRemover()
        self.preprocessor = ImagePreprocessor()
        self.storage = storage
        
        # Only create directories if not using Supabase
        storage_type = os.getenv("STORAGE_TYPE", "supabase")
        if storage_type != "supabase":
            try:
                os.makedirs(self.temp_dir, exist_ok=True)
                os.makedirs(self.output_dir, exist_ok=True)
            except OSError:
                # If we can't create directories, continue without them
                pass
    
    async def cleanup_logo_from_image(self, logo_image, 
                                     output_format: str = "png", quality: int = 95) -> Dict[str, Any]:
        """
        Clean up a logo from PIL Image by removing background and enhancing quality
        
        Args:
            logo_image: PIL Image object
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and cleaned logo URL
        """
        start_time = time.time()
        
        try:
            print(f"DEBUG: Starting logo cleanup from PIL Image")
            
            # Step 1: AI Background Removal
            print(f"DEBUG: Starting AI background removal for PIL Image")
            bg_result = await self.ai_remover.remove_background_from_image(logo_image)
            print(f"DEBUG: Background removal result: {bg_result}")
            if not bg_result["success"]:
                return {
                    "success": False,
                    "error": f"Background removal failed: {bg_result['error']}"
                }
            
            # Step 2: Image Enhancement
            print(f"DEBUG: Starting image enhancement")
            enhanced_path = await self._enhance_with_python(bg_result["output_url"])
            print(f"DEBUG: Enhanced image saved to: {enhanced_path}")
            
            # Step 3: Store cleaned logo
            print(f"DEBUG: Storing cleaned logo")
            # Read the enhanced image file and upload it
            with open(enhanced_path, "rb") as f:
                file_data = f.read()
            
            storage_file = await self.storage.upload_file(
                file_data=file_data,
                file_name=f"clean_logo_{int(time.time())}.{output_format}",
                bucket="team-logos",
                content_type=f"image/{output_format}"
            )
            print(f"DEBUG: Storage result: {storage_file}")
            
            processing_time = int((time.time() - start_time) * 1000)
            print(f"DEBUG: Logo cleanup completed in {processing_time}ms")
            
            return {
                "success": True,
                "output_url": storage_file.public_url,
                "processing_time_ms": processing_time,
                "file_size_bytes": storage_file.file_size
            }
            
        except Exception as e:
            logger.error(f"Logo cleanup failed: {e}")
            return {
                "success": False,
                "error": f"Logo cleanup failed: {str(e)}"
            }

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
            
            # Step 1: Skip background removal for AI-generated logos
            # AI-generated logos should already have transparent backgrounds
            print(f"DEBUG: Skipping background removal for AI-generated logo: {logo_url}")
            logo_image = await self._download_image(logo_url)
            
            # Save the original image as the "cleaned" version without any background removal
            bg_removed_path = await self._save_original_as_cleaned(logo_image, logo_url)
            
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

    def _has_transparent_background(self, image: Image.Image) -> bool:
        """Check if image already has transparent background"""
        try:
            # Check if image has alpha channel
            if image.mode not in ('RGBA', 'LA'):
                return False
            
            # Convert to RGBA if it's LA
            if image.mode == 'LA':
                image = image.convert('RGBA')
            
            # Get alpha channel
            alpha = image.split()[-1]
            
            # Check if there are any fully transparent pixels (alpha = 0)
            # This indicates the image has transparency
            transparent_pixels = sum(1 for pixel in alpha.getdata() if pixel == 0)
            total_pixels = alpha.size[0] * alpha.size[1]
            
            # If more than 5% of pixels are transparent, consider it to have transparent background
            transparency_ratio = transparent_pixels / total_pixels
            has_transparency = transparency_ratio > 0.05
            
            logger.info(f"Transparency check: {transparent_pixels}/{total_pixels} transparent pixels ({transparency_ratio:.2%})")
            return has_transparency
            
        except Exception as e:
            logger.warning(f"Transparency check failed: {str(e)}")
            return False

    async def _download_image(self, image_url: str) -> Image.Image:
        """Download image from URL"""
        try:
            import requests
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        except Exception as e:
            logger.error(f"Failed to download image: {e}")
            raise

    async def _save_original_as_cleaned(self, image: Image.Image, original_url: str) -> str:
        """Save original image as cleaned version when it already has transparency"""
        try:
            # Generate filename from original URL
            filename = generate_processing_filename(original_url, "clean", "png")
            output_path = os.path.join(self.output_dir, filename)
            
            # Save the image
            image.save(output_path, "PNG")
            logger.info(f"Saved original transparent image as cleaned: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Failed to save original as cleaned: {e}")
            raise
