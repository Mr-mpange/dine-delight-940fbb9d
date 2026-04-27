-- Public bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Menu images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Restaurant admins can upload to their own folder (folder = restaurant_id)
CREATE POLICY "Restaurant admins can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(name))[1]
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
    WHERE r.id::text = (storage.foldername(name))[1]
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
    WHERE r.id::text = (storage.foldername(name))[1]
      AND r.owner_id = auth.uid()
  )
);

-- Super admins can manage everything
CREATE POLICY "Super admins can manage menu images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'super_admin'));