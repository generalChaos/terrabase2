const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema - adding colors column...');

  try {
    // First, let's check the current table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'logo_asset_packs')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
      return;
    }

    console.log('📋 Current columns in logo_asset_packs:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check if colors column exists
    const hasColorsColumn = columns.some(col => col.column_name === 'colors');
    
    if (hasColorsColumn) {
      console.log('✅ Colors column already exists!');
    } else {
      console.log('❌ Colors column does not exist. Need to add it manually.');
      console.log('💡 Please run this SQL in the Supabase dashboard:');
      console.log('   ALTER TABLE logo_asset_packs ADD COLUMN colors jsonb;');
    }

    // Let's also check if we can query the table
    console.log('\n🔍 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('logo_asset_packs')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing logo_asset_packs table:', testError);
    } else {
      console.log('✅ Successfully accessed logo_asset_packs table');
      console.log('📊 Sample record keys:', Object.keys(testData[0] || {}));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDatabaseSchema();
