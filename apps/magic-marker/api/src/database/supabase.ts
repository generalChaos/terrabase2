import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csjzzhibbavtelupqugc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_dDqJa3nzv5FwkA6O7obEtw_qI6hY-mG';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export async function testSupabaseConnection() {
  try {
    // Test basic connection by checking auth
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase database');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return false;
  }
}

// Initialize database tables
export async function initSupabaseTables() {
  try {
    // Check if images table exists by trying to query it
    const { data, error } = await supabase
      .from('images')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "images" does not exist')) {
        console.log('⚠️  Images table does not exist. Please create it using the CLI migration or manually in Supabase dashboard.');
      } else {
        console.error('Error checking images table:', error.message);
      }
    } else {
      console.log('✅ Images table ready');
    }
  } catch (err) {
    console.error('Error initializing Supabase tables:', err);
  }
}
