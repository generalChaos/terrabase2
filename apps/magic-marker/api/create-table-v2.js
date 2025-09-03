#!/usr/bin/env node

// Alternative approach: Use Supabase Management API
const SUPABASE_URL = 'https://csjzzhibbavtelupqugc.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_dDqJa3nzv5FwkA6O7obEtw_qI6hY-mG';

async function createTableViaManagementAPI() {
  try {
    console.log('🔄 Creating images table via Management API...');
    
    // Try using the management API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            original_image_path TEXT NOT NULL,
            analysis_result TEXT NOT NULL,
            questions TEXT NOT NULL,
            answers TEXT,
            final_image_path TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      return false;
    }

    console.log('✅ Images table created successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

// Let's try a simpler approach - just test if we can connect and suggest manual creation
async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });

    console.log('Connection test status:', response.status);
    
    if (response.ok) {
      console.log('✅ Connected to Supabase successfully!');
      console.log('📋 To create the images table, please:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to Table Editor');
      console.log('   4. Click "New Table"');
      console.log('   5. Use the SQL from create-images-table.sql');
      return true;
    } else {
      console.error('❌ Connection failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('🎉 Ready to create table manually!');
      process.exit(0);
    } else {
      console.log('💥 Connection test failed!');
      process.exit(1);
    }
  });
