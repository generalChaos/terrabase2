#!/usr/bin/env python3
"""
AI Background Removal Script for Compute Functions
"""
import sys
import json
import os
import cv2
import numpy as np
import requests
from io import BytesIO
from PIL import Image

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: background_removal.py <image_url> <model_path>"}))
        sys.exit(1)
    
    image_url = sys.argv[1]
    model_path = sys.argv[2]
    
    try:
        # Download image
        response = requests.get(image_url, timeout=30)
        image_data = BytesIO(response.content)
        image = Image.open(image_data)
        
        # Convert to OpenCV
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # AI background removal using rembg
        try:
            from rembg import remove, new_session
            session = new_session('u2net')
            result = remove(image, session=session)
            
            # Save result
            output_path = f"/tmp/output/bg_removed_{os.getpid()}.png"
            result.save(output_path, 'PNG')
            
        except ImportError:
            # Fallback to traditional method
            output_path = traditional_background_removal(cv_image)
        
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

def traditional_background_removal(cv_image):
    """Fallback traditional background removal"""
    # Convert to grayscale
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Create mask
    _, mask = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY)
    mask_inv = cv2.bitwise_not(mask)
    
    # Create RGBA image
    result = cv2.cvtColor(cv_image, cv2.COLOR_BGR2BGRA)
    result[:, :, 3] = mask_inv
    
    # Save
    output_path = f"/tmp/output/traditional_bg_removed_{os.getpid()}.png"
    cv2.imwrite(output_path, result)
    
    return output_path

if __name__ == "__main__":
    main()
