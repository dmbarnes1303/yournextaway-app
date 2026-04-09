-- supabase/migrations/20260408_partner_tracking_spine.sql

create extension if not exists pgcrypto;

create table if not exists public.partner_clicks (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  saved_item_id text null,
  partner_id text not null,
  partner_category text not null,
  partner_tier text not null check (partner_tier in ('tier1', 'tier2')),
  url text not null,
  source_surface text null,
  source_section text null,
  status text not null check (status in ('clicked', 'returned', 'converted', 'abandoned')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  returned_at timestamptz null,
  converted_at timestamptz null
);

create index if not exists partner_clicks_trip_id_idx on public.partner_clicks (trip_id);
create index if not exists partner_clicks_saved_item_id_idx on public.partner_clicks (saved_item_id);
create index if not exists partner_clicks_partner_id_idx on public.partner_clicks (partner_id);
create index if not exists partner_clicks_status_idx on public.partner_clicks (status);
create index if not exists partner_clicks_created_at_idx on public.partner_clicks (created_at desc);

create table if not exists public.partner_conversions (
  id uuid primary key default gen_random_uuid(),
  partner_click_id uuid not null unique references public.partner_clicks(id) on delete cascade,
  trip_id text not null,
  saved_item_id text not null,
  partner_id text not null,
  saved_item_type text not null,
  booking_status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists partner_conversions_trip_id_idx on public.partner_conversions (trip_id);
create index if not exists partner_conversions_saved_item_id_idx on public.partner_conversions (saved_item_id);
create index if not exists partner_conversions_partner_id_idx on public.partner_conversions (partner_id);
create index if not exists partner_conversions_created_at_idx on public.partner_conversions (created_at desc);

create table if not exists public.partner_events (
  id uuid primary key default gen_random_uuid(),
  partner_click_id uuid null references public.partner_clicks(id) on delete set null,
  trip_id text null,
  saved_item_id text null,
  event_name text not null,
  partner_id text null,
  source_surface text null,
  source_section text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists partner_events_partner_click_id_idx on public.partner_events (partner_click_id);
create index if not exists partner_events_trip_id_idx on public.partner_events (trip_id);
create index if not exists partner_events_saved_item_id_idx on public.partner_events (saved_item_id);
create index if not exists partner_events_event_name_idx on public.partner_events (event_name);
create index if not exists partner_events_partner_id_idx on public.partner_events (partner_id);
create index if not exists partner_events_created_at_idx on public.partner_events (created_at desc);
