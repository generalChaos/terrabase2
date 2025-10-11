const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTableStructure() {
  console.log('🔍 Checking logo_asset_packs table structure...');

  try {
    // Try to get a sample record to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('logo_asset_packs')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing logo_asset_packs table:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✅ Successfully accessed logo_asset_packs table');
      console.log('📊 Available columns:');
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleData[0][key]}`);
      });
      
      // Check if colors column exists
      if ('colors' in sampleData[0]) {
        console.log('✅ Colors column exists!');
        console.log('🎨 Sample colors data:', sampleData[0].colors);
      } else {
        console.log('❌ Colors column does not exist');
        console.log('💡 Need to add it manually via Supabase dashboard');
      }
    } else {
      console.log('📊 Table is empty, but accessible');
    }

    // Try to insert a test record with colors to see what happens
    console.log('\n🧪 Testing colors column insertion...');
    const testRecord = {
      logo_id: 'test-logo-id',
      flow_id: 'test-flow-id',
      clean_logo_url: 'http://test.com/logo.png',
      tshirt_front_url: 'http://test.com/shirt.png',
      tshirt_back_url: 'http://test.com/shirt-back.png',
      banner_url: 'http://test.com/banner.png',
      processing_time_ms: 1000,
      colors: {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        frequencies: [100, 50, 25],
        percentages: [57.1, 28.6, 14.3],
        total_pixels_analyzed: 175
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('logo_asset_packs')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      if (insertError.message.includes('colors')) {
        console.log('💡 This confirms the colors column does not exist');
        console.log('🔧 Please add it manually: ALTER TABLE logo_asset_packs ADD COLUMN colors jsonb;');
      }
    } else {
      console.log('✅ Insert test successful - colors column exists!');
      console.log('🎨 Inserted colors:', insertData[0].colors);
      
      // Clean up test record
      await supabase
        .from('logo_asset_packs')
        .delete()
        .eq('logo_id', 'test-logo-id');
      console.log('🧹 Cleaned up test record');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableStructure();
