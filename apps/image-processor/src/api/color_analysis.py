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

def analyze_image_colors(image_url: str, max_colors: int = 10, max_size: int = 300) -> Dict[str, any]:
    """
    SIMPLIFIED color analysis - just get the most frequent colors
    
    Args:
        image_url: URL of the image to analyze
        
    Returns:
        Dictionary with colors and their frequencies
    """
    print(f"🔍 COLOR_ANALYSIS: Starting SIMPLIFIED analysis for URL: {image_url}")
    try:
        print(f"🔍 COLOR_ANALYSIS: Max colors requested: {max_colors}")
        # Download and load image
        print(f"🔍 COLOR_ANALYSIS: Downloading image...")
        image = download_image(image_url)
        print(f"🔍 COLOR_ANALYSIS: Image downloaded successfully, size: {image.size}, mode: {image.mode}")
        
        # Store original mode for transparency handling
        original_mode = image.mode
        has_alpha = image.mode in ('RGBA', 'LA')
        
        if has_alpha:
            print(f"🔍 COLOR_ANALYSIS: Image has alpha channel ({image.mode}), will filter transparent pixels")
            # Keep as RGBA for transparency filtering
            pass
        elif image.mode != 'RGB':
            print(f"🔍 COLOR_ANALYSIS: Converting from {image.mode} to RGB")
            image = image.convert('RGB')
        
        # Resize for performance
        print(f"🔍 COLOR_ANALYSIS: Resizing image...")
        original_pixels = image.size[0] * image.size[1]
        image = resize_image(image, max_size=max_size)
        resized_pixels = image.size[0] * image.size[1]
        data_loss_percent = ((original_pixels - resized_pixels) / original_pixels) * 100
        print(f"🔍 COLOR_ANALYSIS: Resized to: {image.size}")
        print(f"🔍 COLOR_ANALYSIS: Data loss: {original_pixels:,} → {resized_pixels:,} pixels ({data_loss_percent:.1f}% reduction)")
        
        # Convert to numpy array for faster processing
        print(f"🔍 COLOR_ANALYSIS: Converting to numpy array...")
        img_array = np.array(image)
        print(f"🔍 COLOR_ANALYSIS: Array shape: {img_array.shape}")
        
        # Handle transparency - filter out transparent pixels
        if has_alpha:
            print(f"🔍 COLOR_ANALYSIS: Filtering transparent pixels...")
            # Get alpha channel
            alpha_channel = img_array[:, :, -1] if img_array.shape[2] == 4 else img_array[:, :, 1]  # RGBA or LA
            # Create mask for non-transparent pixels (alpha > 0)
            non_transparent_mask = alpha_channel > 0
            # Get RGB channels only
            rgb_channels = img_array[:, :, :3] if img_array.shape[2] == 4 else img_array
            # Filter to only non-transparent pixels
            pixels = rgb_channels[non_transparent_mask]
            print(f"🔍 COLOR_ANALYSIS: After transparency filtering: {len(pixels)} pixels (was {img_array.shape[0] * img_array.shape[1]})")
        else:
            # Reshape to list of pixels
            pixels = img_array.reshape(-1, 3)
            print(f"🔍 COLOR_ANALYSIS: Total pixels: {len(pixels)}")
        
        # FOREGROUND-BIASED: Use edge detection and center bias to prioritize subject colors
        print(f"🔍 COLOR_ANALYSIS: Using foreground-biased color detection...")
        
        # Convert to grayscale for edge detection
        gray_img = image.convert('L')
        gray_array = np.array(gray_img)
        
        # Simple edge detection using gradient
        from scipy import ndimage
        try:
            # Calculate gradients
            grad_x = ndimage.sobel(gray_array, axis=1)
            grad_y = ndimage.sobel(gray_array, axis=0)
            edge_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            
            # Normalize edge magnitude to 0-1
            edge_magnitude = edge_magnitude / np.max(edge_magnitude)
            
            print(f"🔍 COLOR_ANALYSIS: Edge detection completed, max edge strength: {np.max(edge_magnitude):.3f}")
        except ImportError:
            print(f"🔍 COLOR_ANALYSIS: scipy not available, using simple edge detection")
            # Simple edge detection without scipy
            edge_magnitude = np.zeros_like(gray_array, dtype=float)
            for i in range(1, gray_array.shape[0]-1):
                for j in range(1, gray_array.shape[1]-1):
                    gx = int(gray_array[i, j+1]) - int(gray_array[i, j-1])
                    gy = int(gray_array[i+1, j]) - int(gray_array[i-1, j])
                    edge_magnitude[i, j] = np.sqrt(gx**2 + gy**2)
            edge_magnitude = edge_magnitude / np.max(edge_magnitude)
        
        # Create center bias (subjects are often in center)
        height, width = gray_array.shape
        center_y, center_x = height // 2, width // 2
        y_coords, x_coords = np.ogrid[:height, :width]
        center_distance = np.sqrt((x_coords - center_x)**2 + (y_coords - center_x)**2)
        max_distance = np.sqrt(center_x**2 + center_y**2)
        center_bias = 1.0 - (center_distance / max_distance)  # 1.0 at center, 0.0 at edges
        
        color_counter = Counter()
        
        if has_alpha:
            # For images with transparency, we have a 1D array of non-transparent pixels
            print(f"🔍 COLOR_ANALYSIS: Processing {len(pixels)} non-transparent pixels...")
            for pixel in pixels:
                r, g, b = pixel
                
                # Skip pure white, pure black (but keep light colors that might be subjects)
                if r + g + b > 780 or r + g + b < 10:
                    continue
                
                # Calculate saturation
                saturation = max(r, g, b) - min(r, g, b)
                
                # Base weight
                weight = 1.0
                
                # Boost for vibrant colors (main subjects)
                if saturation > 60:  # Very vibrant
                    weight *= 2.0
                elif saturation > 40:  # Moderately vibrant
                    weight *= 1.5
                elif saturation > 20:  # Somewhat vibrant
                    weight *= 1.2
                
                # Extra boost for primary colors (often main subjects)
                if (r > g and r > b and r > 120) or (g > r and g > b and g > 120) or (b > r and b > g and b > 120):
                    weight *= 1.3
                
                # Penalize very light grays (likely background)
                if r > 200 and g > 200 and b > 200 and saturation < 30:
                    weight *= 0.3
                
                color_counter[tuple(pixel)] += weight
        else:
            # For images without transparency, use the original 2D processing with edge detection
            print(f"🔍 COLOR_ANALYSIS: Processing {len(pixels)} pixels with edge detection...")
            for i, pixel in enumerate(pixels):
                r, g, b = pixel
                row, col = i // width, i % width
                
                # Skip pure white, pure black (but keep light colors that might be subjects)
                if r + g + b > 780 or r + g + b < 10:
                    continue
                
                # Calculate weights
                edge_weight = edge_magnitude[row, col]  # Higher weight for edges (subject boundaries)
                center_weight = center_bias[row, col]   # Higher weight for center areas
                saturation = max(r, g, b) - min(r, g, b)
                
                # Base weight
                weight = 1.0
                
                # Boost for edge pixels (subject boundaries)
                if edge_weight > 0.3:  # Strong edges
                    weight *= 2.0
                elif edge_weight > 0.1:  # Moderate edges
                    weight *= 1.5
                
                # Boost for center areas (subjects often in center)
                if center_weight > 0.7:  # Near center
                    weight *= 1.5
                elif center_weight > 0.4:  # Moderately centered
                    weight *= 1.2
                
                # Boost for vibrant colors (main subjects)
                if saturation > 60:  # Very vibrant
                    weight *= 2.0
                elif saturation > 40:  # Moderately vibrant
                    weight *= 1.5
                elif saturation > 20:  # Somewhat vibrant
                    weight *= 1.2
                
                # Extra boost for primary colors (often main subjects)
                if (r > g and r > b and r > 120) or (g > r and g > b and g > 120) or (b > r and b > g and b > 120):
                    weight *= 1.3
                
                # Penalize very light grays (likely background)
                if r > 200 and g > 200 and b > 200 and saturation < 30:
                    weight *= 0.3
                
                color_counter[tuple(pixel)] += weight
        
        print(f"🔍 COLOR_ANALYSIS: Found {len(color_counter)} unique colors after filtering")
        
        # Get the most common colors (look at more to ensure variety)
        most_common = color_counter.most_common(max_colors * 3)  # Look at 3x more than needed
        print(f"🔍 COLOR_ANALYSIS: Top {len(most_common)} colors: {len(most_common)}")
        
        # Debug: Show top 20 colors before filtering with detailed info
        print(f"🔍 COLOR_ANALYSIS: Top 20 colors before similarity filtering:")
        for i, (color, count) in enumerate(most_common[:20]):
            r, g, b = color
            saturation = max(r, g, b) - min(r, g, b)
            is_vibrant = saturation > 50
            is_red = r > g and r > b and r > 120
            is_green = g > r and g > b and g > 120
            is_blue = b > r and b > g and b > 120
            is_yellow = r > 200 and g > 200 and b < 100
            is_orange = r > 150 and g > 100 and g < 200 and b < 100
            color_type = "RED" if is_red else "GREEN" if is_green else "BLUE" if is_blue else "YELLOW" if is_yellow else "ORANGE" if is_orange else "OTHER"
            print(f"  {i+1}. {rgb_to_hex(color)} (weighted_count: {count}, sat: {saturation}, {color_type}) {'🌟' if is_vibrant else ''}")
        
        # Group similar colors together with more lenient threshold for greens
        print(f"🔍 COLOR_ANALYSIS: Grouping similar colors...")
        try:
            grouped_colors = group_similar_colors([color for color, count in most_common], threshold=50)
            print(f"🔍 COLOR_ANALYSIS: Grouped into {len(grouped_colors)} color families")
        except Exception as e:
            print(f"🔍 COLOR_ANALYSIS: Error in grouping: {e}")
            # Fallback: just use the most common colors without grouping
            grouped_colors = [color for color, count in most_common[:max_colors]]
            print(f"🔍 COLOR_ANALYSIS: Using fallback, {len(grouped_colors)} colors")
        
        # Debug: Show what colors we're working with
        print(f"🔍 COLOR_ANALYSIS: Top colors before grouping:")
        for i, (color, count) in enumerate(most_common[:15]):
            r, g, b = color
            is_green = g > r and g > b and g > 100  # Green is dominant and bright
            print(f"  {i+1}. {rgb_to_hex(color)} (count: {count}) {'🟢 GREEN' if is_green else ''}")
        
        # Create color groups - map each grouped color to its individual colors
        color_groups = {}
        for grouped_color in grouped_colors:
            color_groups[grouped_color] = []
            
        # Assign each original color to its closest group
        for color, count in most_common:
            min_distance = float('inf')
            closest_group = None
            for grouped_color in grouped_colors:
                distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(color, grouped_color)))
                if distance < min_distance:
                    min_distance = distance
                    closest_group = grouped_color
            
            if closest_group:
                color_groups[closest_group].append((color, count))
        
        # Recalculate frequencies for grouped colors with green boosting
        final_counter = Counter()
        for pixel in pixels:
            r, g, b = pixel
            if r + g + b > 790 or r + g + b < 10:
                continue
                
            # Find the closest grouped color
            min_distance = float('inf')
            closest_color = None
            for grouped_color in grouped_colors:
                distance = np.sqrt(sum((a - b) ** 2 for a, b in zip(pixel, grouped_color)))
                if distance < min_distance:
                    min_distance = distance
                    closest_color = grouped_color
            
                if closest_color:
                    # Boost vibrant colors and especially greens
                    weight = 1.0
                    
                    # Calculate saturation for this pixel
                    saturation = max(r, g, b) - min(r, g, b)
                    
                    # Boost highly saturated colors (main subjects)
                    if saturation > 80:
                        weight = 2.0  # 100% boost for very vibrant colors
                    elif saturation > 50:
                        weight = 1.5  # 50% boost for moderately vibrant colors
                    
                    # Extra boost for green colors (often important in logos)
                    if g > r and g > b and g > 100:  # This is a green pixel
                        weight *= 1.5  # Additional 50% boost for green pixels
                    elif g > 150:  # Bright green
                        weight *= 1.3  # Additional 30% boost for bright greens
                    
                    # Extra boost for red colors (often important in logos)
                    if r > g and r > b and r > 100:  # This is a red pixel
                        weight *= 1.4  # Additional 40% boost for red pixels
                    
                    # Extra boost for blue colors (often important in logos)
                    if b > r and b > g and b > 100:  # This is a blue pixel
                        weight *= 1.3  # Additional 30% boost for blue pixels
                    
                    final_counter[closest_color] += weight
        
        # Get the most frequent grouped colors
        final_most_common = final_counter.most_common(max_colors)
        print(f"🔍 COLOR_ANALYSIS: Final grouped colors with their individual colors:")
        for i, (grouped_color, count) in enumerate(final_most_common):
            r, g, b = grouped_color
            is_green = g > r and g > b and g > 100
            print(f"  {i+1}. GROUP: {rgb_to_hex(grouped_color)} (total count: {count}) {'🟢 GREEN' if is_green else ''}")
            individual_colors = color_groups.get(grouped_color, [])
            for j, (individual_color, individual_count) in enumerate(individual_colors[:5]):  # Show up to 5 individual colors
                r2, g2, b2 = individual_color
                is_individual_green = g2 > r2 and g2 > b2 and g2 > 100
                print(f"     - {rgb_to_hex(individual_color)} (count: {individual_count}) {'🟢' if is_individual_green else ''}")
            if len(individual_colors) > 5:
                print(f"     ... and {len(individual_colors) - 5} more colors in this group")
        
        selected_colors = final_most_common
        
        # Ensure we have the right number of colors
        if len(selected_colors) < max_colors:
            print(f"🔍 COLOR_ANALYSIS: Only got {len(selected_colors)} colors, adding more from original list...")
            # Add more colors from the original most_common list
            for color, count in most_common:
                if len(selected_colors) >= max_colors:
                    break
                # Check if this color is already in selected_colors
                if not any(selected_color == color for selected_color, _ in selected_colors):
                    selected_colors.append((color, count))
                    print(f"  Added: {rgb_to_hex(color)} (count: {count})")
        
        # Format response
        colors = []
        frequencies = []
        color_groups_detail = []
        
        for color, count in selected_colors[:max_colors]:
            colors.append(rgb_to_hex(color))
            frequencies.append(int(count))
            
            # Add detailed group information
            individual_colors = color_groups.get(color, [])
            group_detail = {
                "group_color": rgb_to_hex(color),
                "group_count": int(count),
                "individual_colors": [
                    {
                        "hex": rgb_to_hex(ind_color),
                        "count": int(ind_count)
                    }
                    for ind_color, ind_count in individual_colors
                ]
            }
            color_groups_detail.append(group_detail)
        
        # Calculate percentages
        total_pixels = sum(frequencies)
        percentages = [round((freq / total_pixels) * 100, 1) for freq in frequencies]
        
        result = {
            "colors": colors,
            "frequencies": frequencies,
            "percentages": percentages,
            "total_pixels_analyzed": total_pixels,
            "color_groups": color_groups_detail
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
        "image_url": "https://example.com/image.png",
        "max_colors": 10
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
        max_colors = request_data.get("max_colors", 10)
        max_size = request_data.get("max_size", 300)
        
        if not image_url:
            raise ValueError("image_url is required")
        
        result = analyze_image_colors(image_url, max_colors, max_size)
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
