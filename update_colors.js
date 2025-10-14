const fetch = require('node-fetch');

async function updateAssetPackColors() {
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
    // Get current flow data
    console.log('📊 Getting current flow data...');
    const flowResponse = await fetch(`http://localhost:3003/api/flows/${flowId}`);
    const flowData = await flowResponse.json();
    
    if (!flowData.success) {
      throw new Error('Failed to get flow data');
    }
    
    console.log('📊 Flow data retrieved successfully');
    
    // Find the selected logo and update its asset pack colors
    const teamLogos = flowData.data.team_logos || [];
    const selectedLogo = teamLogos.find(logo => logo.id === logoId);
    
    if (!selectedLogo) {
      throw new Error('Selected logo not found');
    }
    
    console.log('📊 Found selected logo:', selectedLogo.id);
    
    // Update the asset pack colors in logo_asset_packs
    if (selectedLogo.logo_asset_packs && selectedLogo.logo_asset_packs.length > 0) {
      // Update the first asset pack (the main one)
      selectedLogo.logo_asset_packs[0].colors = colorAnalysis;
      console.log('📊 Updated logo asset pack colors');
    }
    
    // Also update the main asset_pack field if it exists
    if (selectedLogo.asset_pack) {
      selectedLogo.asset_pack.colors = colorAnalysis;
      console.log('📊 Updated main asset pack colors');
    }
    
    // Update the flow data
    console.log('📊 Updating flow data...');
    const updateResponse = await fetch(`http://localhost:3003/api/flows/${flowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team_logos: teamLogos
      })
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ Successfully updated colors for flow:', flowId);
      console.log('🎨 Colors:', colorAnalysis.colors);
    } else {
      console.error('❌ Failed to update colors:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error updating colors:', error);
  }
}

updateAssetPackColors();
