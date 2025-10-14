'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ColorPaletteDemo } from '@/components/ColorPaletteDemo';
import { ThemedContainer, ThemedButton, ThemedText } from '@/components/ThemedContainer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { type AnalyzedColor, generateUIPalette, type ColorAnalysis, analyzeImageColors } from '@/lib/colorPaletteGenerator';

// Helper function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Helper function to get color name (completely rewritten for accuracy)
function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb;
  
  // Calculate saturation and lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const lightness = (max + min) / 2;
  
  // Skip very dark or very light colors
  if (lightness < 30) return 'Dark';
  if (lightness > 240) return 'Light';
  
  // Skip low saturation colors (grays) - but be more lenient for very dark colors
  if (saturation < 20) return 'Gray';
  if (saturation < 40 && lightness > 100) return 'Gray'; // Light grays with low saturation
  
  // Convert to HSV for better color detection
  const h = getHue(r, g, b);
  const s = saturation / 255;
  const v = max / 255;
  
  // Yellow: High red + high green, low blue
  if (r > 200 && g > 200 && b < 100) return 'Yellow';
  
  // Orange: High red, medium green, low blue
  if (r > 180 && g > 100 && g < 200 && b < 100) return 'Orange';
  
  // Red: High red, low green and blue
  if (r > 150 && g < 100 && b < 100) return 'Red';
  
  // Green: High green, low red and blue
  if (g > 150 && r < 100 && b < 100) return 'Green';
  
  // Cyan: High green + high blue, low red
  if (g > 200 && b > 200 && r < 100) return 'Cyan';
  
  // Blue: High blue, low red and green
  if (b > 150 && r < 100 && g < 100) return 'Blue';
  
  // Purple: High blue + high red, low green
  if (b > 150 && r > 150 && g < 100) return 'Purple';
  
  // Magenta: High red + high blue, low green
  if (r > 200 && b > 200 && g < 100) return 'Magenta';
  
  // Pink: High red, medium green and blue
  if (r > 200 && g > 150 && g < 200 && b > 150 && b < 200) return 'Pink';
  
  // Teal: Medium green + medium blue, low red, but with higher saturation
  if (g > 100 && g < 200 && b > 100 && b < 200 && r < 100 && saturation > 50) return 'Teal';
  
  // Brown: Medium red, low green, very low blue
  if (r > 100 && r < 200 && g > 50 && g < 150 && b < 100 && r > g && g > b) return 'Brown';
  
  // Grayish-blue: Low saturation blue-ish colors
  if (b > g && b > r && saturation < 50 && lightness < 150) return 'Grayish-Blue';
  
  // Use HSV-based detection for edge cases
  if (h >= 0 && h < 30) return 'Red';
  if (h >= 30 && h < 60) return 'Orange';
  if (h >= 60 && h < 90) return 'Yellow';
  if (h >= 90 && h < 150) return 'Green';
  if (h >= 150 && h < 210) return 'Cyan';
  if (h >= 210 && h < 270) return 'Blue';
  if (h >= 270 && h < 330) return 'Purple';
  if (h >= 330 && h < 360) return 'Magenta';
  
  return 'Unknown';
}

// Helper function to calculate hue
function getHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) return 0;
  
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  
  return (hue * 60 + 360) % 360;
}

// Helper function to calculate color distance
function getColorDistance(color1: [number, number, number], color2: [number, number, number]): number {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Helper function to find the best representative color from a group
function findBestRepresentativeColor(group: Array<{hex: string, count: number}>, targetColorType: string): {hex: string, count: number} {
  // Define target RGB values for each color type
  const targetColors: Record<string, [number, number, number]> = {
    'Red': [255, 0, 0],
    'Green': [0, 255, 0],
    'Blue': [0, 0, 255],
    'Yellow': [255, 255, 0],
    'Orange': [255, 165, 0],
    'Purple': [128, 0, 128],
    'Pink': [255, 192, 203],
    'Cyan': [0, 255, 255],
    'Magenta': [255, 0, 255],
    'Lime': [0, 255, 0],
    'Teal': [0, 128, 128],
    'Brown': [165, 42, 42],
    'White': [255, 255, 255],
    'Black': [0, 0, 0],
    'Gray': [128, 128, 128],
    'Dark': [50, 50, 50],
    'Light': [240, 240, 240]
  };

  const targetRgb = targetColors[targetColorType] || [128, 128, 128];
  
  let bestColor = group[0];
  let minDistance = Infinity;
  
  for (const color of group) {
    const colorRgb = hexToRgb(color.hex);
    const distance = getColorDistance(colorRgb, targetRgb);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestColor = color;
    }
  }
  
  return bestColor;
}

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1));
  const m = lNorm - c / 2;
  
  let r, g, b;
  
  if (hNorm < 1/6) {
    r = c; g = x; b = 0;
  } else if (hNorm < 2/6) {
    r = x; g = c; b = 0;
  } else if (hNorm < 3/6) {
    r = 0; g = c; b = x;
  } else if (hNorm < 4/6) {
    r = 0; g = x; b = c;
  } else if (hNorm < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const rFinal = Math.round((r + m) * 255);
  const gFinal = Math.round((g + m) * 255);
  const bFinal = Math.round((b + m) * 255);
  
  return `#${rFinal.toString(16).padStart(2, '0')}${gFinal.toString(16).padStart(2, '0')}${bFinal.toString(16).padStart(2, '0')}`;
}

