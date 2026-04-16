-- Add table/section to orders
ALTER TABLE public.orders ADD COLUMN table_number text;
ALTER TABLE public.orders ADD COLUMN section text;

-- Create KYC applications table
CREATE TABLE public.kyc_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  restaurant_name text NOT NULL,
  phone text NOT NULL,
  address text,
  business_license_number text,
  tin_number text,
  id_document_url text,
  business_reg_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own kyc applications"
ON public.kyc_applications FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

-- Users can create their own application
CREATE POLICY "Users can create kyc application"
ON public.kyc_applications FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Super admins can update applications (approve/reject)
CREATE POLICY "Super admins can update kyc applications"
ON public.kyc_applications FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Users can upload their own KYC docs
CREATE POLICY "Users upload own kyc docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own docs
CREATE POLICY "Users view own kyc docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'super_admin'::app_role)));

-- Also allow restaurant admins to insert restaurants after approval
CREATE POLICY "Approved admins can insert restaurants"
ON public.restaurants FOR INSERT
WITH CHECK (owner_id = auth.uid() AND has_role(auth.uid(), 'restaurant_admin'::app_role));