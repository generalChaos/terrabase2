-- Create policy to allow public access to images bucket
-- Note: RLS is already enabled on storage.objects by Supabase

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
