CREATE OR REPLACE FUNCTION public.has_approved_kyc(_user_id uuid)
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

DROP POLICY IF EXISTS "Restaurant owners can update own restaurant" ON public.restaurants;
CREATE POLICY "Approved restaurant owners can update own restaurant"
ON public.restaurants
FOR UPDATE
USING ((owner_id = auth.uid()) AND public.has_approved_kyc(auth.uid()));

DROP POLICY IF EXISTS "Approved admins can insert restaurants" ON public.restaurants;
CREATE POLICY "Approved admins can insert restaurants"
ON public.restaurants
FOR INSERT
WITH CHECK ((owner_id = auth.uid()) AND public.has_role(auth.uid(), 'restaurant_admin'::app_role) AND public.has_approved_kyc(auth.uid()));

DROP POLICY IF EXISTS "Restaurant admins insert categories" ON public.menu_categories;
CREATE POLICY "Approved restaurant admins insert categories"
ON public.menu_categories
FOR INSERT
WITH CHECK (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_categories.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins update categories" ON public.menu_categories;
CREATE POLICY "Approved restaurant admins update categories"
ON public.menu_categories
FOR UPDATE
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_categories.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins delete categories" ON public.menu_categories;
CREATE POLICY "Approved restaurant admins delete categories"
ON public.menu_categories
FOR DELETE
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_categories.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins insert items" ON public.menu_items;
CREATE POLICY "Approved restaurant admins insert items"
ON public.menu_items
FOR INSERT
WITH CHECK (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins update items" ON public.menu_items;
CREATE POLICY "Approved restaurant admins update items"
ON public.menu_items
FOR UPDATE
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins delete items" ON public.menu_items;
CREATE POLICY "Approved restaurant admins delete items"
ON public.menu_items
FOR DELETE
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins view their orders" ON public.orders;
CREATE POLICY "Approved restaurant admins view their orders"
ON public.orders
FOR SELECT
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = orders.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Restaurant admins update their orders" ON public.orders;
CREATE POLICY "Approved restaurant admins update their orders"
ON public.orders
FOR UPDATE
USING (((EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = orders.restaurant_id
    AND restaurants.owner_id = auth.uid()
)) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Order items viewable with order access" ON public.order_items;
CREATE POLICY "Order items viewable with approved order access"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.id = order_items.order_id
    AND (((r.owner_id = auth.uid()) AND public.has_approved_kyc(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'::app_role))
));