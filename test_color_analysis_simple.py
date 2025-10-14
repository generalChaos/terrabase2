#!/usr/bin/env python3
"""
Simple test for color analysis v2 with a generated image
"""

import sys
import os
import tempfile
from PIL import Image, ImageDraw

# Add the image processor to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'image-processor'))

from src.services.color_analysis import analyze_image_to_dict

def create_test_logo():
    """Create a simple test logo"""
    img = Image.new("RGB", (200, 200), (255, 255, 255))  # White background
    
    # Add a colored circle (primary brand color)
    draw = ImageDraw.Draw(img)
    draw.ellipse([50, 50, 150, 150], fill=(255, 0, 0))  # Red circle
    
    # Add dark text
    draw.text((75, 175), "TEST", fill=(0, 0, 0))  # Black text
    
    return img

def test_with_generated_image():
    """Test with a generated test image"""
    
    print("🎨 Testing Color Analysis v2 with generated image...")
    
    try:
        # Create test image
        print("🎨 Creating test logo...")
        test_img = create_test_logo()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            test_img.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            print("🔍 Analyzing colors...")
            result = analyze_image_to_dict(tmp_path, mode="logo")
            
            print("\n✅ Analysis successful!")
            print(f"📊 K clusters: {result['data']['k']}")
            print(f"🎨 Swatches: {len(result['data']['swatches'])}")
            print(f"⏱️  Processing time: {result['data']['processing_time']:.2f}s")
            
            print("\n🎨 Color Swatches:")
            for i, swatch in enumerate(result['data']['swatches'][:5]):  # Show top 5
                print(f"  {i+1}. {swatch['hex']} - {swatch['percent']}% (L:{swatch['okL']:.2f}, C:{swatch['okC']:.2f})")
            
            print("\n🎯 Role Assignments:")
            roles = result['data']['roles']
            for role, swatch in roles.items():
                print(f"  {role}: {swatch['hex']} ({swatch['percent']}%)")
            
            print("\n📈 Confidence Scores:")
            for role, score in result['data']['confidence_scores'].items():
                print(f"  {role}: {score:.2f}")
            
            print("\n💡 Assignment Reasons:")
            for role, reason in result['data']['assignment_reasons'].items():
                print(f"  {role}: {reason}")
            
            # Verify we got the expected colors
            colors = [s['hex'] for s in result['data']['swatches']]
            has_white = any('#FFFFFF' in color or '#FFF' in color for color in colors)
            has_red = any('#FF0000' in color or '#F00' in color for color in colors)
            has_black = any('#000000' in color or '#000' in color for color in colors)
            
            print(f"\n✅ Color Detection:")
            print(f"  White background: {'✅' if has_white else '❌'}")
            print(f"  Red circle: {'✅' if has_red else '❌'}")
            print(f"  Black text: {'✅' if has_black else '❌'}")
            
            return True
            
        finally:
            # Clean up
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_with_generated_image()
    sys.exit(0 if success else 1)
