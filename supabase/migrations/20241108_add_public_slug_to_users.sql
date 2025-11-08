-- Add public slug support for user profiles

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_public_slug_unique
  ON public.users (public_slug)
  WHERE public_slug IS NOT NULL;


