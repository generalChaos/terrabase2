-- Create images table for Magic Marker
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

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
-- You can make this more restrictive later
CREATE POLICY "Allow all operations on images" ON images
  FOR ALL USING (true);
