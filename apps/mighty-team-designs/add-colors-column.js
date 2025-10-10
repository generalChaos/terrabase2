const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addColorsColumn() {
  console.log('🔧 Adding colors column to logo_asset_packs table...');

  try {
    // Use the RPC function to execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE logo_asset_packs ADD COLUMN IF NOT EXISTS colors jsonb;'
    });

    if (error) {
      console.error('❌ Error adding colors column:', error);
      
      // Try alternative approach - check if column exists first
      console.log('🔍 Checking if colors column already exists...');
      const { data: checkData, error: checkError } = await supabase
        .from('logo_asset_packs')
        .select('colors')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST204') {
        console.log('❌ Colors column does not exist, trying direct SQL...');
        
        // Try using the SQL editor approach
        const { data: sqlData, error: sqlError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'logo_asset_packs')
          .eq('column_name', 'colors');
        
        if (sqlError) {
          console.error('❌ Cannot access information_schema:', sqlError);
          console.log('💡 You may need to add the column manually via Supabase dashboard:');
          console.log('   ALTER TABLE logo_asset_packs ADD COLUMN colors jsonb;');
        } else if (sqlData && sqlData.length === 0) {
          console.log('❌ Colors column does not exist. Please add it manually via Supabase dashboard.');
          console.log('   SQL: ALTER TABLE logo_asset_packs ADD COLUMN colors jsonb;');
        } else {
          console.log('✅ Colors column already exists!');
        }
      } else {
        console.log('✅ Colors column already exists!');
      }
    } else {
      console.log('✅ Colors column added successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please add the column manually via Supabase dashboard:');
    console.log('   ALTER TABLE logo_asset_packs ADD COLUMN colors jsonb;');
  }
}

addColorsColumn();
