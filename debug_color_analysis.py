#!/usr/bin/env python3
"""
Debug color analysis
"""

import sys
import os
import tempfile
import logging
from PIL import Image, ImageDraw
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Add the image processor to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'image-processor'))

from src.services.color_analysis import analyze_image

def create_simple_test():
    """Create a very simple test image"""
    # Create a 100x100 image with just two colors
    img = Image.new("RGB", (100, 100), (255, 255, 255))  # White background
    
    # Add a red square
    for y in range(25, 75):
        for x in range(25, 75):
            img.putpixel((x, y), (255, 0, 0))
    
    return img

def debug_pixels():
    """Debug the pixel processing"""
    print("🔍 Creating simple test image...")
    img = create_simple_test()
    
    print(f"🔍 Image size: {img.size}, mode: {img.mode}")
    
    # Convert to array
    arr = np.asarray(img)
    print(f"🔍 Array shape: {arr.shape}, dtype: {arr.dtype}")
    
    # Check if it's RGBA
    if img.mode == 'RGBA':
        print("🔍 RGBA mode detected")
        alpha_channel = arr[..., 3]
        mask = alpha_channel > 0
        pixels = arr[..., :3][mask]
    else:
        print("🔍 RGB mode detected")
        pixels = arr.reshape(-1, 3)
    
    print(f"🔍 Pixels shape: {pixels.shape}, dtype: {pixels.dtype}")
    print(f"🔍 Pixels sample: {pixels[:5]}")
    
    # Test PIL conversion with reshaping
    print("🔍 Testing PIL conversion...")
    try:
        # Reshape to 3D for PIL
        height = int(np.sqrt(len(pixels)))
        width = len(pixels) // height
        
        if height * width != len(pixels):
            # Pad if needed
            target_size = height * width
            if target_size < len(pixels):
                height += 1
                target_size = height * width
            
            padding_needed = target_size - len(pixels)
            if padding_needed > 0:
                padding = np.tile(pixels[-1:], (padding_needed, 1))
                pixels_padded = np.vstack([pixels, padding])
            else:
                pixels_padded = pixels
        else:
            pixels_padded = pixels
        
        # Reshape to 3D
        img_3d = pixels_padded[:height*width].reshape(height, width, 3)
        print(f"🔍 Reshaped to: {img_3d.shape}")
        
        pil_img = Image.fromarray(img_3d, "RGB")
        print(f"🔍 PIL image size: {pil_img.size}, mode: {pil_img.mode}")
        
        # Test quantization
        quantized = pil_img.quantize(colors=3, method=Image.MEDIANCUT)
        print(f"🔍 Quantized successfully: {quantized.size}")
        
    except Exception as e:
        print(f"❌ PIL conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = debug_pixels()
    if success:
        print("\n✅ Basic pixel processing works!")
        
        # Now test the full analysis
        print("\n🔍 Testing full analysis...")
        img = create_simple_test()
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            result = analyze_image(tmp_path, mode="logo")
            print("✅ Full analysis successful!")
            print(f"Swatches: {len(result.swatches)}")
            for i, swatch in enumerate(result.swatches):
                print(f"  {i+1}. {swatch.hex} - {swatch.percent}%")
        except Exception as e:
            print(f"❌ Full analysis failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    else:
        print("❌ Basic pixel processing failed!")
        sys.exit(1)
