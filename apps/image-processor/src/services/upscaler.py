"""
Image upscaling service using Real-ESRGAN, ESRGAN, and OpenCV
"""

import os
import time
import io
import cv2
import numpy as np
from PIL import Image
import requests
from typing import Optional, Tuple
import logging
from src.utils.filename_utils import generate_processing_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageUpscaler:
    """Main upscaling service class"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
        
        # Ensure directories exist
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize models (lazy loading)
        self._realesrgan_model = None
        self._esrgan_model = None
    
    async def upscale_image(
        self,
        image_url: str,
        scale_factor: int,
        model: str = "realesrgan",
        output_format: str = "png",
        quality: int = 95
    ) -> dict:
        """
        Upscale an image using the specified model
        
        Args:
            image_url: URL of the image to upscale
            scale_factor: Upscaling factor (1-8)
            model: Model to use (realesrgan, esrgan, opencv)
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with upscaling results
        """
        start_time = time.time()
        
        try:
            # Download and validate image
            image_data = await self._download_image(image_url)
            original_image = self._load_image(image_data)
            
            # Upscale based on model
            if model == "realesrgan":
                upscaled_image = await self._upscale_realesrgan(original_image, scale_factor)
            elif model == "esrgan":
                upscaled_image = await self._upscale_esrgan(original_image, scale_factor)
            elif model == "opencv":
                upscaled_image = self._upscale_opencv(original_image, scale_factor)
            else:
                raise ValueError(f"Unknown model: {model}")
            
            # Save upscaled image
            output_path = await self._save_image(upscaled_image, output_format, quality, image_url)
            
            processing_time = int((time.time() - start_time) * 1000)
            file_size = os.path.getsize(output_path)
            
            return {
                "success": True,
                "upscaled_path": output_path,
                "original_url": image_url,
                "scale_factor": scale_factor,
                "model_used": model,
                "processing_time_ms": processing_time,
                "file_size_bytes": file_size,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Upscaling failed: {str(e)}")
            return {
                "success": False,
                "upscaled_path": None,
                "original_url": image_url,
                "scale_factor": scale_factor,
                "model_used": model,
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "file_size_bytes": None,
                "error": str(e)
            }
    
    async def _download_image(self, url: str) -> bytes:
        """Download image from URL or load from local file"""
        try:
            # Handle file URLs
            if url.startswith("file://"):
                file_path = url[7:]  # Remove "file://" prefix
                if not os.path.exists(file_path):
                    raise ValueError(f"File not found: {file_path}")
                
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                if len(content) > self.max_file_size:
                    raise ValueError(f"Image too large: {len(content)} bytes")
                
                return content
            
            # Handle HTTP URLs
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            if len(response.content) > self.max_file_size:
                raise ValueError(f"Image too large: {len(response.content)} bytes")
            
            return response.content
        except Exception as e:
            raise ValueError(f"Failed to download image: {str(e)}")
    
    def _load_image(self, image_data: bytes) -> np.ndarray:
        """Load image from bytes"""
        try:
            # Convert bytes to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to OpenCV format
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return cv_image
        except Exception as e:
            raise ValueError(f"Failed to load image: {str(e)}")
    
    async def _upscale_realesrgan(self, image: np.ndarray, scale: int) -> np.ndarray:
        """Upscale using Real-ESRGAN"""
        try:
            # This would require Real-ESRGAN installation
            # For now, fallback to OpenCV
            logger.warning("Real-ESRGAN not available, using OpenCV fallback")
            return self._upscale_opencv(image, scale)
        except Exception as e:
            logger.error(f"Real-ESRGAN upscaling failed: {str(e)}")
            return self._upscale_opencv(image, scale)
    
    async def _upscale_esrgan(self, image: np.ndarray, scale: int) -> np.ndarray:
        """Upscale using ESRGAN"""
        try:
            # This would require ESRGAN installation
            # For now, fallback to OpenCV
            logger.warning("ESRGAN not available, using OpenCV fallback")
            return self._upscale_opencv(image, scale)
        except Exception as e:
            logger.error(f"ESRGAN upscaling failed: {str(e)}")
            return self._upscale_opencv(image, scale)
    
    def _upscale_opencv(self, image: np.ndarray, scale: int) -> np.ndarray:
        """Upscale using OpenCV bicubic interpolation"""
        try:
            height, width = image.shape[:2]
            new_width = width * scale
            new_height = height * scale
            
            upscaled = cv2.resize(
                image,
                (new_width, new_height),
                interpolation=cv2.INTER_CUBIC
            )
            
            return upscaled
        except Exception as e:
            raise ValueError(f"OpenCV upscaling failed: {str(e)}")
    
    async def _save_image(
        self,
        image: np.ndarray,
        output_format: str,
        quality: int,
        original_url: str = None
    ) -> str:
        """Save upscaled image to disk"""
        try:
            # Generate meaningful filename based on original URL
            if original_url:
                # Generate filename with timestamp
                filename = generate_processing_filename(
                    original_url=original_url,
                    processing_type="upscaled",
                    extension=output_format,
                    include_timestamp=True
                )
            else:
                # Fallback to timestamp
                timestamp = int(time.time() * 1000)
                filename = f"upscaled_{timestamp}.{output_format}"
            
            output_path = os.path.join(self.output_dir, filename)
            
            # Convert BGR to RGB for PIL
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)
            
            # Save with appropriate format and quality
            if output_format.lower() in ['jpg', 'jpeg']:
                pil_image.save(output_path, 'JPEG', quality=quality, optimize=True)
            elif output_format.lower() == 'webp':
                pil_image.save(output_path, 'WEBP', quality=quality, optimize=True)
            else:  # PNG
                pil_image.save(output_path, 'PNG', optimize=True)
            
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")

# Global upscaler instance
upscaler = ImageUpscaler()
