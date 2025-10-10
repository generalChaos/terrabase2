"""
Color Analysis API endpoint for extracting dominant colors from images
"""

import requests
from PIL import Image
import io
from collections import Counter
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

def download_image(url: str) -> Image.Image:
    """Download image from URL and return PIL Image object"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        logger.error(f"Failed to download image from {url}: {e}")
        raise ValueError(f"Could not download image: {e}")

def resize_image(image: Image.Image, max_size: int = 300) -> Image.Image:
    """Resize image to max_size while maintaining aspect ratio"""
    # Calculate new size maintaining aspect ratio
    width, height = image.size
    if width > height:
        new_width = max_size
        new_height = int((height * max_size) / width)
    else:
        new_height = max_size
        new_width = int((width * max_size) / height)
    
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex string"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}".upper()

def rgb_to_hsv(rgb):
    """Convert RGB to HSV"""
    r, g, b = rgb
    r, g, b = r/255.0, g/255.0, b/255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    diff = max_val - min_val
    
    # Hue
    if diff == 0:
        h = 0
    elif max_val == r:
        h = (60 * ((g - b) / diff) + 360) % 360
    elif max_val == g:
        h = (60 * ((b - r) / diff) + 120) % 360
    else:
        h = (60 * ((r - g) / diff) + 240) % 360
    
    # Saturation
    s = 0 if max_val == 0 else diff / max_val
    
    # Value
    v = max_val
    
    return h, s, v

def group_similar_colors(colors: List[Tuple[int, int, int]], threshold: int = 30) -> List[Tuple[int, int, int]]:
    """
    Group similar colors together, but prioritize different color families
    """
    if not colors:
        return []
    
    # Convert to numpy array for easier manipulation
    colors_array = np.array(colors)
    grouped_colors = []
    used_indices = set()
    
    # Sort colors by frequency (most common first)
    color_counts = {}
    for color in colors:
        color_counts[tuple(color)] = color_counts.get(tuple(color), 0) + 1
    
    sorted_colors = sorted(colors_array, key=lambda x: color_counts[tuple(x)], reverse=True)
    
    for i, color in enumerate(sorted_colors):
        if i in used_indices:
            continue
            
        # Convert to HSV for better color family detection
        h, s, v = rgb_to_hsv(color)
        
        # Find all similar colors (same hue family)
        similar_indices = [i]
        for j, other_color in enumerate(sorted_colors):
            if j != i and j not in used_indices:
                other_h, other_s, other_v = rgb_to_hsv(other_color)
                
                # Check if colors are in the same hue family (within 30 degrees)
                hue_diff = min(abs(h - other_h), 360 - abs(h - other_h))
                
                # Also check RGB distance for very similar colors
                rgb_distance = np.sqrt(np.sum((color - other_color) ** 2))
                
                if hue_diff <= 30 and rgb_distance <= threshold:
                    similar_indices.append(j)
                    used_indices.add(j)
        
        # Average the similar colors
        if len(similar_indices) > 1:
            avg_color = np.mean(colors_array[similar_indices], axis=0).astype(int)
            grouped_colors.append(tuple(avg_color))
        else:
            grouped_colors.append(tuple(color))
        
        used_indices.add(i)
    
    return grouped_colors

def analyze_image_colors(image_url: str) -> Dict[str, any]:
    """
    Analyze an image and return the top 3 most frequent colors
    
    Args:
        image_url: URL of the image to analyze
        
    Returns:
        Dictionary with colors and their frequencies
    """
    try:
        # Download and load image
        image = download_image(image_url)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize for performance
        image = resize_image(image, max_size=300)
        
        # Convert to numpy array for faster processing
        img_array = np.array(image)
        
        # Reshape to list of pixels
        pixels = img_array.reshape(-1, 3)
        
        # Use all pixels for analysis - don't filter out light colors
        # This ensures we capture the full color palette
        filtered_pixels = [tuple(pixel) for pixel in pixels]
        
        # Count color frequencies
        color_counter = Counter(filtered_pixels)
        
        # Group similar colors to avoid having many nearly identical colors
        # Get more colors initially to ensure we have variety
        top_colors = [color for color, count in color_counter.most_common(100)]
        grouped_colors = group_similar_colors(top_colors, threshold=20)
        
        # Recalculate frequencies for grouped colors
        final_counter = Counter()
        for pixel in filtered_pixels:
            # Find the closest grouped color
            min_distance = float('inf')
            closest_color = None
            for grouped_color in grouped_colors:
                distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(pixel, grouped_color)))
                if distance < min_distance:
                    min_distance = distance
                    closest_color = grouped_color
            
            if closest_color:
                final_counter[closest_color] += 1
        
        # Get top colors, but ensure they're from different color families
        all_colors = final_counter.most_common(20)  # Get more options
        selected_colors = []
        
        for color, count in all_colors:
            if len(selected_colors) >= 3:
                break
                
            # Check if this color is from a different color family
            h, s, v = rgb_to_hsv(color)
            is_different_family = True
            
            for selected_color, _ in selected_colors:
                selected_h, selected_s, selected_v = rgb_to_hsv(selected_color)
                hue_diff = min(abs(h - selected_h), 360 - abs(h - selected_h))
                
                # If hue difference is less than 60 degrees, it's too similar
                if hue_diff < 60:
                    is_different_family = False
                    break
            
            if is_different_family:
                selected_colors.append((color, count))
        
        # If we don't have 3 different families, fill with most frequent remaining
        if len(selected_colors) < 3:
            remaining_colors = [(color, count) for color, count in all_colors 
                              if (color, count) not in selected_colors]
            selected_colors.extend(remaining_colors[:3-len(selected_colors)])
        
        # Format response
        colors = []
        frequencies = []
        
        for color, count in selected_colors[:3]:
            colors.append(rgb_to_hex(color))
            frequencies.append(count)
        
        # Calculate percentages
        total_pixels = sum(frequencies)
        percentages = [round((freq / total_pixels) * 100, 1) for freq in frequencies]
        
        return {
            "colors": colors,
            "frequencies": frequencies,
            "percentages": percentages,
            "total_pixels_analyzed": total_pixels
        }
        
    except Exception as e:
        logger.error(f"Error analyzing colors for image {image_url}: {e}")
        raise ValueError(f"Color analysis failed: {e}")

def analyze_colors_endpoint(request_data: Dict) -> Dict[str, any]:
    """
    API endpoint handler for color analysis
    
    Expected request format:
    {
        "image_url": "https://example.com/image.png"
    }
    
    Returns:
    {
        "colors": ["#FF0000", "#00FF00", "#0000FF"],
        "frequencies": [1500, 800, 300],
        "percentages": [57.7, 30.8, 11.5],
        "total_pixels_analyzed": 2600
    }
    """
    try:
        image_url = request_data.get("image_url")
        if not image_url:
            raise ValueError("image_url is required")
        
        result = analyze_image_colors(image_url)
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Color analysis endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
