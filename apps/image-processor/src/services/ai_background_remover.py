"""
AI-powered background removal service using rembg
"""
import os
import logging
import asyncio
from typing import Optional, Tuple
import numpy as np
import cv2
from PIL import Image
import requests
from io import BytesIO
from src.utils.filename_utils import generate_processing_filename

logger = logging.getLogger(__name__)

class AIBackgroundRemover:
    """AI-powered background removal using rembg library"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        
        # Ensure directories exist
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize rembg models (lazy loading)
        self._rembg_session = None
        
    def _get_rembg_session(self):
        """Lazy load rembg session"""
        if self._rembg_session is None:
            try:
                from rembg import new_session, remove
                # Use the most accurate model for logos
                self._rembg_session = new_session('u2net')  # Best for general objects
                self._remove_func = remove
                logger.info("AI background removal model loaded successfully")
            except ImportError:
                logger.error("rembg not installed. Install with: pip install rembg")
                raise ImportError("rembg library not available")
        return self._rembg_session, self._remove_func
    
    async def remove_background_ai(self, image_url: str) -> dict:
        """
        Remove background using AI-powered rembg
        
        Args:
            image_url: URL of the image to process
            
        Returns:
            dict: Result with success status and processed image path
        """
        try:
            # Handle file URLs vs HTTP URLs
            from urllib.parse import urlparse
            parsed_url = urlparse(image_url)
            
            if parsed_url.scheme == 'file':
                # For file URLs, open directly
                file_path = parsed_url.path
                image = Image.open(file_path)
            else:
                # For HTTP URLs, download first
                response = requests.get(image_url, timeout=30)
                response.raise_for_status()
                
                # Load image
                image_data = BytesIO(response.content)
                image = Image.open(image_data)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get rembg session
            session, remove_func = self._get_rembg_session()
            
            # Remove background using AI
            logger.info("Starting AI background removal...")
            result_image = remove_func(image, session=session)
            
            # Save result
            output_path = await self._save_transparent_image(result_image, image_url)
            
            # Get file size
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            return {
                "success": True,
                "output_url": output_path,
                "file_size_bytes": file_size,
                "method": "ai_rembg"
            }
            
        except Exception as e:
            logger.error(f"AI background removal failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "method": "ai_rembg"
            }
    
    async def _save_transparent_image(self, image: Image.Image, original_url: str) -> str:
        """Save transparent image with proper naming"""
        try:
            # Generate filename based on original URL
            if original_url:
                # Generate filename with timestamp
                filename = generate_processing_filename(
                    original_url=original_url,
                    processing_type="no_bg",
                    extension="png",
                    include_timestamp=True
                )
            else:
                import time
                timestamp = int(time.time() * 1000)
                filename = f"no_bg_{timestamp}.png"
            
            output_path = os.path.join(self.output_dir, filename)
            
            # Save as PNG with transparency
            image.save(output_path, 'PNG', optimize=True)
            
            return output_path
            
        except Exception as e:
            raise ValueError(f"Failed to save transparent image: {str(e)}")
    
    async def remove_background_hybrid(self, image_url: str) -> dict:
        """
        Hybrid approach: AI removal + manual cleanup
        
        Args:
            image_url: URL of the image to process
            
        Returns:
            dict: Result with success status and processed image path
        """
        try:
            # First, try AI removal
            ai_result = await self.remove_background_ai(image_url)
            
            if not ai_result["success"]:
                return ai_result
            
            # Load the AI result
            ai_image = Image.open(ai_result["output_url"])
            
            # Apply additional cleanup
            cleaned_image = self._cleanup_ai_result(ai_image)
            
            # Save cleaned result
            output_path = await self._save_transparent_image(cleaned_image, image_url)
            file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
            
            return {
                "success": True,
                "output_url": output_path,
                "file_size_bytes": file_size,
                "method": "hybrid_ai_manual"
            }
            
        except Exception as e:
            logger.error(f"Hybrid background removal failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "method": "hybrid_ai_manual"
            }
    
    def _cleanup_ai_result(self, image: Image.Image) -> Image.Image:
        """Clean up AI result with additional processing"""
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # If image has alpha channel, work with it
            if img_array.shape[2] == 4:
                alpha = img_array[:, :, 3]
                
                # Remove very transparent pixels (likely artifacts)
                alpha[alpha < 30] = 0
                
                # Smooth alpha channel
                alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
                
                # Apply morphological operations to clean up
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
                alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
                alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel)
                
                img_array[:, :, 3] = alpha
            
            return Image.fromarray(img_array)
            
        except Exception as e:
            logger.warning(f"AI result cleanup failed: {e}")
            return image
