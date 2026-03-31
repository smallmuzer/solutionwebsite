
-- Create public uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow anyone to read/view uploaded files
CREATE POLICY "Public can read uploads"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'uploads');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Admins can update uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'uploads');

CREATE POLICY "Admins can delete uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads');
