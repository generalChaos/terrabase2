const fetch = require('node-fetch').default || require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FLOW_ID = '0273070c-cb0b-4369-a6d2-3a2af2c1420e';

async function regenerateAssetPacksDirect() {
  console.log(`🎨 Regenerating asset packs with improved color analysis for flow: ${FLOW_ID}`);

  try {
    // 1. Get the flow data directly from database
    console.log('📥 Fetching flow data from database...');
    const { data: flowData, error: flowError } = await supabase
      .from('team_design_flows')
      .select('*')
      .eq('id', FLOW_ID)
      .single();

    if (flowError) {
      throw new Error(`Failed to fetch flow data: ${flowError.message}`);
    }
    console.log('✅ Flow data retrieved:', flowData.team_name);

    // 2. Get the logos
    const { data: logos, error: logosError } = await supabase
      .from('team_logos')
      .select('*')
      .in('id', flowData.logo_variants);

    if (logosError) {
      throw new Error(`Error fetching logos: ${logosError.message}`);
    }
    if (!logos || logos.length === 0) {
      throw new Error('No logos found for this flow.');
    }
    console.log('✅ Found', logos.length, 'logos');

    // 3. Regenerate asset pack for each logo with improved color analysis
    for (let i = 0; i < logos.length; i++) {
      const logo = logos[i];
      console.log(`\n🎨 Regenerating asset pack for logo ${i + 1} (${logo.id})...`);

      const assetPackResponse = await fetch('http://localhost:8000/api/v1/asset-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo_id: logo.id,
          logo_url: logo.public_url,
          team_name: flowData.team_name || 'Team',
          players: [
            { number: 1, name: 'Captain' },
            { number: 2, name: 'Vice Captain' },
            { number: 3, name: 'Starter' },
            { number: 4, name: 'Starter' },
            { number: 5, name: 'Starter' },
          ],
          tshirt_color: 'black',
          include_banner: true,
          output_format: 'png',
          quality: 95
        })
      });
      
      const assetPackData = await assetPackResponse.json();
      
      if (assetPackData.success) {
        console.log(`✅ Asset pack regenerated for logo ${i + 1}`);
        console.log(`  - Clean logo: ${assetPackData.clean_logo_url || 'N/A'}`);
        console.log(`  - T-shirt front: ${assetPackData.tshirt_front_url || 'N/A'}`);
        console.log(`  - T-shirt back: ${assetPackData.tshirt_back_url || 'N/A'}`);
        console.log(`  - Banner: ${assetPackData.banner_url || 'N/A'}`);
        console.log(`  - Colors: ${assetPackData.colors?.colors?.join(', ') || 'N/A'}`);
        console.log(`  - Full colors object:`, JSON.stringify(assetPackData.colors, null, 2));
        
    // Update the existing asset pack in database with colors
    const { error: updateError } = await supabase
      .from('logo_asset_packs')
      .update({
        clean_logo_url: assetPackData.clean_logo_url,
        tshirt_front_url: assetPackData.tshirt_front_url,
        tshirt_back_url: assetPackData.tshirt_back_url,
        banner_url: assetPackData.banner_url,
        processing_time_ms: assetPackData.processing_time_ms,
        colors: assetPackData.colors // Now including colors!
      })
      .eq('logo_id', logo.id);
        
        if (updateError) {
          console.error(`❌ Error updating asset pack for logo ${i + 1}:`, updateError);
        } else {
          console.log(`✅ Asset pack updated in database for logo ${i + 1}`);
        }
      } else {
        console.error(`❌ Asset pack regeneration failed for logo ${i + 1}:`, assetPackData.error || 'Unknown error');
      }
    }

    console.log('\n🎉 Asset pack regeneration complete with improved colors!');
    console.log(`🌐 View results at: http://localhost:3003/results/${FLOW_ID}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

regenerateAssetPacksDirect();
