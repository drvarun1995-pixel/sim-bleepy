-- Brute-force protection for Bleepy auth endpoints (Cyber Essentials)
create table if not exists public.auth_rate_limits (
  rate_key text primary key,
  failed_attempts integer not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists auth_rate_limits_locked_until_idx
  on public.auth_rate_limits (locked_until)
  where locked_until is not null;

alter table public.auth_rate_limits enable row level security;

-- Service role only (no public access)
create policy "Service role manages auth rate limits"
  on public.auth_rate_limits
  for all
  using (false)
  with check (false);

comment on table public.auth_rate_limits is 'Tracks failed login/forgot-password attempts for brute-force protection';
