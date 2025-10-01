"""
File validation utilities for the Image Processor Service
"""

import os
import requests
from typing import Optional, Tuple
from PIL import Image
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class FileValidator:
    """File validation utilities for size, format, and content"""
    
    # File size limits (in bytes)
    MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE_BYTES", "10485760"))  # 10MB default
    MAX_LOGO_SIZE = int(os.getenv("MAX_LOGO_SIZE_BYTES", "5242880"))     # 5MB default
    MAX_BANNER_SIZE = int(os.getenv("MAX_BANNER_SIZE_BYTES", "15728640")) # 15MB default
    
    # Image dimension limits
    MAX_IMAGE_WIDTH = int(os.getenv("MAX_IMAGE_WIDTH", "8192"))
    MAX_IMAGE_HEIGHT = int(os.getenv("MAX_IMAGE_HEIGHT", "8192"))
    MIN_IMAGE_WIDTH = int(os.getenv("MIN_IMAGE_WIDTH", "16"))
    MIN_IMAGE_HEIGHT = int(os.getenv("MIN_IMAGE_HEIGHT", "16"))
    
    # Supported formats (both file extensions and PIL format names)
    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    SUPPORTED_FORMATS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'}
    
    @staticmethod
    def validate_file_size(file_path: str, max_size: int = None) -> Tuple[bool, str, int]:
        """
        Validate file size
        
        Args:
            file_path: Path to the file
            max_size: Maximum allowed size in bytes (uses default if None)
            
        Returns:
            Tuple of (is_valid, error_message, file_size)
        """
        try:
            if not os.path.exists(file_path):
                return False, "File does not exist", 0
            
            file_size = os.path.getsize(file_path)
            max_allowed = max_size or FileValidator.MAX_IMAGE_SIZE
            
            if file_size > max_allowed:
                return False, f"File size {file_size} bytes exceeds maximum {max_allowed} bytes", file_size
            
            return True, "", file_size
            
        except Exception as e:
            return False, f"Error checking file size: {str(e)}", 0
    
    @staticmethod
    def validate_image_dimensions(file_path: str) -> Tuple[bool, str, Tuple[int, int]]:
        """
        Validate image dimensions
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Tuple of (is_valid, error_message, (width, height))
        """
        try:
            with Image.open(file_path) as img:
                width, height = img.size
                
                if width < FileValidator.MIN_IMAGE_WIDTH or height < FileValidator.MIN_IMAGE_HEIGHT:
                    return False, f"Image too small: {width}x{height} (minimum: {FileValidator.MIN_IMAGE_WIDTH}x{FileValidator.MIN_IMAGE_HEIGHT})", (width, height)
                
                if width > FileValidator.MAX_IMAGE_WIDTH or height > FileValidator.MAX_IMAGE_HEIGHT:
                    return False, f"Image too large: {width}x{height} (maximum: {FileValidator.MAX_IMAGE_WIDTH}x{FileValidator.MAX_IMAGE_HEIGHT})", (width, height)
                
                return True, "", (width, height)
                
        except Exception as e:
            return False, f"Error validating image dimensions: {str(e)}", (0, 0)
    
    @staticmethod
    def validate_image_format(file_path: str) -> Tuple[bool, str, str]:
        """
        Validate image format
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Tuple of (is_valid, error_message, format)
        """
        try:
            with Image.open(file_path) as img:
                format_name = img.format
                
                if not format_name:
                    return False, "Unable to determine image format", ""
                
                # Check if format is supported
                format_lower = format_name.lower()
                if format_lower not in FileValidator.SUPPORTED_FORMATS:
                    return False, f"Unsupported image format: {format_name}. Supported: {', '.join(FileValidator.SUPPORTED_FORMATS)}", format_name
                
                return True, "", format_name
                
        except Exception as e:
            return False, f"Error validating image format: {str(e)}", ""
    
    @staticmethod
    def validate_image_content(file_path: str) -> Tuple[bool, str]:
        """
        Validate image content (check if it's actually a valid image)
        
        Args:
            file_path: Path to the image file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            with Image.open(file_path) as img:
                # Try to load the image data
                img.load()
                
                # Check if image has any content
                if img.size[0] == 0 or img.size[1] == 0:
                    return False, "Image has zero dimensions"
                
                return True, ""
                
        except Exception as e:
            return False, f"Invalid image content: {str(e)}"
    
    @staticmethod
    def validate_remote_file_size(url: str, max_size: int = None) -> Tuple[bool, str, int]:
        """
        Validate remote file size without downloading the entire file
        
        Args:
            url: URL of the remote file
            max_size: Maximum allowed size in bytes (uses default if None)
            
        Returns:
            Tuple of (is_valid, error_message, file_size)
        """
        try:
            # Make a HEAD request to get file size
            response = requests.head(url, timeout=10, allow_redirects=True)
            response.raise_for_status()
            
            content_length = response.headers.get('content-length')
            if not content_length:
                return False, "Could not determine file size from remote URL", 0
            
            file_size = int(content_length)
            max_allowed = max_size or FileValidator.MAX_IMAGE_SIZE
            
            if file_size > max_allowed:
                return False, f"Remote file size {file_size} bytes exceeds maximum {max_allowed} bytes", file_size
            
            return True, "", file_size
            
        except Exception as e:
            return False, f"Error checking remote file size: {str(e)}", 0
    
    @staticmethod
    def validate_file_for_processing(file_path: str, file_type: str = "image") -> Tuple[bool, str, dict]:
        """
        Comprehensive file validation for processing
        
        Args:
            file_path: Path to the file
            file_type: Type of file ("image", "logo", "banner")
            
        Returns:
            Tuple of (is_valid, error_message, validation_info)
        """
        validation_info = {
            "file_size": 0,
            "dimensions": (0, 0),
            "format": "",
            "file_type": file_type
        }
        
        try:
            # Determine max size based on file type
            max_sizes = {
                "image": FileValidator.MAX_IMAGE_SIZE,
                "logo": FileValidator.MAX_LOGO_SIZE,
                "banner": FileValidator.MAX_BANNER_SIZE
            }
            max_size = max_sizes.get(file_type, FileValidator.MAX_IMAGE_SIZE)
            
            # Validate file size
            is_valid, error_msg, file_size = FileValidator.validate_file_size(file_path, max_size)
            if not is_valid:
                return False, error_msg, validation_info
            validation_info["file_size"] = file_size
            
            # Validate image format
            is_valid, error_msg, format_name = FileValidator.validate_image_format(file_path)
            if not is_valid:
                return False, error_msg, validation_info
            validation_info["format"] = format_name
            
            # Validate image dimensions
            is_valid, error_msg, dimensions = FileValidator.validate_image_dimensions(file_path)
            if not is_valid:
                return False, error_msg, validation_info
            validation_info["dimensions"] = dimensions
            
            # Validate image content
            is_valid, error_msg = FileValidator.validate_image_content(file_path)
            if not is_valid:
                return False, error_msg, validation_info
            
            return True, "", validation_info
            
        except Exception as e:
            return False, f"File validation error: {str(e)}", validation_info
    
    @staticmethod
    def validate_remote_file_for_processing(url: str, file_type: str = "image") -> Tuple[bool, str, dict]:
        """
        Validate remote file for processing (size only, format validation requires download)
        
        Args:
            url: URL of the remote file
            file_type: Type of file ("image", "logo", "banner")
            
        Returns:
            Tuple of (is_valid, error_message, validation_info)
        """
        validation_info = {
            "file_size": 0,
            "url": url,
            "file_type": file_type
        }
        
        try:
            # Check URL scheme first
            parsed_url = urlparse(url)
            if parsed_url.scheme not in ['http', 'https', 'file']:
                return False, f"Unsupported URL scheme: {parsed_url.scheme}", validation_info
            
            # Determine max size based on file type
            max_sizes = {
                "image": FileValidator.MAX_IMAGE_SIZE,
                "logo": FileValidator.MAX_LOGO_SIZE,
                "banner": FileValidator.MAX_BANNER_SIZE
            }
            max_size = max_sizes.get(file_type, FileValidator.MAX_IMAGE_SIZE)
            
            # Validate remote file size
            is_valid, error_msg, file_size = FileValidator.validate_remote_file_size(url, max_size)
            if not is_valid:
                return False, error_msg, validation_info
            validation_info["file_size"] = file_size
            
            return True, "", validation_info
            
        except Exception as e:
            return False, f"Remote file validation error: {str(e)}", validation_info
    
    @staticmethod
    def get_file_validation_summary(validation_info: dict) -> str:
        """
        Get a human-readable summary of file validation
        
        Args:
            validation_info: Dictionary from validate_file_for_processing
            
        Returns:
            Human-readable summary string
        """
        file_size_mb = validation_info.get("file_size", 0) / (1024 * 1024)
        dimensions = validation_info.get("dimensions", (0, 0))
        format_name = validation_info.get("format", "unknown")
        file_type = validation_info.get("file_type", "unknown")
        
        return f"{file_type.title()} file: {format_name.upper()}, {dimensions[0]}x{dimensions[1]}px, {file_size_mb:.2f}MB"
