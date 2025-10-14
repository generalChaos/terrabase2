import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Helper function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Helper function to get color name (basic mapping)
function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb;
  
  // Basic color name detection based on RGB values
  if (r > 200 && g < 100 && b < 100) return 'Red';
  if (r < 100 && g > 200 && b < 100) return 'Green';
  if (r < 100 && g < 100 && b > 200) return 'Blue';
  if (r > 200 && g > 200 && b < 100) return 'Yellow';
  if (r > 200 && g < 100 && b > 200) return 'Magenta';
  if (r < 100 && g > 200 && b > 200) return 'Cyan';
  if (r > 200 && g > 200 && b > 200) return 'White';
  if (r < 50 && g < 50 && b < 50) return 'Black';
  if (r > 150 && g > 100 && b < 100) return 'Orange';
  if (r > 100 && g > 150 && b < 100) return 'Lime';
  if (r < 100 && g > 150 && b > 150) return 'Teal';
  if (r > 150 && g < 100 && b > 150) return 'Purple';
  if (r > 100 && g > 100 && b > 100) return 'Gray';
  
  return 'Unknown';
}

// Validation schema
const ColorAnalyzerSchema = z.object({
  image_url: z.string().url('Invalid image URL'),
  max_colors: z.number().min(1).max(50).optional().default(15)
});

// POST /api/color-analyzer - Analyze colors in an image
export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE CALLED - POST /api/color-analyzer');
  try {
    const body = await request.json();
    console.log('🔍 Raw request body:', JSON.stringify(body, null, 2));
    console.log('🔍 Body type:', typeof body);
    console.log('🔍 Body keys:', Object.keys(body));
    console.log('🔍 image_url type:', typeof body.image_url);
    console.log('🔍 image_url value:', body.image_url);
    
    const validatedData = ColorAnalyzerSchema.parse(body);

    console.log('=== COLOR ANALYZER DEBUG ===');
    console.log('🖼️ Image URL:', validatedData.image_url);
    console.log('🎨 Max Colors:', validatedData.max_colors);

        // Call the image processor color analysis v2 endpoint
        const imageProcessorUrl = 'http://localhost:8000/api/v2';
        console.log('🔍 Calling image processor at:', imageProcessorUrl);
        console.log('🔍 Full URL:', `${imageProcessorUrl}/analyze-colors`);
        
        const response = await fetch(`${imageProcessorUrl}/analyze-colors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: validatedData.image_url,
            mode: 'logo', // Use logo mode for better background detection
            max_edge: 1024,
            k_lo: 4,
            k_hi: 10,
            min_cluster_pct: 0.8,
            dilate_alpha: true
          })
        });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image processor error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Image processor error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Color analysis result:', JSON.stringify(result, null, 2));
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

    if (result.success) {
      console.log('🔍 Raw v2 response:', JSON.stringify(result, null, 2));
      
      // Handle nested data structure from Python API
      const actualData = result.data?.data || result.data;
      console.log('🔍 Result.data:', JSON.stringify(result.data, null, 2));
      console.log('🔍 Result.data.data:', JSON.stringify(result.data?.data, null, 2));
      console.log('🔍 Actual data:', JSON.stringify(actualData, null, 2));
      console.log('🔍 Swatches count:', actualData.swatches?.length);
      console.log('🔍 Roles:', Object.keys(actualData.roles || {}));
      
      // Transform the v2 response to match our frontend expectations
      const swatches = actualData.swatches || [];
      console.log('🔍 Swatches for transformation:', swatches.length, swatches);
      
      const transformedData = {
        colors: swatches.map((swatch: any) => ({
          hex: swatch.hex,
          rgb: hexToRgb(swatch.hex),
          percentage: swatch.percent,
          name: getColorName(swatch.hex)
        })),
        dominant_color: swatches[0]?.hex || '#000000',
        color_palette: swatches.map((s: any) => s.hex),
        // New v2 data
        systematic_analysis: {
          k_clusters: actualData.k,
          processing_time: actualData.processing_time,
          reconstruction_error: actualData.reconstruction_error,
          background_candidate: actualData.background_candidate
        },
        roles: actualData.roles,
        confidence_scores: actualData.confidence_scores,
        assignment_reasons: actualData.assignment_reasons,
        // Legacy format for compatibility
        color_groups: swatches.map((swatch: any) => ({
          group_color: swatch.hex,
          group_count: Math.round(swatch.percent * 100), // Convert percentage to count
          individual_colors: [{
            hex: swatch.hex,
            count: Math.round(swatch.percent * 100)
          }]
        }))
      };

      console.log('🔍 Transformed data:', JSON.stringify(transformedData, null, 2));
      console.log('🔍 Colors array length:', transformedData.colors.length);
      console.log('🔍 First few colors:', transformedData.colors.slice(0, 3));

      return NextResponse.json({
        success: true,
        data: transformedData
      });
    } else {
      console.error('❌ V2 API returned error:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Color analysis failed'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error in POST /api/color-analyzer:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // If V2 API fails, return a fallback response
    console.log('🔄 V2 API failed, returning fallback response');
    return NextResponse.json({
      success: true,
      data: {
        colors: [],
        dominant_color: '#000000',
        color_palette: [],
        systematic_analysis: {},
        color_groups: [],
        roles: {},
        confidence_scores: {},
        assignment_reasons: {}
      }
    });
  }
}