// Helper function to get analogous colors
function getAnalogousColors(hex: string, count: number = 3): string[] {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb;
  const hue = getHue(r, g, b);
  
  const colors: string[] = [];
  const step = 30; // 30 degrees apart
  
  for (let i = 0; i < count; i++) {
    const newHue = (hue + (i - Math.floor(count / 2)) * step + 360) % 360;
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const lightness = ((max + min) / 2) * 100;
    const saturation = max === min ? 0 : ((max - min) / (1 - Math.abs(2 * lightness / 100 - 1))) * 100;
    
    colors.push(hslToHex(newHue, saturation, lightness));
  }
  
  return colors;
}

// Helper function to get triadic colors
function getTriadicColors(hex: string): string[] {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb;
  const hue = getHue(r, g, b);
  
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = ((max + min) / 2) * 100;
  const saturation = max === min ? 0 : ((max - min) / (1 - Math.abs(2 * lightness / 100 - 1))) * 100;
  
  const triadic1 = (hue + 120) % 360;
  const triadic2 = (hue + 240) % 360;
  
  // Boost saturation and adjust lightness for more vibrant triadic colors
  const boostedSaturation = Math.min(saturation * 1.2, 100); // 20% more saturated
  const adjustedLightness = Math.max(lightness * 0.9, 30); // Slightly darker for more contrast
  
  return [
    hslToHex(triadic1, boostedSaturation, adjustedLightness),
    hslToHex(triadic2, boostedSaturation, adjustedLightness)
  ];
}

// Helper function to create color type palette
function createColorTypePalette(colors: Array<{hex: string, rgb: [number, number, number], percentage: number, name?: string}>, colorGroups?: Array<{group_color: string, group_count: number, individual_colors: Array<{hex: string, count: number}>}>): Array<{type: string, hex: string, percentage: number, count: number}> {
  const typeMap: Record<string, Array<{hex: string, count: number}>> = {};
  
  // Group colors by their detected type
  colors.forEach((color, index) => {
    // Use the improved color name detection
    const colorType = getColorName(color.hex);
    
    console.log(`Color ${color.hex} detected as type: ${colorType}`);
    
    if (!typeMap[colorType]) {
      typeMap[colorType] = [];
    }
    
    // If we have color groups, use the individual colors from the group
    if (colorGroups && colorGroups[index]) {
      typeMap[colorType].push(...colorGroups[index].individual_colors);
    } else {
      // Fallback to the main color
      typeMap[colorType].push({ hex: color.hex, count: Math.round(color.percentage * 100) });
    }
  });
  
  console.log('Color type groups:', Object.keys(typeMap));
  
  // Find the best representative color for each type
  const palette: Array<{type: string, hex: string, percentage: number, count: number}> = [];
  
  Object.entries(typeMap).forEach(([type, colors]) => {
    if (colors.length > 0) {
      const bestColor = findBestRepresentativeColor(colors, type);
      const totalCount = colors.reduce((sum, color) => sum + color.count, 0);
      const percentage = (bestColor.count / totalCount) * 100;
      
      palette.push({
        type,
        hex: bestColor.hex,
        percentage: Math.round(percentage * 10) / 10,
        count: bestColor.count
      });
    }
  });
  
  // Sort by percentage (most common first), but prioritize named colors over Unknown
  return palette.sort((a, b) => {
    // If one is Unknown and the other isn't, prioritize the named color
    if (a.type === 'Unknown' && b.type !== 'Unknown') return 1;
    if (b.type === 'Unknown' && a.type !== 'Unknown') return -1;
    
    // Otherwise sort by percentage
    return b.percentage - a.percentage;
  });
}

