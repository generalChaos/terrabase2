#!/usr/bin/env node

const https = require('https');

// Your Supabase credentials
const SUPABASE_URL = 'https://csjzzhibbavtelupqugc.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_dDqJa3nzv5FwkA6O7obEtw_qI6hY-mG';

const createTableSQL = `
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
  
  CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
  
  ALTER TABLE images ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY IF NOT EXISTS "Allow all operations on images" ON images
    FOR ALL USING (true);
`;

async function createTable() {
  try {
    console.log('🔄 Creating images table via Supabase API...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql: createTableSQL })
    });

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

createTable()
  .then(success => {
    if (success) {
      console.log('🎉 Table creation completed!');
      process.exit(0);
    } else {
      console.log('💥 Table creation failed!');
      process.exit(1);
    }
  });
