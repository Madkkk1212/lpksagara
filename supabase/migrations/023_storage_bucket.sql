-- Create public storage bucket for media files
-- (Run this in Supabase SQL Editor)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','audio/mpeg','audio/mp3','audio/ogg','audio/wav','video/mp4','video/webm','video/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Allow public access to read media files
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated can upload media" ON storage.objects;
CREATE POLICY "Authenticated can upload media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');
