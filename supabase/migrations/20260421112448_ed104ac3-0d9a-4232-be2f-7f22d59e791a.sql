
-- 1. Tighten orders INSERT: require active restaurant (still allows anon for QR ordering)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders for active restaurants"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = orders.restaurant_id AND r.is_active = true
  )
);

-- 2. Tighten order_items INSERT: only for orders that exist on active restaurants
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items for valid orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.restaurants r ON r.id = o.restaurant_id
    WHERE o.id = order_items.order_id AND r.is_active = true
  )
);

-- 3. Realtime channel authorization — restrict broadcast/presence subscriptions
-- Only the restaurant owner (or super admin) may subscribe to a topic that
-- starts with "orders:<restaurant_id>". Customer-facing per-order tracking
-- uses topic "order:<order_id>" and is allowed to anyone (low value, opaque uuid).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant owners can subscribe to their order channel" ON realtime.messages;
CREATE POLICY "Restaurant owners can subscribe to their order channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic format: "orders:<restaurant_uuid>"
  CASE
    WHEN realtime.topic() LIKE 'orders:%' THEN
      EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id::text = split_part(realtime.topic(), ':', 2)
          AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
      )
    -- per-order tracking: opaque uuid, allow anyone with the id
    WHEN realtime.topic() LIKE 'order:%' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "Restaurant owners can broadcast on their order channel" ON realtime.messages;
CREATE POLICY "Restaurant owners can broadcast on their order channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() LIKE 'orders:%' THEN
      EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id::text = split_part(realtime.topic(), ':', 2)
          AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
      )
    WHEN realtime.topic() LIKE 'order:%' THEN true
    ELSE false
  END
);
