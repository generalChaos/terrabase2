import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFlow() {
  const flowId = '121d90c9-4a12-4c92-91ac-1736ca200885';
  
  console.log('🔍 Checking flow:', flowId);
  
  try {
    // Get flow data
    const { data: flow, error: flowError } = await supabase
      .from('team_design_flows')
      .select('*')
      .eq('id', flowId)
      .single();
    
    if (flowError) {
      console.error('❌ Flow error:', flowError);
      return;
    }
    
    console.log('✅ Flow found:');
    console.log('- Team name:', flow.team_name);
    console.log('- Sport:', flow.sport);
    console.log('- Current step:', flow.current_step);
    console.log('- Round 1 answers:', JSON.stringify(flow.round1_answers, null, 2));
    console.log('- Round 2 questions count:', flow.round2_questions?.length || 0);
    console.log('- Round 2 answers count:', flow.round2_answers?.length || 0);
    console.log('- Logo variants count:', flow.logo_variants?.length || 0);
    console.log('- Selected logo ID:', flow.selected_logo_id);
    console.log('- Created at:', flow.created_at);
    console.log('- Updated at:', flow.updated_at);
    
    if (flow.round2_questions?.length > 0) {
      console.log('\n📝 Round 2 Questions:');
      flow.round2_questions.forEach((q: any, i: number) => {
        console.log(`  ${i + 1}. ${q.text} (${q.type})`);
      });
    }
    
    if (flow.round2_answers?.length > 0) {
      console.log('\n💬 Round 2 Answers:');
      flow.round2_answers.forEach((a: any, i: number) => {
        console.log(`  ${i + 1}. Q${a.question_id}: ${a.answer}`);
      });
    }
    
    if (flow.logo_variants?.length > 0) {
      console.log('\n🎨 Logo Variants:');
      flow.logo_variants.forEach((logo: any, i: number) => {
        console.log(`  ${i + 1}. Variant ${logo.variant_number} (${logo.model_used})`);
        console.log(`     - Selected: ${logo.is_selected}`);
        console.log(`     - Public URL: ${logo.public_url ? 'Yes' : 'No'}`);
      });
    }
    
    // Check team_logos table
    const { data: teamLogos, error: logosError } = await supabase
      .from('team_logos')
      .select('*')
      .eq('flow_id', flowId);
    
    if (logosError) {
      console.error('❌ Team logos error:', logosError);
    } else {
      console.log('\n🖼️ Team Logos table:');
      console.log('- Count:', teamLogos?.length || 0);
      if (teamLogos?.length > 0) {
        teamLogos.forEach((logo: any, i: number) => {
          console.log(`  ${i + 1}. Variant ${logo.variant_number} (${logo.model_used})`);
          console.log(`     - Selected: ${logo.is_selected}`);
          console.log(`     - File path: ${logo.file_path}`);
        });
      }
    }
    
    // Check logo_asset_packs table
    const { data: assetPacks, error: assetPacksError } = await supabase
      .from('logo_asset_packs')
      .select('*')
      .eq('flow_id', flowId);
    
    if (assetPacksError) {
      console.error('❌ Asset packs error:', assetPacksError);
    } else {
      console.log('\n📦 Asset Packs:');
      console.log('- Count:', assetPacks?.length || 0);
      if (assetPacks?.length > 0) {
        assetPacks.forEach((pack: any, i: number) => {
          console.log(`  ${i + 1}. Logo ID: ${pack.logo_id}`);
          console.log(`     - Clean logo: ${pack.clean_logo_url ? 'Yes' : 'No'}`);
          console.log(`     - T-shirt front: ${pack.tshirt_front_url ? 'Yes' : 'No'}`);
          console.log(`     - T-shirt back: ${pack.tshirt_back_url ? 'Yes' : 'No'}`);
          console.log(`     - Banner: ${pack.banner_url ? 'Yes' : 'No'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFlow();

