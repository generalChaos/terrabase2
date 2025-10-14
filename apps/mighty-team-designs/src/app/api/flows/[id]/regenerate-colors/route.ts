import { NextRequest, NextResponse } from 'next/server';
import { enhancedTeamDesignService } from '@/lib/services/enhancedTeamDesignService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    console.log('🎨 Regenerate Colors API: Received request for flow:', flowId);
    
    // Get the flow data to find all logos
    const flow = await enhancedTeamDesignService.getFlowById(flowId);
    
    if (!flow) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Flow not found' 
        },
        { status: 404 }
      );
    }

    const teamLogos = flow.logo_variants || [];
    console.log(`🎨 Found ${teamLogos.length} logos to process`);

    const results = [];
    const errors = [];

    // Process each logo
    for (const logo of teamLogos) {
      try {
        console.log(`🎨 Processing logo ${logo.id} (variant ${logo.variant_number})`);
        
        // Call the Python color analysis API
        const colorAnalysisResponse = await fetch('http://localhost:8000/api/v2/analyze-colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: logo.public_url,
            max_colors: 15
          })
        });

        if (!colorAnalysisResponse.ok) {
          throw new Error(`Color analysis failed: ${colorAnalysisResponse.status}`);
        }

        const colorAnalysisResult = await colorAnalysisResponse.json();
        
        if (!colorAnalysisResult.success) {
          throw new Error(`Color analysis failed: ${colorAnalysisResult.error}`);
        }

        // Transform the V2 API response to the expected format
        const colorData = colorAnalysisResult.data;
        const colors = {
          colors: colorData.swatches.map((swatch: any) => swatch.hex),
          frequencies: colorData.swatches.map((swatch: any) => swatch.percent),
          percentages: colorData.swatches.map((swatch: any) => swatch.percent),
          total_pixels_analyzed: 1048576 // 1024x1024
        };

        // Update the logo_asset_packs table
        const { error: updateError } = await supabase
          .from('logo_asset_packs')
          .update({ 
            colors: colors,
            updated_at: new Date().toISOString()
          })
          .eq('flow_id', flowId)
          .eq('logo_id', logo.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        results.push({
          logo_id: logo.id,
          variant_number: logo.variant_number,
          colors: colors,
          success: true
        });

        console.log(`✅ Successfully updated colors for logo ${logo.id}`);

      } catch (error) {
        console.error(`❌ Error processing logo ${logo.id}:`, error);
        errors.push({
          logo_id: logo.id,
          variant_number: logo.variant_number,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;

    console.log(`🎨 Regeneration complete: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      data: {
        flow_id: flowId,
        total_logos: teamLogos.length,
        successful_updates: successCount,
        failed_updates: errorCount,
        results: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('❌ Regenerate Colors API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to regenerate colors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
