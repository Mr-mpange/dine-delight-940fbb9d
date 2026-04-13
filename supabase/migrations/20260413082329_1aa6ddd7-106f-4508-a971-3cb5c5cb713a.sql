
-- Create enum types
create type public.app_role as enum ('super_admin', 'restaurant_admin', 'customer');
create type public.order_status as enum ('pending', 'preparing', 'ready', 'delivered', 'cancelled');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'customer',
  created_at timestamptz default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Restaurants table
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  cover_image_url text,
  phone text,
  whatsapp text,
  address text,
  opening_hours jsonb default '{}',
  is_active boolean default true,
  commission_rate numeric(5,2) default 10.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.restaurants enable row level security;

-- Menu categories
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table public.menu_categories enable row level security;

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.menu_items enable row level security;

-- Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text,
  status order_status default 'pending',
  total numeric(10,2) not null,
  commission numeric(10,2) default 0,
  payment_method text,
  payment_status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null default 1,
  created_at timestamptz default now()
);
alter table public.order_items enable row level security;

-- Security definer function for role checks
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Restaurants
create policy "Anyone can view active restaurants" on public.restaurants for select using (is_active = true);
create policy "Super admins can insert restaurants" on public.restaurants for insert with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins can update restaurants" on public.restaurants for update using (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins can delete restaurants" on public.restaurants for delete using (public.has_role(auth.uid(), 'super_admin'));
create policy "Restaurant owners can update own restaurant" on public.restaurants for update using (owner_id = auth.uid());

-- Menu categories
create policy "Anyone can view menu categories" on public.menu_categories for select using (true);
create policy "Restaurant admins insert categories" on public.menu_categories for insert with check (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);
create policy "Restaurant admins update categories" on public.menu_categories for update using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);
create policy "Restaurant admins delete categories" on public.menu_categories for delete using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);

-- Menu items
create policy "Anyone can view menu items" on public.menu_items for select using (true);
create policy "Restaurant admins insert items" on public.menu_items for insert with check (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);
create policy "Restaurant admins update items" on public.menu_items for update using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);
create policy "Restaurant admins delete items" on public.menu_items for delete using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);

-- Orders
create policy "Anyone can create orders" on public.orders for insert with check (true);
create policy "Restaurant admins view their orders" on public.orders for select using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);
create policy "Restaurant admins update their orders" on public.orders for update using (
  exists (select 1 from public.restaurants where id = restaurant_id and owner_id = auth.uid())
  or public.has_role(auth.uid(), 'super_admin')
);

-- Order items
create policy "Anyone can create order items" on public.order_items for insert with check (true);
create policy "Order items viewable with order access" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_id and (r.owner_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'))
  )
);

-- User roles
create policy "Users can view own roles" on public.user_roles for select using (user_id = auth.uid());
create policy "Super admins insert roles" on public.user_roles for insert with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins update roles" on public.user_roles for update using (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins delete roles" on public.user_roles for delete using (public.has_role(auth.uid(), 'super_admin'));

-- Enable realtime for orders
alter publication supabase_realtime add table public.orders;
