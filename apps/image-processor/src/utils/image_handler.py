"""
Unified Image Handler
Centralizes all image loading, downloading, and processing logic
"""

import os
import time
import requests
from PIL import Image
from typing import Union, Optional
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class ImageHandler:
    """Unified handler for all image operations"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        # Only create directories if not using Supabase
        storage_type = os.getenv("STORAGE_TYPE", "supabase")
        if storage_type != "supabase":
            try:
                os.makedirs(self.temp_dir, exist_ok=True)
            except OSError:
                # If we can't create directories, continue without them
                pass
    
    async def load_image(self, image_url: str) -> Image.Image:
        """
        Load image from any URL type (file://, http://, local path)
        
        Args:
            image_url: URL or path to image
            
        Returns:
            PIL Image object
        """
        try:
            if image_url.startswith("file://"):
                # File URL
                file_path = image_url.replace("file://", "")
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"File not found: {file_path}")
                return Image.open(file_path)
            
            elif image_url.startswith(("http://", "https://")):
                # HTTP URL
                response = requests.get(image_url, timeout=30)
                response.raise_for_status()
                return Image.open(BytesIO(response.content))
            
            else:
                # Local file path
                if not os.path.exists(image_url):
                    raise FileNotFoundError(f"File not found: {image_url}")
                return Image.open(image_url)
                
        except Exception as e:
            logger.error(f"Failed to load image {image_url}: {e}")
            raise Exception(f"Failed to load image: {str(e)}")
    
    def remove_background_simple(self, image: Image.Image) -> Image.Image:
        """
        Simple background removal for white/light backgrounds
        
        Args:
            image: PIL Image object
            
        Returns:
            Image with transparent background
        """
        try:
            # Convert to RGBA if not already
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # Get image data
            data = image.getdata()
            new_data = []
            
            for item in data:
                # If pixel is white or very light, make it transparent
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))  # Transparent
                else:
                    new_data.append(item)
            
            # Create new image with transparent background
            image.putdata(new_data)
            return image
            
        except Exception as e:
            logger.warning(f"Background removal failed: {e}")
            return image  # Return original if removal fails
    
    async def save_temp_image(self, image: Image.Image, prefix: str = "temp") -> str:
        """
        Save image to temp directory and return file path
        
        Args:
            image: PIL Image object
            prefix: Filename prefix
            
        Returns:
            Local file path
        """
        filename = f"{prefix}_{int(time.time())}.png"
        temp_path = os.path.join(self.temp_dir, filename)
        image.save(temp_path, "PNG")
        return temp_path

# Global instance
image_handler = ImageHandler()
