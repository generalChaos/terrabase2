-- Create Supabase Storage bucket for team assets (t-shirts, banners, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-assets',
  'team-assets',
  true, -- Public bucket for easy access
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
);

-- Create storage policies for team assets bucket
CREATE POLICY "Anyone can upload team assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'team-assets');

CREATE POLICY "Anyone can view team assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'team-assets');

CREATE POLICY "Anyone can update team assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'team-assets');

CREATE POLICY "Anyone can delete team assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'team-assets');
