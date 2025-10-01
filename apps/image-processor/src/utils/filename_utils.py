"""
Utility functions for generating timestamped filenames
"""
import os
import time
import re
import urllib.parse
from typing import Optional

def slugify_filename(filename: str) -> str:
    """
    Convert a filename to a clean, URL-safe slug
    
    Args:
        filename: Original filename
        
    Returns:
        str: Slugified filename
    """
    # Remove file extension
    name_without_ext = os.path.splitext(filename)[0]
    
    # URL decode first to handle encoded characters like %20
    try:
        name_without_ext = urllib.parse.unquote(name_without_ext)
    except:
        pass  # If decoding fails, continue with original
    
    # Convert to lowercase
    slug = name_without_ext.lower()
    
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars except spaces and hyphens
    slug = re.sub(r'[-\s]+', '-', slug)   # Replace spaces and multiple hyphens with single hyphen
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # Limit length to 50 characters
    if len(slug) > 50:
        slug = slug[:50].rstrip('-')
    
    return slug

def generate_timestamped_filename(
    original_url: str, 
    suffix: str, 
    extension: str,
    include_timestamp: bool = True
) -> str:
    """
    Generate a timestamped filename from an original URL
    
    Args:
        original_url: The original image URL
        suffix: Suffix to add before the extension (e.g., "_upscaled", "_enhanced")
        extension: File extension (e.g., "png", "jpg", "svg")
        include_timestamp: Whether to include timestamp in filename
        
    Returns:
        str: Generated filename with timestamp
    """
    try:
        # Parse the original URL to get the filename
        parsed_url = urllib.parse.urlparse(original_url)
        original_name = os.path.basename(parsed_url.path)
        
        # Slugify the original filename
        slugified_name = slugify_filename(original_name)
        
        # Create the base filename
        base_filename = f"{slugified_name}{suffix}"
        
        # Add timestamp if requested
        if include_timestamp:
            timestamp = int(time.time() * 1000)  # Milliseconds for uniqueness
            filename = f"{base_filename}_{timestamp}.{extension}"
        else:
            filename = f"{base_filename}.{extension}"
        
        return filename
        
    except Exception:
        # Fallback to timestamp-based filename
        timestamp = int(time.time() * 1000)
        return f"image{suffix}_{timestamp}.{extension}"

def generate_processing_filename(
    original_url: str,
    processing_type: str,
    extension: str = "png",
    include_timestamp: bool = True
) -> str:
    """
    Generate a filename for a specific processing type
    
    Args:
        original_url: The original image URL
        processing_type: Type of processing (e.g., "upscaled", "enhanced", "no_bg")
        extension: File extension
        include_timestamp: Whether to include timestamp
        
    Returns:
        str: Generated filename
    """
    return generate_timestamped_filename(
        original_url=original_url,
        suffix=f"_{processing_type}",
        extension=extension,
        include_timestamp=include_timestamp
    )

def generate_pipeline_filename(
    original_url: str,
    pipeline_steps: list,
    extension: str = "png",
    include_timestamp: bool = True
) -> str:
    """
    Generate a filename for a processing pipeline
    
    Args:
        original_url: The original image URL
        pipeline_steps: List of processing steps (e.g., ["enhanced", "upscaled", "final"])
        extension: File extension
        include_timestamp: Whether to include timestamp
        
    Returns:
        str: Generated filename
    """
    try:
        # Parse the original URL to get the filename
        parsed_url = urllib.parse.urlparse(original_url)
        original_name = os.path.basename(parsed_url.path)
        
        # Slugify the original filename
        slugified_name = slugify_filename(original_name)
        
        # Create the base filename with all steps
        steps_suffix = "_".join(pipeline_steps)
        base_filename = f"{slugified_name}_{steps_suffix}"
        
        # Add timestamp if requested
        if include_timestamp:
            timestamp = int(time.time() * 1000)
            filename = f"{base_filename}_{timestamp}.{extension}"
        else:
            filename = f"{base_filename}.{extension}"
        
        return filename
        
    except Exception:
        # Fallback to timestamp-based filename
        timestamp = int(time.time() * 1000)
        steps_suffix = "_".join(pipeline_steps)
        return f"image_{steps_suffix}_{timestamp}.{extension}"
