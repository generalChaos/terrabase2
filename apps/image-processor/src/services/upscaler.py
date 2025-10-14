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

# Import Real-ESRGAN
try:
    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet
    REALESRGAN_AVAILABLE = True
except ImportError:
    REALESRGAN_AVAILABLE = False
    logger.warning("Real-ESRGAN not available, will use OpenCV fallback")

class ImageUpscaler:
    """Main upscaling service class"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
        
        # Model paths
        self.models_dir = os.getenv("MODELS_DIR", "./models")
        self.realesrgan_model_path = os.getenv("REALESRGAN_MODEL_PATH", os.path.join(self.models_dir, "RealESRGAN_x4plus.pth"))
        self.esrgan_model_path = os.getenv("ESRGAN_MODEL_PATH", os.path.join(self.models_dir, "RRDB_ESRGAN_x4.pth"))
        
        # Ensure directories exist
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize models (lazy loading)
        self._realesrgan_model = None
        self._esrgan_model = None
    
    def _init_realesrgan_model(self):
        """Initialize Real-ESRGAN model if available"""
        if not REALESRGAN_AVAILABLE:
            return False
            
        if self._realesrgan_model is not None:
            return True
            
        try:
            if not os.path.exists(self.realesrgan_model_path):
                logger.warning(f"Real-ESRGAN model not found at {self.realesrgan_model_path}")
                return False
            
            # Initialize Real-ESRGAN model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            self._realesrgan_model = RealESRGANer(
                scale=4,
                model_path=self.realesrgan_model_path,
                model=model,
                tile=0,
                tile_pad=10,
                pre_pad=0,
                half=False
            )
            logger.info("Real-ESRGAN model initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Real-ESRGAN model: {str(e)}")
            return False
    
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
            
            # Upscale based on model with fallback
            try:
                if model == "realesrgan":
                    upscaled_image = await self._upscale_realesrgan(original_image, scale_factor)
                elif model == "esrgan":
                    upscaled_image = await self._upscale_esrgan(original_image, scale_factor)
                elif model == "opencv":
                    upscaled_image = self._upscale_opencv(original_image, scale_factor)
                else:
                    raise ValueError(f"Unknown model: {model}")
            except Exception as e:
                logger.warning(f"Primary upscaling method {model} failed: {str(e)}, falling back to OpenCV")
                upscaled_image = self._upscale_opencv(original_image, scale_factor)
                model = "opencv"  # Update model used for reporting
            
            # Save upscaled image locally first
            output_path = await self._save_image(upscaled_image, output_format, quality, image_url)
            
            # Upload to Supabase storage
            from src.storage import storage
            with open(output_path, "rb") as f:
                file_data = f.read()
            
            # Generate filename for storage
            timestamp = int(time.time() * 1000)
            filename = f"upscaled_{timestamp}.{output_format}"
            
            # Log file size before upload
            file_size_mb = len(file_data) / (1024 * 1024)
            logger.info(f"Uploading upscaled file: {filename}, size: {file_size_mb:.2f}MB")
            
            # Upload to Supabase
            storage_file = await storage.upload_file(
                file_data=file_data,
                file_name=filename,
                bucket='team-logos',
                content_type=f'image/{output_format}'
            )
            
            # Clean up local file
            try:
                os.remove(output_path)
            except:
                pass
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "upscaled_path": storage_file.public_url,
                "original_url": image_url,
                "scale_factor": scale_factor,
                "model_used": model,
                "processing_time_ms": processing_time,
                "file_size_bytes": storage_file.file_size,
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
            # Handle data URLs
            if url.startswith("data:"):
                import base64
                # Extract the base64 data after the comma
                if ',' not in url:
                    raise ValueError("Invalid data URL format")
                
                header, data = url.split(',', 1)
                
                # Decode the base64 data
                try:
                    content = base64.b64decode(data)
                except Exception as e:
                    raise ValueError(f"Failed to decode base64 data: {str(e)}")
                
                if len(content) > self.max_file_size:
                    raise ValueError(f"Image too large: {len(content)} bytes")
                
                return content
            
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
            
            # Preserve transparency for PNG files, convert others to RGB
            if pil_image.mode == 'RGBA':
                # Keep RGBA for PNG files with transparency
                pass
            elif pil_image.mode in ['P', 'LA']:
                # Convert palette or grayscale with alpha to RGBA
                pil_image = pil_image.convert('RGBA')
            elif pil_image.mode != 'RGB':
                # Convert other modes to RGB
                pil_image = pil_image.convert('RGB')
            
            # Convert PIL to OpenCV format
            if pil_image.mode == 'RGBA':
                # Convert RGBA to BGRA for OpenCV
                cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGBA2BGRA)
            else:
                # Convert RGB to BGR for OpenCV
                cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return cv_image
        except Exception as e:
            raise ValueError(f"Failed to load image: {str(e)}")
    
    async def _upscale_realesrgan(self, image: np.ndarray, scale: int) -> np.ndarray:
        """Upscale using Real-ESRGAN"""
        try:
            # Initialize model if not already done
            if not self._init_realesrgan_model():
                logger.warning("Real-ESRGAN not available, using OpenCV fallback")
                return self._upscale_opencv(image, scale)
            
            # Real-ESRGAN works best with 4x scale, so we'll use it for 4x and above
            if scale >= 4:
                # Use Real-ESRGAN for 4x upscaling
                output, _ = self._realesrgan_model.enhance(image, outscale=4)
                
                # If we need a different scale, resize accordingly
                if scale != 4:
                    height, width = output.shape[:2]
                    new_width = int(width * scale / 4)
                    new_height = int(height * scale / 4)
                    output = cv2.resize(output, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                
                return output
            else:
                # For scales less than 4x, use OpenCV
                logger.info(f"Using OpenCV for {scale}x upscaling (Real-ESRGAN optimized for 4x+)")
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
            
            # Convert BGR to RGB for PIL, preserving alpha channel if present
            if len(image.shape) == 3 and image.shape[2] == 4:
                # Image has alpha channel (BGRA)
                bgra_image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA)
                pil_image = Image.fromarray(bgra_image, 'RGBA')
            elif len(image.shape) == 3 and image.shape[2] == 3:
                # Image has no alpha channel (BGR)
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_image, 'RGB')
            else:
                # Grayscale or other format
                pil_image = Image.fromarray(image)
            
            # Save with appropriate format and quality
            if output_format.lower() in ['jpg', 'jpeg']:
                # Convert to RGB if saving as JPEG (no alpha support)
                if pil_image.mode == 'RGBA':
                    # Create white background for transparency
                    background = Image.new('RGB', pil_image.size, (255, 255, 255))
                    background.paste(pil_image, mask=pil_image.split()[-1])  # Use alpha channel as mask
                    pil_image = background
                pil_image.save(output_path, 'JPEG', quality=quality, optimize=True)
            elif output_format.lower() == 'webp':
                pil_image.save(output_path, 'WEBP', quality=quality, optimize=True)
            else:  # PNG
                pil_image.save(output_path, 'PNG', optimize=True, compress_level=9)
            
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to save image: {str(e)}")

# Global upscaler instance
upscaler = ImageUpscaler()
