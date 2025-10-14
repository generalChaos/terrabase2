const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAssetPackColorsDirect() {
  const flowId = '408543f8-7bfc-4794-bc3d-39276b012462';
  const logoId = '206e2dce-4855-4460-8993-cec9c04ea947';
  
  // Color analysis results from the Python API
  const colorAnalysis = {
    colors: ['#321B58', '#296E57', '#F4C826', '#261357', '#442C5A'],
    frequencies: [50.13, 19.84, 19.41, 5.75, 4.85],
    percentages: [50.13, 19.84, 19.41, 5.75, 4.85],
    total_pixels_analyzed: 1048576 // 1024x1024
  };
  
  try {
    console.log('📊 Updating asset pack colors directly in database...');
    
    // Update the logo_asset_packs table
    const { data, error } = await supabase
      .from('logo_asset_packs')
      .update({ 
        colors: colorAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('flow_id', flowId)
      .eq('logo_id', logoId)
      .select();
    
    if (error) {
      console.error('❌ Error updating logo_asset_packs:', error);
      return;
    }
    
    console.log('✅ Successfully updated colors in logo_asset_packs table');
    console.log('📊 Updated records:', data.length);
    console.log('🎨 Colors:', colorAnalysis.colors);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('logo_asset_packs')
      .select('colors')
      .eq('flow_id', flowId)
      .eq('logo_id', logoId);
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification successful - colors updated:', verifyData[0]?.colors);
    }
    
  } catch (error) {
    console.error('❌ Error updating colors:', error);
  }
}

updateAssetPackColorsDirect();
