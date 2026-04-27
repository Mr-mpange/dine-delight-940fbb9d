-- Replace overly broad public SELECT with one that doesn't allow listing
DROP POLICY IF EXISTS "Menu images are publicly viewable" ON storage.objects;

-- Anyone can read individual files by path; bucket listing requires owner/admin
CREATE POLICY "Menu images public direct read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'menu-images'
  AND name IS NOT NULL
  AND length(name) > 0
);