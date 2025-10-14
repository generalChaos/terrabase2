#!/usr/bin/env python3
"""
Test script for the new color analysis v2
"""

import sys
import os
import json
import tempfile
import requests

# Add the image processor to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'image-processor'))

from src.services.color_analysis import analyze_image_to_dict

def test_with_sample_image():
    """Test with a sample image URL"""
    
    # Test with a simple logo image
    test_url = "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop&crop=center"
    
    print("🎨 Testing Color Analysis v2...")
    print(f"📷 Image URL: {test_url}")
    
    try:
        # Download image first
        print("📥 Downloading image...")
        response = requests.get(test_url, timeout=30)
        response.raise_for_status()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        
        try:
            result = analyze_image_to_dict(tmp_path, mode="logo")
        finally:
            # Clean up
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        
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
        
        return True
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return False

if __name__ == "__main__":
    success = test_with_sample_image()
    sys.exit(0 if success else 1)
