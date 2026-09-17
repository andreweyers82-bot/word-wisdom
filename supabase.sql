create extension if not exists pgcrypto;
create table if not exists public.ww_records (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ww_records_table_name_idx on public.ww_records(table_name);

alter table public.ww_records enable row level security;
-- Server-side access uses SUPABASE_SERVICE_ROLE_KEY. Keep direct public access closed.

insert into storage.buckets (id,name,public)
values ('word-wisdom','word-wisdom',false)
on conflict (id) do nothing;
