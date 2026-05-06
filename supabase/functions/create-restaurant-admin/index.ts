// Super-admin only: provisions a restaurant_admin user + their restaurant in one call.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Payload {
  email: string;
  password: string;
  full_name: string;
  restaurant: {
    name: string;
    slug: string;
    description?: string;
    phone?: string;
    address?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    // Authenticate caller and verify they are super_admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'super_admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden: super_admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Payload;
    if (!body.email || !body.password || !body.restaurant?.name || !body.restaurant?.slug) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create auth user (auto-confirm so they can log in immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (createErr || !created.user) throw createErr ?? new Error('User creation failed');
    const newUserId = created.user.id;

    // 2. Promote to restaurant_admin (handle_new_user trigger inserted 'customer')
    const { error: roleErr } = await admin
      .from('user_roles')
      .update({ role: 'restaurant_admin' })
      .eq('user_id', newUserId);
    if (roleErr) throw roleErr;

    // 3. Create restaurant owned by the new user
    const slug = body.restaurant.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const { data: restaurant, error: restErr } = await admin
      .from('restaurants')
      .insert({
        owner_id: newUserId,
        name: body.restaurant.name,
        slug,
        description: body.restaurant.description ?? null,
        phone: body.restaurant.phone ?? null,
        address: body.restaurant.address ?? null,
      })
      .select()
      .single();
    if (restErr) throw restErr;

    return new Response(
      JSON.stringify({ ok: true, user_id: newUserId, restaurant }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
