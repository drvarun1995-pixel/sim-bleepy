alter table if exists public.connection_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'connection_events'
      and policyname = 'Service role full access to connection_events'
  ) then
    create policy "Service role full access to connection_events"
      on public.connection_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'connection_events'
      and policyname = 'Staff can view connection events'
  ) then
    create policy "Staff can view connection events"
      on public.connection_events
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role in ('admin','meded_team','ctf')
        )
      );
  end if;
end
$$;
