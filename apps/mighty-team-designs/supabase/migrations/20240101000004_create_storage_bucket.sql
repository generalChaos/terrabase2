-- Create Supabase Storage bucket for team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true, -- Public bucket for easy access
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

-- Create storage policies for team logos bucket
CREATE POLICY "Anyone can upload team logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'team-logos');

CREATE POLICY "Anyone can view team logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'team-logos');

CREATE POLICY "Anyone can update team logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'team-logos');

CREATE POLICY "Anyone can delete team logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'team-logos');
