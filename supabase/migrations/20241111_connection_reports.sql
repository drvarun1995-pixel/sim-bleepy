create table if not exists public.connection_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  connection_id uuid references public.user_connections(id) on delete set null,
  reason text not null,
  notes text,
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  created_at timestamptz not null default now()
);

create index if not exists connection_reports_reporter_idx on public.connection_reports(reporter_id, created_at desc);
create index if not exists connection_reports_target_idx on public.connection_reports(target_user_id, created_at desc);

alter table public.connection_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'connection_reports'
      and policyname = 'Allow service role access'
  ) then
    create policy "Allow service role access"
      on public.connection_reports
      for all
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end
$$;
