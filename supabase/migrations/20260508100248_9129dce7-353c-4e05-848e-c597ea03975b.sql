DROP POLICY IF EXISTS "Users upload own kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Users view own kyc docs" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage menu images" ON storage.objects;

CREATE POLICY "Super admins can manage menu images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'menu-images'
  AND app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);