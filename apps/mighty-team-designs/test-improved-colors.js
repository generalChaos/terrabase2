const fetch = require('node-fetch').default || require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FLOW_ID = '0273070c-cb0b-4369-a6d2-3a2af2c1420e';

async function testImprovedColors() {
  console.log(`🎨 Testing improved color analysis for flow: ${FLOW_ID}`);

  try {
    // 1. Get the flow data
    console.log('📥 Fetching flow data...');
    const flowResponse = await fetch(`http://localhost:3003/api/flows/${FLOW_ID}`);
    const flowData = await flowResponse.json();

    if (!flowData.success || !flowData.flow) {
      throw new Error(`Failed to fetch flow data: ${flowData.error || 'Unknown error'}`);
    }
    console.log('✅ Flow data retrieved:', flowData.flow.team_name);

    // 2. Get the logos
    const { data: logos, error: logosError } = await supabase
      .from('team_logos')
      .select('*')
      .in('id', flowData.flow.logo_variants);

    if (logosError) {
      throw new Error(`Error fetching logos: ${logosError.message}`);
    }
    if (!logos || logos.length === 0) {
      throw new Error('No logos found for this flow.');
    }
    console.log('✅ Found', logos.length, 'logos');

    // 3. Test color analysis on the first logo
    const firstLogo = logos[0];
    console.log(`\n🎨 Testing improved color analysis on logo: ${firstLogo.id}`);
    console.log(`📷 Logo URL: ${firstLogo.public_url}`);

    const colorAnalysisResponse = await fetch('http://localhost:8000/api/v1/analyze-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: firstLogo.public_url
      })
    });
    
    const colorData = await colorAnalysisResponse.json();
    console.log('🎨 Improved color analysis result:', JSON.stringify(colorData, null, 2));
    
    if (colorData.colors && colorData.colors.length > 0) {
      console.log('\n🌈 Color Palette:');
      colorData.colors.forEach((color, index) => {
        const percentage = colorData.percentages[index] || 0;
        console.log(`  ${index + 1}. ${color} (${percentage.toFixed(1)}%)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImprovedColors();
