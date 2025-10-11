const fetch = require('node-fetch');

async function updateFlowWithColors() {
    const flowId = '7a593c24-7e89-4cba-b2e2-b10645ffe925';
    const baseUrl = 'http://localhost:3003';
    
    console.log(`🔄 Updating flow ${flowId} with color data...`);
    
    try {
        // First, get the current flow data
        console.log('📥 Fetching current flow data...');
        const flowResponse = await fetch(`${baseUrl}/api/flows/${flowId}`);
        const flowData = await flowResponse.json();
        
        if (!flowData.success) {
            throw new Error(`Failed to fetch flow: ${flowData.error}`);
        }
        
        console.log('✅ Flow data retrieved:', flowData.data.team_name);
        
        // Sample color data (you can replace with actual extracted colors)
        const sampleColors = {
            colors: ['#E7E1E1', '#2D1173', '#000101'],
            frequencies: [38620, 30081, 2002],
            percentages: [54.6, 42.5, 2.8],
            total_pixels_analyzed: 70703
        };
        
        // Update each logo variant with color data
        if (flowData.data.team_logos && flowData.data.team_logos.length > 0) {
            console.log(`🎨 Updating ${flowData.data.team_logos.length} logo variants with color data...`);
            
            for (let i = 0; i < flowData.data.team_logos.length; i++) {
                const logo = flowData.data.team_logos[i];
                
                // Add color data to the asset_pack
                if (logo.asset_pack) {
                    logo.asset_pack.colors = sampleColors;
                    console.log(`✅ Updated logo ${i + 1} with colors:`, sampleColors.colors);
                } else {
                    console.log(`⚠️ Logo ${i + 1} has no asset_pack data`);
                }
            }
            
            // Update the flow with the modified data
            console.log('💾 Saving updated flow data...');
            const updateResponse = await fetch(`${baseUrl}/api/flows/${flowId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_logos: flowData.data.team_logos
                })
            });
            
            const updateResult = await updateResponse.json();
            
            if (updateResult.success) {
                console.log('✅ Flow updated successfully with color data!');
                console.log('🎨 Colors added:', sampleColors.colors);
                console.log('🌐 You can now test at:', `${baseUrl}/results/${flowId}`);
            } else {
                console.error('❌ Failed to update flow:', updateResult.error);
            }
        } else {
            console.log('⚠️ No team_logos found in flow data');
        }
        
    } catch (error) {
        console.error('❌ Error updating flow:', error.message);
    }
}

updateFlowWithColors();
