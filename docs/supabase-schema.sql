create table if not exists public.site_content (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

comment on table public.site_content is 'MOSSA public website and admin-editable content. The Node server reads and writes this table with the Supabase service role key.';
