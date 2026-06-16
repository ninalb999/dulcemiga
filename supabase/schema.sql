create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'Tortas personalizadas',
  description text not null,
  price numeric(10,2) not null default 0,
  portions text not null,
  image_url text,
  filling_ids text[] not null default '{}',
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fillings (
  id text primary key,
  name text not null,
  description text,
  extra_price numeric(10,2) not null default 0,
  color text not null default '#6f3e20',
  created_at timestamptz not null default now()
);

create table if not exists public.carousel_slides (
  id text primary key,
  title text not null,
  subtitle text,
  image_url text,
  target_type text not null default 'Catalogo'
    check (target_type in ('Producto', 'Catalogo', 'WhatsApp', 'Personalizado')),
  target_value text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.footer_config (
  id text primary key default 'main',
  brand_text text not null,
  address text,
  phone text,
  whatsapp text,
  facebook text,
  instagram text,
  tiktok text,
  copyright text,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  product text not null,
  filling text not null,
  portions text not null,
  delivery_mode text not null,
  delivery_date date,
  message text,
  status text not null default 'nuevo',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.servqual_responses (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  phone text,
  reliability_score integer check (reliability_score between 1 and 5),
  responsiveness_score integer check (responsiveness_score between 1 and 5),
  assurance_score integer check (assurance_score between 1 and 5),
  empathy_score integer check (empathy_score between 1 and 5),
  tangibles_score integer check (tangibles_score between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

insert into public.fillings (id, name, description, extra_price, color)
values
  ('relleno-maracuya', 'Maracuya', 'Relleno fresco, citrico y aromatico para celebraciones familiares.', 0, '#f1b43a'),
  ('relleno-menta', 'Menta', 'Toque refrescante para tortas clasicas con perfil moderno.', 5, '#82b99a'),
  ('relleno-chocolate', 'Chocolate', 'Relleno tradicional, intenso y de alta aceptacion.', 0, '#6f3e20')
on conflict (id) do nothing;

insert into public.products (id, name, category, description, price, portions, image_url, filling_ids, is_featured)
values
  ('torta-vintage', 'Torta clasica vintage', 'Tortas personalizadas', 'Torta tradicional desde 20 porciones con decoracion vintage, dedicatoria y toppers.', 180, '20 porciones', '', array['relleno-maracuya','relleno-chocolate'], true),
  ('minitorta-personalizada', 'Minitorta personalizada', 'Minitortas', 'Formato de 6 a 10 porciones para regalos, cumpleanos pequenos y reuniones intimas.', 85, '6 a 10 porciones', '', array['relleno-maracuya','relleno-menta','relleno-chocolate'], true),
  ('postre-individual', 'Postres individuales', 'Postres', 'Porciones dulces para antojos, meriendas y detalles personalizados.', 18, '1 porcion', '', array['relleno-chocolate'], false)
on conflict (id) do nothing;

insert into public.carousel_slides (id, title, subtitle, image_url, target_type, target_value, is_active)
values
  ('slide-tortas', 'Tortas clasicas con estilo vintage', 'Pedidos personalizados, toppers y rellenos de maracuya, menta o chocolate.', '', 'Producto', 'torta-vintage', true),
  ('slide-minitortas', 'Minitortas para momentos pequenos', 'La misma esencia de Dulce Miga en 6 a 10 porciones.', '', 'Producto', 'minitorta-personalizada', true)
on conflict (id) do nothing;

insert into public.footer_config (id, brand_text, address, phone, whatsapp, facebook, instagram, tiktok, copyright)
values (
  'main',
  'Dulce Miga acompana tus celebraciones con tortas clasicas, rellenos memorables y atencion personalizada.',
  'Pedidos desde domicilio y entregas coordinadas',
  '+591 70000000',
  '59170000000',
  'https://facebook.com/',
  'https://instagram.com/',
  'https://tiktok.com/',
  'Dulce Miga. Todos los derechos reservados.'
)
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.fillings enable row level security;
alter table public.carousel_slides enable row level security;
alter table public.footer_config enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.servqual_responses enable row level security;

drop policy if exists "public_can_read_products" on public.products;
create policy "public_can_read_products"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "admin_can_manage_products" on public.products;
create policy "admin_can_manage_products"
on public.products for all
to authenticated
using (true)
with check (true);

drop policy if exists "public_can_read_fillings" on public.fillings;
create policy "public_can_read_fillings"
on public.fillings for select
to anon, authenticated
using (true);

drop policy if exists "admin_can_manage_fillings" on public.fillings;
create policy "admin_can_manage_fillings"
on public.fillings for all
to authenticated
using (true)
with check (true);

drop policy if exists "public_can_read_carousel" on public.carousel_slides;
create policy "public_can_read_carousel"
on public.carousel_slides for select
to anon, authenticated
using (true);

drop policy if exists "admin_can_manage_carousel" on public.carousel_slides;
create policy "admin_can_manage_carousel"
on public.carousel_slides for all
to authenticated
using (true)
with check (true);

drop policy if exists "public_can_read_footer" on public.footer_config;
create policy "public_can_read_footer"
on public.footer_config for select
to anon, authenticated
using (true);

drop policy if exists "admin_can_manage_footer" on public.footer_config;
create policy "admin_can_manage_footer"
on public.footer_config for all
to authenticated
using (true)
with check (true);

drop policy if exists "allow_public_order_submissions" on public.orders;
create policy "allow_public_order_submissions"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "admin_can_read_orders" on public.orders;
create policy "admin_can_read_orders"
on public.orders for select
to authenticated
using (true);

drop policy if exists "allow_public_contact_messages" on public.contact_messages;
create policy "allow_public_contact_messages"
on public.contact_messages for insert
to anon
with check (true);

drop policy if exists "allow_public_servqual_responses" on public.servqual_responses;
create policy "allow_public_servqual_responses"
on public.servqual_responses for insert
to anon
with check (true);

insert into storage.buckets (id, name, public)
values ('dulce-miga', 'dulce-miga', true)
on conflict (id) do update set public = true;

drop policy if exists "public_can_read_dulce_miga_images" on storage.objects;
create policy "public_can_read_dulce_miga_images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'dulce-miga');

drop policy if exists "admin_can_upload_dulce_miga_images" on storage.objects;
create policy "admin_can_upload_dulce_miga_images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'dulce-miga');

drop policy if exists "admin_can_update_dulce_miga_images" on storage.objects;
create policy "admin_can_update_dulce_miga_images"
on storage.objects for update
to authenticated
using (bucket_id = 'dulce-miga')
with check (bucket_id = 'dulce-miga');

drop policy if exists "admin_can_delete_dulce_miga_images" on storage.objects;
create policy "admin_can_delete_dulce_miga_images"
on storage.objects for delete
to authenticated
using (bucket_id = 'dulce-miga');

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.fillings to anon, authenticated;
grant select on public.carousel_slides to anon, authenticated;
grant select on public.footer_config to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.contact_messages to anon;
grant insert on public.servqual_responses to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.fillings to authenticated;
grant select, insert, update, delete on public.carousel_slides to authenticated;
grant select, insert, update, delete on public.footer_config to authenticated;
grant select, update on public.orders to authenticated;
