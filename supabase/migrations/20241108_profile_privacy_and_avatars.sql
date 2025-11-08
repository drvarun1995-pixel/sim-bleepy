-- Profile privacy & avatar enhancements

-- Add new profile fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_display_name TEXT,
  ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'library',
  ADD COLUMN IF NOT EXISTS avatar_asset TEXT;

-- Ensure display names are unique when profiles are public
CREATE UNIQUE INDEX IF NOT EXISTS users_public_display_name_unique
  ON public.users (public_display_name)
  WHERE public_display_name IS NOT NULL AND is_public IS TRUE;

-- Library of default avatars served from /public/avatars/*
CREATE TABLE IF NOT EXISTS public.profile_avatar_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Seed curated avatar set (idempotent inserts)
INSERT INTO public.profile_avatar_library (slug, file_path, display_name)
VALUES
  ('aurora-sunrise', 'avatars/avatar-01.svg', 'Aurora Sunrise'),
  ('ocean-calm', 'avatars/avatar-02.svg', 'Ocean Calm'),
  ('forest-hiker', 'avatars/avatar-03.svg', 'Forest Hiker'),
  ('desert-charm', 'avatars/avatar-04.svg', 'Desert Charm'),
  ('midnight-thinker', 'avatars/avatar-05.svg', 'Midnight Thinker'),
  ('city-dreamer', 'avatars/avatar-06.svg', 'City Dreamer'),
  ('starlit-guide', 'avatars/avatar-07.svg', 'Starlit Guide'),
  ('sunset-scholar', 'avatars/avatar-08.svg', 'Sunset Scholar'),
  ('sage-mentor', 'avatars/avatar-09.svg', 'Sage Mentor'),
  ('radiant-innovator', 'avatars/avatar-10.svg', 'Radiant Innovator'),
  ('calm-navigator', 'avatars/avatar-11.svg', 'Calm Navigator'),
  ('bold-explorer', 'avatars/avatar-12.svg', 'Bold Explorer')
ON CONFLICT (slug) DO UPDATE
SET file_path = EXCLUDED.file_path,
    display_name = EXCLUDED.display_name,
    is_active = TRUE;

