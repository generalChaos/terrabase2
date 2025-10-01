#!/usr/bin/env python3
"""
Image Enhancement Script for Compute Functions
"""
import sys
import json
import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: enhancement.py <image_path>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        # Load image
        image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("Could not load image")
        
        # Convert to PIL
        if len(image.shape) == 3:
            if image.shape[2] == 4:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA))
            else:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        else:
            pil_image = Image.fromarray(image)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(pil_image)
        pil_image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(pil_image)
        pil_image = enhancer.enhance(1.1)
        
        # Enhance color
        enhancer = ImageEnhance.Color(pil_image)
        pil_image = enhancer.enhance(1.1)
        
        # Apply unsharp mask
        pil_image = pil_image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
        
        # Save enhanced image
        output_path = f"/tmp/output/enhanced_{os.getpid()}.png"
        pil_image.save(output_path, 'PNG', optimize=True)
        
        print(json.dumps({
            "success": True,
            "output_path": output_path
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
