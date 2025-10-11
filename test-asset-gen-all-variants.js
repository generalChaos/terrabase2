const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://your-project.supabase.co', // Replace with your actual URL
  'your-anon-key' // Replace with your actual anon key
);

async function testAssetGenerationForAllVariants() {
  try {
    console.log('🧪 Testing asset generation for all variants...');
    
    // Create a test flow
    const { data: flow, error: flowError } = await supabase
      .from('team_design_flows')
      .insert({
        team_name: 'Test Thunder Hawks',
        sport: 'Soccer',
        age_group: 'youth',
        round2_questions: [
          { id: 'style', selected: 0, options: ['Fun & playful', 'Serious & tough', 'Friendly & approachable', 'Professional'] },
          { id: 'colors', selected: 0, options: ['Use team colors', 'Input custom colors'] },
          { id: 'mascot', selected: 0, options: ['Yes, use our guess', 'No, I\'ll describe it myself'] }
        ],
        is_active: true
      })
      .select()
      .single();

    if (flowError) {
      console.error('❌ Error creating test flow:', flowError);
      return;
    }

    console.log('✅ Test flow created:', flow.id);

    // Call the logo generation API
    const response = await fetch('http://localhost:3003/api/logos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: flow.id,
        variant_count: 3 // Generate 3 variants
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Logo generation response:', result);

    // Wait a bit for asset generation to complete
    console.log('⏳ Waiting for asset generation to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check if asset packs were generated for all variants
    const { data: logos, error: logosError } = await supabase
      .from('team_logos')
      .select(`
        *,
        logo_asset_packs!logo_asset_packs_logo_id_fkey (*)
      `)
      .eq('flow_id', flow.id);

    if (logosError) {
      console.error('❌ Error fetching logos:', logosError);
      return;
    }

    console.log('📊 Logo variants with asset packs:');
    logos.forEach((logo, index) => {
      const hasAssetPack = logo.logo_asset_packs && logo.logo_asset_packs.length > 0;
      console.log(`  Variant ${logo.variant_number}: ${hasAssetPack ? '✅ Has asset pack' : '❌ No asset pack'}`);
      if (hasAssetPack) {
        console.log(`    Asset pack ID: ${logo.logo_asset_packs[0].id}`);
        console.log(`    Clean logo URL: ${logo.logo_asset_packs[0].clean_logo_url}`);
        console.log(`    T-shirt front URL: ${logo.logo_asset_packs[0].tshirt_front_url}`);
        console.log(`    T-shirt back URL: ${logo.logo_asset_packs[0].tshirt_back_url}`);
        console.log(`    Banner URL: ${logo.logo_asset_packs[0].banner_url}`);
      }
    });

    const totalVariants = logos.length;
    const variantsWithAssetPacks = logos.filter(logo => logo.logo_asset_packs && logo.logo_asset_packs.length > 0).length;
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total variants: ${totalVariants}`);
    console.log(`  Variants with asset packs: ${variantsWithAssetPacks}`);
    console.log(`  Success rate: ${((variantsWithAssetPacks / totalVariants) * 100).toFixed(1)}%`);

    if (variantsWithAssetPacks === totalVariants) {
      console.log('🎉 SUCCESS: All variants have asset packs!');
    } else {
      console.log('⚠️  WARNING: Not all variants have asset packs');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAssetGenerationForAllVariants();
