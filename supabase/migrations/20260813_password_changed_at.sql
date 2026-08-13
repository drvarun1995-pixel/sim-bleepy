-- Invalidate Remember-me JWTs after a password reset or password change.
alter table public.users
  add column if not exists password_changed_at timestamptz;

comment on column public.users.password_changed_at is
  'Set when the password is reset or changed. Sessions issued before this timestamp are rejected.';
