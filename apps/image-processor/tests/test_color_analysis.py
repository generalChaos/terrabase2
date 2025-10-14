"""
Test suite for color analysis module
Tests synthetic images and real-world scenarios
"""

import pytest
import numpy as np
from PIL import Image
import tempfile
import os
from src.services.color_analysis import analyze_image, _rgb_to_hex, _to_rgb_tuple

def make_solid(w, h, hex_color):
    """Create a solid color image"""
    rgb = tuple(int(hex_color[i:i+2], 16) for i in (1, 3, 5))
    return Image.new("RGB", (w, h), rgb)

def make_checkerboard(size, color1, color2):
    """Create a checkerboard pattern"""
    img = Image.new("RGB", (size, size), color1)
    for y in range(0, size, size//2):
        for x in range(0, size, size//2):
            if ((x + y) // (size//2)) % 2 == 0:
                img.paste(make_solid(size//2, size//2, color1), (x, y))
            else:
                img.paste(make_solid(size//2, size//2, color2), (x, y))
    return img

def make_stripes(width, height, colors):
    """Create horizontal stripes with given colors"""
    img = Image.new("RGB", (width, height))
    stripe_height = height // len(colors)
    for i, color in enumerate(colors):
        y_start = i * stripe_height
        y_end = (i + 1) * stripe_height if i < len(colors) - 1 else height
        img.paste(make_solid(width, y_end - y_start, color), (0, y_start))
    return img

def make_logo_pattern():
    """Create a logo-like pattern: white background + colored shape + dark text"""
    img = Image.new("RGB", (200, 200), (255, 255, 255))  # White background
    
    # Add a colored circle (primary brand color)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.ellipse([50, 50, 150, 150], fill=(255, 0, 0))  # Red circle
    
    # Add dark text
    draw.text((75, 175), "LOGO", fill=(0, 0, 0))  # Black text
    
    return img

def make_gradient_sky():
    """Create a gradient sky with ground (photo-like)"""
    img = Image.new("RGB", (300, 200))
    
    # Sky gradient (light blue to white)
    for y in range(100):
        blue_intensity = int(255 - (y * 0.5))
        for x in range(300):
            img.putpixel((x, y), (blue_intensity, blue_intensity, 255))
    
    # Ground (green)
    for y in range(100, 200):
        for x in range(300):
            img.putpixel((x, y), (0, 128, 0))
    
    return img

class TestColorAnalysis:
    
    def test_checkerboard_two_colors(self):
        """Test checkerboard with two colors - should get ~50/50 split"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_checkerboard(200, "#FFFFFF", "#000000")
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # Should have exactly 2 swatches
            assert len(result.swatches) == 2
            
            # Proportions should be roughly equal
            percents = [s.percent for s in result.swatches]
            assert abs(percents[0] - percents[1]) < 10  # Within 10% difference
            
            # Should have good contrast
            assert result.swatches[0].contrast_white > 10
            assert result.swatches[1].contrast_black > 10
            
            os.unlink(tmp.name)
    
    def test_triplet_stripes(self):
        """Test three equal stripes - should get ~33/33/33 split"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_stripes(300, 300, ["#FF0000", "#00FF00", "#0000FF"])
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # Should have 3 swatches
            assert len(result.swatches) >= 3
            
            # Top 3 should be roughly equal
            percents = [s.percent for s in result.swatches[:3]]
            assert all(abs(p - 33.33) < 15 for p in percents)  # Within 15% of 33.33%
            
            os.unlink(tmp.name)
    
    def test_logo_pattern_background_detection(self):
        """Test logo pattern - should detect white background"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_logo_pattern()
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # Should detect background candidate
            assert result.background_candidate is not None
            
            # Background should be white or very light
            bg_swatch = result.roles.background
            assert bg_swatch.okL >= 0.8  # Very light
            
            # Primary should be the red circle
            primary_swatch = result.roles.primary
            assert primary_swatch.hex == "#FF0000" or primary_swatch.okC > 0.1  # Should be saturated
            
            os.unlink(tmp.name)
    
    def test_gradient_sky_photo_mode(self):
        """Test photo-like image - should handle gradients well"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_gradient_sky()
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="photo")
            
            # Should have reasonable number of swatches
            assert 3 <= len(result.swatches) <= 8
            
            # Should have sky and ground colors
            colors = [s.hex for s in result.swatches]
            has_blue = any("#" in color and "FF" in color for color in colors)  # Some blue
            has_green = any("#" in color and "00" in color and "80" in color for color in colors)  # Some green
            
            # At least one should be detected (depending on quantization)
            assert has_blue or has_green
            
            os.unlink(tmp.name)
    
    def test_single_color_image(self):
        """Test single color image - should return one swatch"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_solid(100, 100, "#FF5733")
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # Should have exactly 1 swatch
            assert len(result.swatches) == 1
            assert result.swatches[0].percent == 100.0
            assert result.swatches[0].hex == "#FF5733"
            
            os.unlink(tmp.name)
    
    def test_transparent_png(self):
        """Test PNG with transparency - should ignore transparent pixels"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            # Create RGBA image with transparent background and colored shape
            img = Image.new("RGBA", (100, 100), (0, 0, 0, 0))  # Transparent
            img.paste((255, 0, 0, 255), (25, 25, 75, 75))  # Red square
            
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # Should only have red color, not transparent
            assert len(result.swatches) == 1
            assert result.swatches[0].hex == "#FF0000"
            
            os.unlink(tmp.name)
    
    def test_role_assignment_confidence(self):
        """Test that role assignments have confidence scores"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_logo_pattern()
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            # All roles should be assigned
            assert result.roles.background is not None
            assert result.roles.surface is not None
            assert result.roles.primary is not None
            assert result.roles.accent is not None
            
            # Should have confidence scores
            assert len(result.roles.confidence_scores) == 4
            assert all(0 <= score <= 1 for score in result.roles.confidence_scores.values())
            
            # Should have assignment reasons
            assert len(result.roles.assignment_reasons) == 4
            assert all(isinstance(reason, str) for reason in result.roles.assignment_reasons.values())
            
            os.unlink(tmp.name)
    
    def test_oklch_values(self):
        """Test that OKLCH values are reasonable"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_solid(100, 100, "#FF0000")
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            swatch = result.swatches[0]
            
            # OKLCH values should be in valid ranges
            assert 0 <= swatch.okL <= 1
            assert 0 <= swatch.okC <= 0.4  # Practical chroma range
            assert 0 <= swatch.okh <= 360
            
            # Red should have high chroma
            assert swatch.okC > 0.1
            
            os.unlink(tmp.name)
    
    def test_contrast_calculations(self):
        """Test WCAG contrast calculations"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            img = make_solid(100, 100, "#000000")
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo")
            
            swatch = result.swatches[0]
            
            # Black should have high contrast with white, low with black
            assert swatch.contrast_white > 10
            assert swatch.contrast_black == 1.0  # Same color
            
            os.unlink(tmp.name)
    
    def test_minimum_cluster_filtering(self):
        """Test that tiny clusters are filtered out"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            # Create image with one dominant color and many tiny colored pixels
            img = Image.new("RGB", (100, 100), (255, 0, 0))  # Red background
            
            # Add tiny colored pixels
            for i in range(10):
                x, y = np.random.randint(0, 100, 2)
                img.putpixel((x, y), (0, 255, 0))  # Green pixels
            
            img.save(tmp.name)
            
            result = analyze_image(tmp.name, mode="logo", min_cluster_pct=1.0)
            
            # Should filter out tiny green clusters
            assert len(result.swatches) == 1
            assert result.swatches[0].hex == "#FF0000"
            
            os.unlink(tmp.name)

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
