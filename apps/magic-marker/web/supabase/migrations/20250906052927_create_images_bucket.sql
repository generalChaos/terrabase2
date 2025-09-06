-- Create storage bucket for Magic Marker images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes from images bucket" ON storage.objects;

-- Create storage policies for the images bucket
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- Allow anonymous users to upload to images bucket
CREATE POLICY "Allow anonymous uploads to images bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow anonymous users to read from images bucket
CREATE POLICY "Allow anonymous reads from images bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow anonymous users to update images bucket
CREATE POLICY "Allow anonymous updates to images bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- Allow anonymous users to delete from images bucket
CREATE POLICY "Allow anonymous deletes from images bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'images');
