"""
Input validation utilities for the Image Processor Service
"""

import re
import os
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)

class InputValidator:
    """Centralized input validation for API endpoints"""
    
    # File size limits (in bytes)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_LOGO_SIZE = 5 * 1024 * 1024    # 5MB
    MAX_BANNER_SIZE = 30 * 1024 * 1024  # 30MB
    
    # Supported image formats
    SUPPORTED_IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    
    # URL patterns
    ALLOWED_URL_SCHEMES = {'http', 'https', 'file', 'data'}
    
    @staticmethod
    def validate_url(url: str, field_name: str = "url") -> str:
        """Validate URL format and scheme"""
        if not url or not isinstance(url, str):
            raise ValidationError(f"{field_name} is required and must be a string", field_name)
        
        # Allow longer URLs for data URLs (base64 encoded images can be very long)
        max_length = 26214400 if url.startswith('data:') else 2048  # 25MB for data URLs, 2KB for regular URLs
        if len(url) > max_length:
            raise ValidationError(f"{field_name} is too long (max {max_length} characters)", field_name)
        
        try:
            parsed = urlparse(url)
            if not parsed.scheme:
                raise ValidationError(f"{field_name} must include a scheme (http, https, or file)", field_name)
            
            if parsed.scheme not in InputValidator.ALLOWED_URL_SCHEMES:
                raise ValidationError(f"{field_name} scheme must be one of: {', '.join(InputValidator.ALLOWED_URL_SCHEMES)}", field_name)
            
            if parsed.scheme in {'http', 'https'} and not parsed.netloc:
                raise ValidationError(f"{field_name} must include a valid domain", field_name)
            
            return url
            
        except Exception as e:
            raise ValidationError(f"Invalid {field_name} format: {str(e)}", field_name)
    
    @staticmethod
    def validate_image_url(url: str, field_name: str = "image_url") -> str:
        """Validate image URL and check file extension"""
        url = InputValidator.validate_url(url, field_name)
        
        # Check file extension
        parsed = urlparse(url)
        path = parsed.path.lower()
        
        # For file URLs, check if file exists and has valid extension
        if parsed.scheme == 'file':
            file_path = parsed.path
            if not os.path.exists(file_path):
                raise ValidationError(f"File not found: {file_path}", field_name)
            
            _, ext = os.path.splitext(file_path)
            if ext not in InputValidator.SUPPORTED_IMAGE_FORMATS:
                raise ValidationError(f"Unsupported image format: {ext}. Supported: {', '.join(InputValidator.SUPPORTED_IMAGE_FORMATS)}", field_name)
        else:
            # For HTTP URLs, check extension in path
            _, ext = os.path.splitext(path)
            if ext and ext not in InputValidator.SUPPORTED_IMAGE_FORMATS:
                raise ValidationError(f"Unsupported image format: {ext}. Supported: {', '.join(InputValidator.SUPPORTED_IMAGE_FORMATS)}", field_name)
        
        return url
    
    @staticmethod
    def validate_scale_factor(scale: float, field_name: str = "scale_factor") -> float:
        """Validate scale factor is within reasonable bounds"""
        if not isinstance(scale, (int, float)):
            raise ValidationError(f"{field_name} must be a number", field_name)
        
        if scale <= 0:
            raise ValidationError(f"{field_name} must be greater than 0", field_name)
        
        if scale > 10:
            raise ValidationError(f"{field_name} must be less than or equal to 10", field_name)
        
        return float(scale)
    
    @staticmethod
    def validate_rotation(rotation: float, field_name: str = "rotation") -> float:
        """Validate rotation angle is within reasonable bounds"""
        if not isinstance(rotation, (int, float)):
            raise ValidationError(f"{field_name} must be a number", field_name)
        
        if rotation < -360 or rotation > 360:
            raise ValidationError(f"{field_name} must be between -360 and 360 degrees", field_name)
        
        return float(rotation)
    
    @staticmethod
    def validate_opacity(opacity: float, field_name: str = "opacity") -> float:
        """Validate opacity is between 0 and 1"""
        if not isinstance(opacity, (int, float)):
            raise ValidationError(f"{field_name} must be a number", field_name)
        
        if opacity < 0 or opacity > 1:
            raise ValidationError(f"{field_name} must be between 0 and 1", field_name)
        
        return float(opacity)
    
    @staticmethod
    def validate_position(position: str, field_name: str = "position") -> str:
        """Validate position string"""
        if not isinstance(position, str):
            raise ValidationError(f"{field_name} must be a string", field_name)
        
        valid_positions = {'left_chest', 'center_chest', 'back_center', 'right_chest'}
        if position not in valid_positions:
            raise ValidationError(f"{field_name} must be one of: {', '.join(valid_positions)}", field_name)
        
        return position
    
    @staticmethod
    def validate_quality(quality: int, field_name: str = "quality") -> int:
        """Validate image quality parameter"""
        if not isinstance(quality, int):
            raise ValidationError(f"{field_name} must be an integer", field_name)
        
        if quality < 1 or quality > 100:
            raise ValidationError(f"{field_name} must be between 1 and 100", field_name)
        
        return quality
    
    @staticmethod
    def validate_output_format(format_str: str, field_name: str = "output_format") -> str:
        """Validate output format string"""
        if not isinstance(format_str, str):
            raise ValidationError(f"{field_name} must be a string", field_name)
        
        valid_formats = {'png', 'jpg', 'jpeg', 'webp'}
        format_lower = format_str.lower()
        
        if format_lower not in valid_formats:
            raise ValidationError(f"{field_name} must be one of: {', '.join(valid_formats)}", field_name)
        
        return format_lower
    
    @staticmethod
    def validate_players(players: Optional[List[Dict[str, Any]]], field_name: str = "players") -> Optional[List[Dict[str, Any]]]:
        """Validate players list for roster functionality"""
        if players is None:
            return None
        
        if not isinstance(players, list):
            raise ValidationError(f"{field_name} must be a list", field_name)
        
        if len(players) > 50:  # Reasonable limit for roster size
            raise ValidationError(f"{field_name} cannot have more than 50 players", field_name)
        
        for i, player in enumerate(players):
            if not isinstance(player, dict):
                raise ValidationError(f"{field_name}[{i}] must be a dictionary", field_name)
            
            if 'number' not in player or 'name' not in player:
                raise ValidationError(f"{field_name}[{i}] must have 'number' and 'name' fields", field_name)
            
            # Validate number
            try:
                number = int(player['number'])
                if number < 0 or number > 999:
                    raise ValidationError(f"{field_name}[{i}].number must be between 0 and 999", field_name)
            except (ValueError, TypeError):
                raise ValidationError(f"{field_name}[{i}].number must be a valid integer", field_name)
            
            # Validate name
            name = player['name']
            if not isinstance(name, str) or not name.strip():
                raise ValidationError(f"{field_name}[{i}].name must be a non-empty string", field_name)
            
            if len(name) > 50:  # Reasonable name length limit
                raise ValidationError(f"{field_name}[{i}].name must be 50 characters or less", field_name)
        
        return players
    
    @staticmethod
    def validate_team_name(name: str, field_name: str = "team_name") -> str:
        """Validate team name"""
        if not isinstance(name, str):
            raise ValidationError(f"{field_name} must be a string", field_name)
        
        name = name.strip()
        if not name:
            raise ValidationError(f"{field_name} cannot be empty", field_name)
        
        if len(name) > 100:
            raise ValidationError(f"{field_name} must be 100 characters or less", field_name)
        
        # Check for potentially problematic characters
        if re.search(r'[<>:"/\\|?*]', name):
            raise ValidationError(f"{field_name} contains invalid characters", field_name)
        
        return name
    
    @staticmethod
    def validate_player_number(number: int, field_name: str = "number") -> int:
        """Validate player number"""
        if not isinstance(number, int):
            raise ValidationError(f"{field_name} must be an integer", field_name)
        
        if number < 1 or number > 99:
            raise ValidationError(f"{field_name} must be between 1 and 99", field_name)
        
        return number
    
    @staticmethod
    def validate_player_name(name: str, field_name: str = "name") -> str:
        """Validate player name"""
        if not isinstance(name, str):
            raise ValidationError(f"{field_name} must be a string", field_name)
        
        name = name.strip()
        if not name:
            raise ValidationError(f"{field_name} cannot be empty", field_name)
        
        if len(name) > 50:
            raise ValidationError(f"{field_name} must be 50 characters or less", field_name)
        
        return name
    
    @staticmethod
    def validate_banner_style(style: Dict[str, Any], field_name: str = "style") -> Dict[str, Any]:
        """Validate banner style parameters"""
        if not isinstance(style, dict):
            raise ValidationError(f"{field_name} must be a dictionary", field_name)
        
        # Validate banner dimensions
        if 'banner_width' in style:
            width = style['banner_width']
            if not isinstance(width, int) or width < 100 or width > 5000:
                raise ValidationError(f"{field_name}.banner_width must be an integer between 100 and 5000", field_name)
        
        if 'banner_height' in style:
            height = style['banner_height']
            if not isinstance(height, int) or height < 100 or height > 5000:
                raise ValidationError(f"{field_name}.banner_height must be an integer between 100 and 5000", field_name)
        
        # Validate colors
        if 'text_color' in style:
            color = style['text_color']
            if not isinstance(color, str) or not re.match(r'^#[0-9A-Fa-f]{6}$', color):
                raise ValidationError(f"{field_name}.text_color must be a valid hex color (e.g., #FF0000)", field_name)
        
        if 'number_color' in style:
            color = style['number_color']
            if not isinstance(color, str) or not re.match(r'^#[0-9A-Fa-f]{6}$', color):
                raise ValidationError(f"{field_name}.number_color must be a valid hex color (e.g., #FF0000)", field_name)
        
        return style
