create extension if not exists pgcrypto;

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

alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.servqual_responses enable row level security;

drop policy if exists "allow_public_order_submissions" on public.orders;
create policy "allow_public_order_submissions"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "allow_public_contact_messages" on public.contact_messages;
create policy "allow_public_contact_messages"
on public.contact_messages
for insert
to anon
with check (true);

drop policy if exists "allow_public_servqual_responses" on public.servqual_responses;
create policy "allow_public_servqual_responses"
on public.servqual_responses
for insert
to anon
with check (true);

grant usage on schema public to anon;
grant insert on public.orders to anon;
grant insert on public.contact_messages to anon;
grant insert on public.servqual_responses to anon;
