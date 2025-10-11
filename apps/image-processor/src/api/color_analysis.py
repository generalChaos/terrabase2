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

def create_meaningful_variants(colors: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
    """
    Create meaningful variants based on the actual colors found in the image
    - Dark version of the most prominent color (for primary)
    - Light version of the most prominent color (for secondary) 
    - Keep the third color as-is if it's distinct
    """
    if len(colors) < 1:
        return colors
    
    variants = []
    
    # First color: use the most prominent color as-is for primary
    primary_rgb = colors[0]
    variants.append(primary_rgb)
    
    # Second color: create a lighter version of the primary color for secondary
    h, s, v = rgb_to_hsv(primary_rgb)
    # Create a lighter, less saturated version
    light_v = min(0.9, v * 1.4)  # Much lighter
    light_s = max(0.2, s * 0.6)  # Less saturated
    light_rgb = hsv_to_rgb(h, light_s, light_v)
    variants.append(light_rgb)
    
    # Third color: use the third color if it's distinct, otherwise create a neutral
    if len(colors) > 2:
        # Check if the third color is significantly different from the first two
        third_rgb = colors[2]
        h3, s3, v3 = rgb_to_hsv(third_rgb)
        
        # Check if it's different enough from primary
        h1, s1, v1 = rgb_to_hsv(primary_rgb)
        hue_diff = min(abs(h3 - h1), 360 - abs(h3 - h1))
        sat_diff = abs(s3 - s1)
        val_diff = abs(v3 - v1)
        
        # If it's significantly different, use it
        if hue_diff > 30 or sat_diff > 0.3 or val_diff > 0.3:
            variants.append(third_rgb)
        else:
            # Use a neutral color
            variants.append((240, 240, 240))
    else:
        # Use a neutral color
        variants.append((240, 240, 240))
    
    return variants

def create_color_variants(colors: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
    """
    Create dark and light variants of colors for better UI representation
    Only use colors that actually exist in the image, no generated colors
    Returns: [dark_primary, light_secondary, distinct_tertiary]
    """
    if len(colors) < 1:
        return colors
    
    variants = []
    
    # First color: make it darker for primary
    primary_rgb = colors[0]
    h, s, v = rgb_to_hsv(primary_rgb)
    # Darken by reducing value and increasing saturation slightly
    dark_v = max(0.3, v * 0.7)  # Darker but not too dark
    dark_s = min(1.0, s * 1.1)  # Slightly more saturated
    dark_rgb = hsv_to_rgb(h, dark_s, dark_v)
    variants.append(dark_rgb)
    
    # Second color: make it lighter for secondary
    if len(colors) > 1:
        secondary_rgb = colors[1]
        h2, s2, v2 = rgb_to_hsv(secondary_rgb)
        # Lighten by increasing value and reducing saturation slightly
        light_v = min(0.9, v2 * 1.3)  # Lighter but not too light
        light_s = max(0.3, s2 * 0.8)  # Slightly less saturated
        light_rgb = hsv_to_rgb(h2, light_s, light_v)
        variants.append(light_rgb)
    else:
        # If only one color, create a lighter version of the same color
        h, s, v = rgb_to_hsv(primary_rgb)
        light_v = min(0.9, v * 1.4)  # Much lighter
        light_s = max(0.2, s * 0.6)  # Less saturated
        light_rgb = hsv_to_rgb(h, light_s, light_v)
        variants.append(light_rgb)
    
    # Third color: use the third color as-is, or create a neutral if not available
    if len(colors) > 2:
        variants.append(colors[2])
    else:
        # Use a neutral color instead of generating a complementary
        variants.append((240, 240, 240))  # Light gray
    
    return variants

def hsv_to_rgb(h, s, v):
    """Convert HSV to RGB"""
    h = h % 360
    c = v * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = v - c
    
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    
    return (int((r + m) * 255), int((g + m) * 255), int((b + m) * 255))

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
    print(f"🔍 COLOR_ANALYSIS: Starting analysis for URL: {image_url} - IMPROVED ALGORITHM v2")
    try:
        # Download and load image
        print(f"🔍 COLOR_ANALYSIS: Downloading image...")
        image = download_image(image_url)
        print(f"🔍 COLOR_ANALYSIS: Image downloaded successfully, size: {image.size}, mode: {image.mode}")
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            print(f"🔍 COLOR_ANALYSIS: Converting from {image.mode} to RGB")
            image = image.convert('RGB')
        
        # Resize for performance
        print(f"🔍 COLOR_ANALYSIS: Resizing image...")
        image = resize_image(image, max_size=300)
        print(f"🔍 COLOR_ANALYSIS: Resized to: {image.size}")
        
        # Convert to numpy array for faster processing
        print(f"🔍 COLOR_ANALYSIS: Converting to numpy array...")
        img_array = np.array(image)
        print(f"🔍 COLOR_ANALYSIS: Array shape: {img_array.shape}")
        
        # Reshape to list of pixels
        pixels = img_array.reshape(-1, 3)
        print(f"🔍 COLOR_ANALYSIS: Total pixels: {len(pixels)}")
        
        # Filter out very light colors (likely background noise) and very dark colors (shadows)
        # But keep bright, saturated colors that are likely part of the logo
        print(f"🔍 COLOR_ANALYSIS: Filtering pixels...")
        filtered_pixels = []
        for pixel in pixels:
            r, g, b = pixel
            # Convert to HSV to check saturation
            h, s, v = rgb_to_hsv(pixel)
            
            # Skip very light colors (near white) - these are likely background noise
            # But keep bright, saturated colors (like vibrant oranges, reds, yellows)
            if r + g + b > 700 and s < 0.3:  # Very light AND low saturation
                continue
            # Skip very dark colors (near black) - these are likely shadows/outlines
            if r + g + b < 100:
                continue
            filtered_pixels.append(tuple(pixel))
        
        print(f"🔍 COLOR_ANALYSIS: Filtered pixels: {len(filtered_pixels)} (from {len(pixels)})")
        
        # If we filtered out everything, use original pixels
        if not filtered_pixels:
            print(f"🔍 COLOR_ANALYSIS: No pixels after filtering, using original pixels")
            filtered_pixels = [tuple(pixel) for pixel in pixels]
        
        # Count color frequencies
        print(f"🔍 COLOR_ANALYSIS: Counting color frequencies...")
        color_counter = Counter(filtered_pixels)
        print(f"🔍 COLOR_ANALYSIS: Found {len(color_counter)} unique colors")
        
        # Group similar colors to avoid having many nearly identical colors
        # Get more colors initially to ensure we have variety
        top_colors = [color for color, count in color_counter.most_common(100)]
        print(f"🔍 COLOR_ANALYSIS: Top 100 colors: {len(top_colors)}")
        grouped_colors = group_similar_colors(top_colors, threshold=20)
        print(f"🔍 COLOR_ANALYSIS: Grouped colors: {len(grouped_colors)}")
        
        # Recalculate frequencies for grouped colors with saturation weighting
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
                # Weight by saturation - more saturated colors get higher weight
                h, s, v = rgb_to_hsv(closest_color)
                saturation_weight = 1 + (s * 0.5)  # Boost saturated colors by up to 50%
                final_counter[closest_color] += saturation_weight
        
        # Get top colors, but ensure they're from different color families
        all_colors = final_counter.most_common(30)  # Get more options
        selected_colors = []
        
        # Define color families more strictly
        color_families = {
            'red': (0, 30),
            'orange': (30, 60), 
            'yellow': (60, 90),
            'green': (90, 150),
            'cyan': (150, 180),
            'blue': (180, 240),
            'purple': (240, 300),
            'pink': (300, 330),
            'red_pink': (330, 360)
        }
        
        used_families = set()
        
        for color, count in all_colors:
            if len(selected_colors) >= 3:
                break
                
            h, s, v = rgb_to_hsv(color)
            
            # Determine color family
            color_family = None
            for family, (min_hue, max_hue) in color_families.items():
                if min_hue <= h < max_hue:
                    color_family = family
                    break
            
            # Skip if we already have this color family (unless it's very different)
            if color_family in used_families:
                # Check if it's significantly different from existing colors in this family
                is_significantly_different = True
                for selected_color, _ in selected_colors:
                    selected_h, selected_s, selected_v = rgb_to_hsv(selected_color)
                    selected_family = None
                    for fam, (min_h, max_h) in color_families.items():
                        if min_h <= selected_h < max_h:
                            selected_family = fam
                            break
                    
                    if selected_family == color_family:
                        # Same family - check if significantly different in saturation or value
                        sat_diff = abs(s - selected_s)
                        val_diff = abs(v - selected_v)
                        if sat_diff < 0.3 and val_diff < 0.3:
                            is_significantly_different = False
                            break
                
                if not is_significantly_different:
                    continue
            
            # Prefer more saturated colors and avoid very light/dark
            # Also avoid pure white/black colors
            r, g, b = color
            is_not_white_black = not (r + g + b > 700 or r + g + b < 100)
            
            # Prioritize highly saturated colors (like vibrant oranges, reds, yellows)
            if s > 0.4 and 0.3 < v < 0.95 and is_not_white_black:
                selected_colors.append((color, count))
                used_families.add(color_family)
            elif s > 0.2 and 0.2 < v < 0.9 and len(selected_colors) < 2 and is_not_white_black:
                # Include moderately saturated colors if we don't have enough
                selected_colors.append((color, count))
                used_families.add(color_family)
            elif s > 0.1 and 0.3 < v < 0.8 and len(selected_colors) < 1 and is_not_white_black:
                # Include less saturated colors only if we have very few colors
                selected_colors.append((color, count))
                used_families.add(color_family)
        
        # If we don't have 3 different families, fill with most frequent remaining
        if len(selected_colors) < 3:
            remaining_colors = [(color, count) for color, count in all_colors 
                              if (color, count) not in selected_colors]
            selected_colors.extend(remaining_colors[:3-len(selected_colors)])
        
        # Ensure we have at least 2 colors by being more lenient
        if len(selected_colors) < 2:
            print(f"🔍 COLOR_ANALYSIS: Only found {len(selected_colors)} colors, being more lenient...")
            # Get the most frequent colors regardless of family restrictions
            all_colors_sorted = sorted(final_counter.most_common(10), key=lambda x: x[1], reverse=True)
            for color, count in all_colors_sorted:
                if len(selected_colors) >= 2:
                    break
                if (color, count) not in selected_colors:
                    selected_colors.append((color, count))
        
        # Use the actual colors found in the image without any variants
        print(f"🔍 COLOR_ANALYSIS: Selected colors: {len(selected_colors)}")
        for i, (color, count) in enumerate(selected_colors[:3]):
            print(f"🔍 COLOR_ANALYSIS: Color {i+1}: {rgb_to_hex(color)} (count: {count})")
        
        # Format response
        colors = []
        frequencies = []
        
        for i, (color, count) in enumerate(selected_colors[:3]):
            colors.append(rgb_to_hex(color))
            frequencies.append(int(count))  # Convert to integer for Pydantic validation
        
        # Calculate percentages
        total_pixels = sum(frequencies)
        percentages = [round((freq / total_pixels) * 100, 1) for freq in frequencies]
        
        result = {
            "colors": colors,
            "frequencies": frequencies,
            "percentages": percentages,
            "total_pixels_analyzed": total_pixels
        }
        
        print(f"🔍 COLOR_ANALYSIS: Final result: {result}")
        return result
        
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