interface ColorAnalyzerTest {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: {
    colors: Array<{
      hex: string;
      rgb: [number, number, number];
      percentage: number;
      name?: string;
    }>;
    dominant_color: string;
    color_palette: string[];
    color_groups?: Array<{
      group_color: string;
      group_count: number;
      individual_colors: Array<{
        hex: string;
        count: number;
      }>;
    }>;
    // V2 properties
    systematic_analysis?: {
      k_clusters: number;
      processing_time: number;
      reconstruction_error: number;
      background_candidate?: [number, number, number];
    };
    roles?: {
      background: { hex: string; percent: number };
      surface: { hex: string; percent: number };
      primary: { hex: string; percent: number };
      accent: { hex: string; percent: number };
    };
    confidence_scores?: {
      background: number;
      surface: number;
      primary: number;
      accent: number;
    };
    assignment_reasons?: {
      background: string;
      surface: string;
      primary: string;
      accent: string;
    };
  };
  error?: string;
}

// Global request counter for debugging
let globalRequestCounter = 0;

export default function ColorAnalyzerPage() {
  // Generate unique component ID for debugging
  const componentId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  console.log(`🔍 [${componentId}] ColorAnalyzerPage component rendering`);
  
  // Color Analyzer Test State
  const [colorAnalyzerTest, setColorAnalyzerTest] = useState<ColorAnalyzerTest>({
    status: 'idle'
  });
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop&crop=center');
  const [maxColors, setMaxColors] = useState(15);
  const [maxSize, setMaxSize] = useState(300);
  const [analyzedColors, setAnalyzedColors] = useState<AnalyzedColor[]>([]);
  const [structuredAnalysis, setStructuredAnalysis] = useState<ColorAnalysis | null>(null);
  const hasRunInitialAnalysis = useRef(false);

  // Auto-run analysis on page load
  useEffect(() => {
    console.log(`🔍 [${componentId}] useEffect running, hasRunInitialAnalysis:`, hasRunInitialAnalysis.current, 'imageUrl:', imageUrl);
    if (imageUrl && !hasRunInitialAnalysis.current) {
      console.log(`🔍 [${componentId}] Running initial analysis...`);
      hasRunInitialAnalysis.current = true;
      testColorAnalyzer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, imageUrl]); // testColorAnalyzer is defined after this useEffect

  // Handle sample image selection
  const handleSampleImage = (url: string) => {
    console.log(`🔍 [${componentId}] handleSampleImage called with URL:`, url);
    setImageUrl(url);
    // Small delay to ensure state is updated before running analysis
    setTimeout(() => {
      testColorAnalyzer();
    }, 200);
  };

  // Color Analyzer Test Function
  const testColorAnalyzer = useCallback(async () => {
    globalRequestCounter++;
    console.log(`🔍 [${componentId}] testColorAnalyzer called (request #${globalRequestCounter}), current status:`, colorAnalyzerTest.status);
    
    if (!imageUrl.trim()) {
      setColorAnalyzerTest({
        status: 'error',
        error: 'Please enter an image URL'
      });
      return;
    }

    // Prevent multiple simultaneous requests
    if (colorAnalyzerTest.status === 'loading') {
      console.log(`⚠️ [${componentId}] Request already in progress, skipping...`);
      return;
    }

    console.log(`🔍 [${componentId}] Starting color analysis for:`, imageUrl);
    setColorAnalyzerTest({ status: 'loading' });

    try {
          const response = await fetch('/api/color-analyzer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: imageUrl,
              max_colors: maxColors,
              max_size: maxSize
            })
          });

      const result = await response.json();

      if (result.success) {
        setColorAnalyzerTest({
          status: 'success',
          result: result.data
        });
        
        // Convert to AnalyzedColor format for palette generation with enhanced analysis
        const colors: AnalyzedColor[] = (result.data.colors || []).map((color: any, index: number) => {
          // Use the improved color name detection from the frontend
          const detectedType = getColorName(color.hex);
          
          console.log(`🔍 CONVERSION: Color ${color.hex} -> type: ${detectedType} (was: ${color.name})`);
          
          // Calculate enhanced properties
          const rgb = hexToRgb(color.hex);
          const [r, g, b] = rgb;
          
          // Calculate HSL
          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const lightness = ((max + min) / 2) * 100;
          const saturation = max === min ? 0 : ((max - min) / (1 - Math.abs(2 * lightness / 100 - 1))) * 100;
          
          // Calculate perceived brightness
          const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
          
          // Calculate complementary color
          const hue = getHue(r, g, b);
          const complementaryHue = (hue + 180) % 360;
          const complementary = hslToHex(complementaryHue, saturation, lightness);
          
          return {
            type: detectedType,
            hex: color.hex,
            percentage: color.percentage,
            count: Math.round(color.percentage * 100),
            samples: (result.data.color_groups?.[index]?.individual_colors || []).map((c: any) => c.hex) || [color.hex],
            lightness: Math.round(lightness),
            brightness: Math.round(brightness),
            saturation: Math.round(saturation),
            complementary: complementary,
            analogous: getAnalogousColors(color.hex, 3),
            triadic: getTriadicColors(color.hex)
          };
        });
        
        console.log('🔍 CONVERSION: Final analyzed colors:', colors);
        setAnalyzedColors(colors);
        
        // Generate structured analysis using V2 API
        const palette = await generateUIPalette(imageUrl);
        console.log('🔍 STRUCTURED: Generated palette with V2 analysis');
        
        // Extract structured analysis from the palette generation process
        // We need to call the analysis function directly to get the structured data
        const analysis = analyzeImageColors(colors);
        setStructuredAnalysis(analysis);
      } else {
        setColorAnalyzerTest({
          status: 'error',
          error: result.error || 'Color analysis failed'
        });
      }
    } catch (error) {
      setColorAnalyzerTest({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [componentId, imageUrl, colorAnalyzerTest.status, maxColors, maxSize]);

  return (
    <ThemeProvider>
      <ThemedContainer variant="page" className="py-8">
        <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <ThemedText variant="primary" size="xl" className="text-4xl font-bold mb-2 block">
            Color Analyzer
          </ThemedText>
          <ThemedText variant="secondary" size="lg" className="mb-4 block">
            Upload any image and extract its dominant colors with detailed analysis
          </ThemedText>
          
          {/* Sample Images */}
          <div className="flex flex-wrap justify-center gap-3">
            <ThemedText variant="secondary" size="sm" className="mr-2">Try these sample images:</ThemedText>
            <ThemedButton
              onClick={() => handleSampleImage('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop&crop=center')}
              variant="primary"
              size="sm"
              className="rounded-full"
            >
              Colorful Abstract
            </ThemedButton>
            <ThemedButton
              onClick={() => handleSampleImage('https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center')}
              variant="secondary"
              size="sm"
              className="rounded-full"
            >
              Nature Landscape
            </ThemedButton>
            <ThemedButton
              onClick={() => handleSampleImage('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center')}
              variant="accent"
              size="sm"
              className="rounded-full"
            >
              Art Painting
            </ThemedButton>
            <ThemedButton
              onClick={() => handleSampleImage('https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop&crop=center')}
              variant="error"
              size="sm"
              className="rounded-full"
            >
              Logo Design
            </ThemedButton>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Input and Image Preview */}
          <div className="space-y-6">
            {/* Input Form */}
            <ThemedContainer variant="card" className="p-6">
              <ThemedText variant="primary" size="lg" className="text-xl font-bold mb-4 block">
                Analyze Colors
              </ThemedText>
              
              <div className="space-y-4">
                <div>
                  <ThemedText variant="primary" size="sm" className="block font-medium mb-2">
                    Image URL
                  </ThemedText>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--surface, #F1F5F9)', 
                      borderColor: 'var(--border, #E2E8F0)',
                      color: 'var(--text-primary, #1E293B)'
                    }}
                  />
                </div>
                
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Colors (1-50)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={maxColors}
                        onChange={(e) => setMaxColors(parseInt(e.target.value) || 15)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Image Size (100-1000px)
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="1000"
                        value={maxSize}
                        onChange={(e) => setMaxSize(parseInt(e.target.value) || 300)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher values = more accurate colors but slower processing
                      </p>
                    </div>
                
                <ThemedButton
                  onClick={testColorAnalyzer}
                  disabled={colorAnalyzerTest.status === 'loading'}
                  variant={colorAnalyzerTest.status === 'success' ? 'success' : 
                          colorAnalyzerTest.status === 'error' ? 'error' : 'primary'}
                  size="lg"
                  className="w-full"
                >
                  {colorAnalyzerTest.status === 'loading' ? 'Analyzing...' : 'Analyze Colors'}
                </ThemedButton>
              </div>
            </ThemedContainer>

            {/* Image Preview */}
            {imageUrl && (
              <ThemedContainer variant="card" className="p-6">
                <ThemedText variant="primary" size="lg" className="text-lg font-bold mb-4 block">
                  Image Preview
                </ThemedText>
                <ThemedContainer variant="surface" className="p-4">
                  <div className="relative">
                    <Image 
                      src={imageUrl} 
                      alt="Image being analyzed"
                      width={400}
                      height={300}
                      className="max-w-full max-h-96 mx-auto rounded shadow-sm border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500 py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium">Failed to load image</p>
                        <p className="text-sm text-gray-400 break-all max-w-md">{imageUrl}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {imageUrl}
                  </div>
                </ThemedContainer>
              </ThemedContainer>
            )}
          </div>

          {/* Right Side - Results */}
          <div className="space-y-6">
            {/* Color Analysis Results */}
            {colorAnalyzerTest.status !== 'idle' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Color Analysis Results</h3>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    colorAnalyzerTest.status === 'success' 
                      ? 'bg-green-100 text-green-800'
                      : colorAnalyzerTest.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : colorAnalyzerTest.status === 'loading'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {colorAnalyzerTest.status}
                  </span>
                </div>
                
                {colorAnalyzerTest.error && (
                  <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded">
                    Error: {colorAnalyzerTest.error}
                  </div>
                )}
                
                {colorAnalyzerTest.result && (
                  <div className="space-y-6">
                    {/* Dominant Color */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 mb-3">Dominant Color</h4>
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: colorAnalyzerTest.result.dominant_color }}
                        ></div>
                        <div>
                          <div className="text-xl font-mono font-bold">{colorAnalyzerTest.result.dominant_color}</div>
                          <div className="text-sm text-gray-500">Most frequent color in the image</div>
                        </div>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 mb-3">Color Palette</h4>
                      <div className="flex flex-wrap gap-3">
                        {(colorAnalyzerTest.result.color_palette || []).map((color, index) => (
                          <div key={index} className="flex flex-col items-center space-y-1">
                            <div 
                              className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Color Type Palette */}
                    {colorAnalyzerTest.result.colors && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-700 mb-3">Color Type Palette</h4>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <div className="flex flex-wrap gap-3">
                            {createColorTypePalette(colorAnalyzerTest.result.colors || [], colorAnalyzerTest.result.color_groups || []).map((colorType, index) => (
                              <div key={index} className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border shadow-sm">
                                <div 
                                  className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm"
                                  style={{ backgroundColor: colorType.hex }}
                                ></div>
                                <div>
                                  <div className="font-semibold text-gray-900">{colorType.type}</div>
                                  <div className="text-sm font-mono text-gray-600">{colorType.hex}</div>
                                  <div className="text-xs text-gray-500">{colorType.percentage.toFixed(1)}% of type</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Note:</strong> Each color type shows the most representative color from its group, selected based on how close it is to the ideal color for that type.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* New V2 Color Analysis */}
                    {colorAnalyzerTest.result?.systematic_analysis && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-700 mb-3">Systematic Color Analysis (V2)</h4>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{colorAnalyzerTest.result.systematic_analysis.k_clusters}</div>
                              <div className="text-sm text-gray-600">Clusters</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{colorAnalyzerTest.result.colors?.length || 0}</div>
                              <div className="text-sm text-gray-600">Swatches</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{colorAnalyzerTest.result.systematic_analysis.processing_time?.toFixed(2)}s</div>
                              <div className="text-sm text-gray-600">Processing Time</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{colorAnalyzerTest.result.systematic_analysis.reconstruction_error?.toFixed(2)}</div>
                              <div className="text-sm text-gray-600">Reconstruction Error</div>
                            </div>
                          </div>
                          
                          {/* Role Assignments */}
                          {colorAnalyzerTest.result.roles && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-3">Role Assignments</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(colorAnalyzerTest.result.roles || {}).map(([role, swatch]: [string, any]) => (
                                  <div key={role} className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded border border-blue-200"
                                      style={{ backgroundColor: swatch.hex }}
                                    />
                                    <div>
                                      <div className="text-sm font-medium text-blue-800 capitalize">{role}</div>
                                      <div className="text-sm text-blue-700">{swatch.hex} ({swatch.percent}%)</div>
                                      {colorAnalyzerTest.result?.confidence_scores && (
                                        <div className="text-xs text-blue-600">
                                          Confidence: {((colorAnalyzerTest.result.confidence_scores as any)[role] * 100).toFixed(0)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Assignment Reasons */}
                              {colorAnalyzerTest.result.assignment_reasons && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-medium text-blue-800 mb-2">Assignment Reasons</h6>
                                  <div className="text-xs text-blue-700 space-y-1">
                                    {Object.entries(colorAnalyzerTest.result.assignment_reasons || {}).map(([role, reason]) => (
                                      <div key={role}>
                                        <span className="font-medium capitalize">{role}:</span> {reason}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Color Analysis */}
                    {analyzedColors.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-700 mb-3">Enhanced Color Analysis</h4>
                        <div className="space-y-4">
                          {(analyzedColors || []).slice(0, 5).map((color, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center gap-4 mb-3">
                                <div 
                                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{color.type} - {color.hex}</div>
                                  <div className="text-sm text-gray-600">
                                    Lightness: {color.lightness}% | Brightness: {color.brightness} | Saturation: {color.saturation}%
                                  </div>
                                </div>
                              </div>
                              
                              {/* Complementary Colors */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">Complementary</div>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded border border-gray-200"
                                      style={{ backgroundColor: color.complementary }}
                                    />
                                    <span className="text-sm text-gray-600">{color.complementary}</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">Analogous</div>
                                  <div className="flex gap-1">
                                    {(color.analogous || []).map((analog, i) => (
                                      <div key={i} className="flex flex-col items-center">
                                        <div 
                                          className="w-6 h-6 rounded border border-gray-200"
                                          style={{ backgroundColor: analog }}
                                        />
                                        <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-2">Triadic</div>
                                  <div className="flex gap-1">
                                    {(color.triadic || []).map((triad, i) => (
                                      <div key={i} className="flex flex-col items-center">
                                        <div 
                                          className="w-6 h-6 rounded border border-gray-200"
                                          style={{ backgroundColor: triad }}
                                        />
                                        <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Colors */}
                    {colorAnalyzerTest.result.colors && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-700 mb-3">Detailed Color Analysis</h4>
                        <div className="space-y-4">
                          {(colorAnalyzerTest.result.colors || []).map((color, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              {/* Main Group Color */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-4">
                                  <div 
                                    className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm"
                                    style={{ backgroundColor: color.hex }}
                                  ></div>
                                  <div>
                                    <div className="text-lg font-mono font-bold">{color.hex}</div>
                                    <div className="text-sm text-gray-500">
                                      RGB({color.rgb.join(', ')})
                                    </div>
                                    {color.name && (
                                      <div className="text-sm text-gray-600">{color.name}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">{color.percentage.toFixed(1)}%</div>
                                  <div className="text-sm text-gray-500">of image</div>
                                </div>
                              </div>
                              
                              {/* Individual Colors in Group */}
                              {colorAnalyzerTest.result?.color_groups && colorAnalyzerTest.result.color_groups[index] && (
                                <div className="ml-16">
                                  <div className="text-sm text-gray-600 mb-2">
                                    Individual colors in this group ({(colorAnalyzerTest.result.color_groups?.[index]?.individual_colors || []).length}):
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(colorAnalyzerTest.result.color_groups?.[index]?.individual_colors || []).slice(0, 8).map((indColor: {hex: string, count: number}, indIndex: number) => (
                                      <div key={indIndex} className="flex items-center space-x-2 bg-white px-3 py-2 rounded border shadow-sm">
                                        <div 
                                          className="w-4 h-4 rounded border border-gray-300"
                                          style={{ backgroundColor: indColor.hex }}
                                        ></div>
                                        <span className="text-xs font-mono">{indColor.hex}</span>
                                        <span className="text-xs text-gray-500">({indColor.count})</span>
                                      </div>
                                    ))}
                                    {colorAnalyzerTest.result.color_groups[index].individual_colors.length > 8 && (
                                      <div className="text-xs text-gray-500 px-3 py-2 bg-white rounded border">
                                        +{colorAnalyzerTest.result.color_groups[index].individual_colors.length - 8} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-700 mb-3">Raw Response</h4>
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(colorAnalyzerTest.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color Palette Generator */}
      {analyzedColors.length > 0 && (
        <div className="mt-8">
          <ColorPaletteDemo 
            analyzedColors={analyzedColors}
            onPaletteGenerated={(palette) => {
              console.log('Generated palette:', palette);
            }}
          />
        </div>
      )}
      </ThemedContainer>
    </ThemeProvider>
  );
}
