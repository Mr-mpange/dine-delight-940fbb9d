-- Private helper schema for access-control functions that should not be exposed as API calls
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.has_approved_kyc(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kyc_applications
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_approved_kyc(uuid) TO authenticated;
REVOKE ALL ON SCHEMA app_private FROM anon;

-- Keep public helper functions unavailable as API-callable routines
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_approved_kyc(uuid) FROM anon, authenticated, public;

-- user_roles policies
DROP POLICY IF EXISTS "Super admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

-- profiles policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

-- kyc_applications policies
DROP POLICY IF EXISTS "Super admins can view all kyc applications" ON public.kyc_applications;
DROP POLICY IF EXISTS "Super admins can update kyc applications" ON public.kyc_applications;

CREATE POLICY "Super admins can view all kyc applications"
ON public.kyc_applications
FOR SELECT
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins can update kyc applications"
ON public.kyc_applications
FOR UPDATE
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

-- restaurants policies
DROP POLICY IF EXISTS "Super admins can insert restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Super admins can update restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Super admins can delete restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Approved restaurant owners can update own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Approved admins can insert restaurants" ON public.restaurants;

CREATE POLICY "Super admins can insert restaurants"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins can update restaurants"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins can delete restaurants"
ON public.restaurants
FOR DELETE
TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Approved restaurant owners can update own restaurant"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() AND app_private.has_approved_kyc(auth.uid()));

CREATE POLICY "Approved admins can insert restaurants"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND app_private.has_role(auth.uid(), 'restaurant_admin'::public.app_role)
  AND app_private.has_approved_kyc(auth.uid())
);

-- menu category policies
DROP POLICY IF EXISTS "Approved restaurant admins insert categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Approved restaurant admins update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Approved restaurant admins delete categories" ON public.menu_categories;

CREATE POLICY "Approved restaurant admins insert categories"
ON public.menu_categories
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Approved restaurant admins update categories"
ON public.menu_categories
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Approved restaurant admins delete categories"
ON public.menu_categories
FOR DELETE
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_categories.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- menu item policies
DROP POLICY IF EXISTS "Approved restaurant admins insert items" ON public.menu_items;
DROP POLICY IF EXISTS "Approved restaurant admins update items" ON public.menu_items;
DROP POLICY IF EXISTS "Approved restaurant admins delete items" ON public.menu_items;

CREATE POLICY "Approved restaurant admins insert items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Approved restaurant admins update items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Approved restaurant admins delete items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- order policies
DROP POLICY IF EXISTS "Approved restaurant admins view their orders" ON public.orders;
DROP POLICY IF EXISTS "Approved restaurant admins update their orders" ON public.orders;

CREATE POLICY "Approved restaurant admins view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Approved restaurant admins update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    AND app_private.has_approved_kyc(auth.uid())
  )
  OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- order items policy
DROP POLICY IF EXISTS "Order items viewable with approved order access" ON public.order_items;

CREATE POLICY "Order items viewable with approved order access"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.restaurants r ON r.id = o.restaurant_id
    WHERE o.id = order_items.order_id
      AND (
        (r.owner_id = auth.uid() AND app_private.has_approved_kyc(auth.uid()))
        OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
      )
  )
);

-- storage policy
DROP POLICY IF EXISTS "Super admins can view kyc documents" ON storage.objects;

CREATE POLICY "Super admins can view kyc documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND app_private.has_role(auth.uid(), 'super_admin'::public.app_role)
);