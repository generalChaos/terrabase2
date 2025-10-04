"""
Image preprocessing service for print preparation
Handles cleaning, optimization, and print-ready formatting
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from typing import Optional, Dict, Any, Tuple
import logging
from src.utils.filename_utils import generate_processing_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Image preprocessing service for print preparation"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        
        # Ensure directories exist
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def preprocess_for_print(
        self,
        image_url: str,
        preprocessing_options: Dict[str, Any]
    ) -> dict:
        """
        Preprocess image for print preparation
        
        Args:
            image_url: URL of the image to preprocess
            preprocessing_options: Dictionary of preprocessing options
            
        Returns:
            Dictionary with preprocessing results
        """
        try:
            # Download and load image
            image_data = await self._download_image(image_url)
            original_image = self._load_image(image_data)
            
            # Apply preprocessing steps
            processed_image = original_image.copy()
            
            # 1. Noise reduction
            if preprocessing_options.get('denoise', True):
                processed_image = self._denoise_image(processed_image)
            
            # 2. Sharpening
            if preprocessing_options.get('sharpen', True):
                processed_image = self._sharpen_image(processed_image)
            
            # 3. Contrast enhancement
            if preprocessing_options.get('enhance_contrast', True):
                processed_image = self._enhance_contrast(processed_image)
            
            # 4. Color correction
            if preprocessing_options.get('color_correct', True):
                processed_image = self._color_correct(processed_image)
            
            # 5. Background removal (if requested)
            if preprocessing_options.get('remove_background', False):
                processed_image = self._remove_background(processed_image)
            
            # 6. Resize for print resolution
            if preprocessing_options.get('print_resolution', 300):
                processed_image = self._resize_for_print(
                    processed_image, 
                    preprocessing_options.get('print_resolution', 300)
                )
            
            # 7. Convert to print-safe color space
            if preprocessing_options.get('convert_to_cmyk', False):
                processed_image = self._convert_to_cmyk(processed_image)
            
            # Save processed image
            output_path = await self._save_processed_image(processed_image, image_url)
            
            return {
                "success": True,
                "output_url": output_path,
                "original_url": image_url,
                "preprocessing_applied": list(preprocessing_options.keys()),
                "file_size_bytes": os.path.getsize(output_path),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Preprocessing failed: {str(e)}")
            return {
                "success": False,
                "output_url": None,
                "original_url": image_url,
                "preprocessing_applied": [],
                "file_size_bytes": None,
                "error": str(e)
            }
    
    async def _download_image(self, url: str) -> bytes:
        """Download image from URL"""
        import requests
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            raise ValueError(f"Failed to download image: {str(e)}")
    
    def _load_image(self, image_data: bytes) -> np.ndarray:
        """Load image from bytes"""
        try:
            import io
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
    
    def _denoise_image(self, image: np.ndarray) -> np.ndarray:
        """Remove noise from image"""
        try:
            # Apply bilateral filter for noise reduction while preserving edges
            denoised = cv2.bilateralFilter(image, 9, 75, 75)
            return denoised
        except Exception as e:
            logger.warning(f"Denoising failed: {e}")
            return image
    
    def _sharpen_image(self, image: np.ndarray) -> np.ndarray:
        """Sharpen image for better print quality"""
        try:
            # Create sharpening kernel
            kernel = np.array([[-1,-1,-1],
                             [-1, 9,-1],
                             [-1,-1,-1]])
            
            # Apply sharpening
            sharpened = cv2.filter2D(image, -1, kernel)
            
            # Blend with original to avoid over-sharpening
            result = cv2.addWeighted(image, 0.7, sharpened, 0.3, 0)
            return result
        except Exception as e:
            logger.warning(f"Sharpening failed: {e}")
            return image
    
    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance contrast for better print visibility"""
        try:
            # Convert to LAB color space for better contrast enhancement
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            
            # Merge channels and convert back to BGR
            enhanced = cv2.merge([l, a, b])
            result = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            
            return result
        except Exception as e:
            logger.warning(f"Contrast enhancement failed: {e}")
            return image
    
    def _color_correct(self, image: np.ndarray) -> np.ndarray:
        """Apply color correction for print accuracy"""
        try:
            # Convert to float for better color manipulation
            img_float = image.astype(np.float32) / 255.0
            
            # Apply gamma correction for better print appearance
            gamma = 1.2  # Slightly brighten for print
            corrected = np.power(img_float, 1.0/gamma)
            
            # Convert back to uint8
            result = (corrected * 255).astype(np.uint8)
            
            return result
        except Exception as e:
            logger.warning(f"Color correction failed: {e}")
            return image
    
    def _remove_background(self, image: np.ndarray) -> np.ndarray:
        """Remove background using traditional methods (fallback)"""
        try:
            # Convert to grayscale for background detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to smooth background
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Create mask for background areas using multiple thresholds
            # Try different thresholds to find the best background detection
            _, mask1 = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY)
            _, mask2 = cv2.threshold(blurred, 220, 255, cv2.THRESH_BINARY)
            _, mask3 = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)
            
            # Combine masks for better background detection
            combined_mask = cv2.bitwise_or(mask1, cv2.bitwise_or(mask2, mask3))
            
            # Apply morphological operations to clean up the mask
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
            cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel)
            
            # Invert mask to get foreground
            mask_inv = cv2.bitwise_not(cleaned_mask)
            
            # Create RGBA image with transparency
            result = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
            
            # Set alpha channel based on mask
            result[:, :, 3] = mask_inv  # Alpha channel
            
            # Clean up edges with feathering
            alpha = result[:, :, 3].astype(np.float32) / 255.0
            alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
            result[:, :, 3] = (alpha * 255).astype(np.uint8)
            
            return result
        except Exception as e:
            logger.warning(f"Traditional background removal failed: {e}")
            return image
    
    def _resize_for_print(self, image: np.ndarray, dpi: int = 300) -> np.ndarray:
        """Resize image for print resolution"""
        try:
            height, width = image.shape[:2]
            
            # Calculate new dimensions based on DPI
            # Assuming original image is at 72 DPI
            scale_factor = dpi / 72.0
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            
            # Resize using Lanczos interpolation for best quality
            resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
            
            return resized
        except Exception as e:
            logger.warning(f"Print resize failed: {e}")
            return image
    
    def _convert_to_cmyk(self, image: np.ndarray) -> np.ndarray:
        """Convert image to CMYK color space for print"""
        try:
            # Convert BGR to RGB first
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image for CMYK conversion
            pil_image = Image.fromarray(rgb)
            
            # Convert to CMYK
            cmyk_image = pil_image.convert('CMYK')
            
            # Convert back to numpy array
            cmyk_array = np.array(cmyk_image)
            
            # Convert CMYK back to BGR for display
            rgb_converted = Image.fromarray(cmyk_array, 'CMYK').convert('RGB')
            result = cv2.cvtColor(np.array(rgb_converted), cv2.COLOR_RGB2BGR)
            
            return result
        except Exception as e:
            logger.warning(f"CMYK conversion failed: {e}")
            return image
    
    async def _save_processed_image(self, image: np.ndarray, original_url: str = None) -> str:
        """Save processed image to disk"""
        try:
            import time
            # Generate meaningful filename based on original URL
            if original_url:
                # Generate filename with timestamp
                filename = generate_processing_filename(
                    original_url=original_url,
                    processing_type="preprocessed",
                    extension="png",
                    include_timestamp=True
                )
            else:
                # Fallback to timestamp
                timestamp = int(time.time() * 1000)
                filename = f"preprocessed_{timestamp}.png"
            
            output_path = os.path.join(self.output_dir, filename)
            
            # Handle both BGR and BGRA images
            if image.shape[2] == 4:  # BGRA image with transparency
                # Convert BGRA to RGBA for PIL
                rgba_image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA)
                pil_image = Image.fromarray(rgba_image, 'RGBA')
            else:  # BGR image
                # Convert BGR to RGB for PIL
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_image)
            
            # Save with high quality
            pil_image.save(output_path, 'PNG', optimize=True)
            
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to save processed image: {str(e)}")

# Global preprocessor instance
preprocessor = ImagePreprocessor()
