-- Fix menu-images storage policies: storage.foldername must use the
-- storage object's name (objects.name), not the joined restaurants.name.
DROP POLICY IF EXISTS "Restaurant admins can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant admins can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant admins can delete menu images" ON storage.objects;

CREATE POLICY "Restaurant admins can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant admins can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant admins can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND r.owner_id = auth.uid()
  )
);