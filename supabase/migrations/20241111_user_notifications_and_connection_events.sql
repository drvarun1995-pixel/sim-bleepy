create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx on public.user_notifications(user_id, created_at desc);
create index if not exists user_notifications_unread_idx on public.user_notifications(user_id) where read_at is null;

alter table public.user_notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notifications'
      and policyname = 'User can select own notifications'
  ) then
    create policy "User can select own notifications"
      on public.user_notifications
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notifications'
      and policyname = 'User can update own notifications'
  ) then
    create policy "User can update own notifications"
      on public.user_notifications
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.connection_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  counterpart_id uuid references public.users(id) on delete set null,
  connection_id uuid references public.user_connections(id) on delete set null,
  event_type text not null check (event_type in ('request_sent','request_reopened','request_accepted','request_declined','request_blocked','request_reported')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists connection_events_type_idx on public.connection_events(event_type, created_at desc);
create index if not exists connection_events_connection_idx on public.connection_events(connection_id);
