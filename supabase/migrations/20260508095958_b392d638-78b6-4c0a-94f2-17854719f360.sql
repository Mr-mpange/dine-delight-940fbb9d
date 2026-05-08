-- Restore safe execution permissions for helper functions used by access rules
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_approved_kyc(uuid) TO authenticated;

-- Ensure the private KYC documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Make KYC application policies explicit for signed-in users
DROP POLICY IF EXISTS "Users can view own kyc applications" ON public.kyc_applications;
DROP POLICY IF EXISTS "Users can create kyc application" ON public.kyc_applications;
DROP POLICY IF EXISTS "Super admins can update kyc applications" ON public.kyc_applications;

CREATE POLICY "Users can view own kyc applications"
ON public.kyc_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all kyc applications"
ON public.kyc_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Users can create own kyc application"
ON public.kyc_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can update kyc applications"
ON public.kyc_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Private KYC document storage policies
DROP POLICY IF EXISTS "Users can upload own kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own kyc documents" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can view kyc documents" ON storage.objects;

CREATE POLICY "Users can upload own kyc documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own kyc documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own kyc documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Super admins can view kyc documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'super_admin'::public.app_role)
);