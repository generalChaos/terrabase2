import { supabase } from './supabase';

export async function createImagesTable() {
  try {
    console.log('🔄 Creating images table...');
    
    // Create the table using raw SQL
    const { error } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error.message);
      return false;
    }

    console.log('✅ Images table created successfully!');
    return true;
  } catch (err) {
    console.error('❌ Migration error:', err);
    return false;
  }
}

// Run migration if called directly
if (require.main === module) {
  createImagesTable()
    .then(success => {
      if (success) {
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.log('💥 Migration failed!');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('💥 Migration error:', err);
      process.exit(1);
    });
}