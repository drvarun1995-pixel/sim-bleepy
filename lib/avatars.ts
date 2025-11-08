import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AvatarOption {
  slug: string
  file_path: string
  display_name?: string | null
}

const FALLBACK_LIBRARY: AvatarOption[] = [
  { slug: 'aurora-sunrise', file_path: 'avatars/avatar-01.svg', display_name: 'Aurora Sunrise' },
  { slug: 'ocean-calm', file_path: 'avatars/avatar-02.svg', display_name: 'Ocean Calm' },
  { slug: 'forest-hiker', file_path: 'avatars/avatar-03.svg', display_name: 'Forest Hiker' },
  { slug: 'desert-charm', file_path: 'avatars/avatar-04.svg', display_name: 'Desert Charm' },
  { slug: 'midnight-thinker', file_path: 'avatars/avatar-05.svg', display_name: 'Midnight Thinker' },
  { slug: 'city-dreamer', file_path: 'avatars/avatar-06.svg', display_name: 'City Dreamer' },
  { slug: 'starlit-guide', file_path: 'avatars/avatar-07.svg', display_name: 'Starlit Guide' },
  { slug: 'sunset-scholar', file_path: 'avatars/avatar-08.svg', display_name: 'Sunset Scholar' },
  { slug: 'sage-mentor', file_path: 'avatars/avatar-09.svg', display_name: 'Sage Mentor' },
  { slug: 'radiant-innovator', file_path: 'avatars/avatar-10.svg', display_name: 'Radiant Innovator' },
  { slug: 'calm-navigator', file_path: 'avatars/avatar-11.svg', display_name: 'Calm Navigator' },
  { slug: 'bold-explorer', file_path: 'avatars/avatar-12.svg', display_name: 'Bold Explorer' },
]

export async function loadAvatarLibrary(supabase: SupabaseClient): Promise<AvatarOption[]> {
  const { data, error } = await supabase
    .from('profile_avatar_library')
    .select('slug, file_path, display_name, is_active')
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error) {
    console.warn('Falling back to local avatar library due to Supabase error:', error)
    return FALLBACK_LIBRARY
  }

  if (!data || data.length === 0) {
    return FALLBACK_LIBRARY
  }

  return data.map(({ slug, file_path, display_name }) => ({
    slug,
    file_path,
    display_name,
  }))
}

export function pickDeterministicAvatar(userId: string, library: AvatarOption[]): AvatarOption | null {
  if (!userId || library.length === 0) {
    return null
  }

  const hash = crypto.createHash('sha256').update(userId).digest()
  const numeric = hash.readUInt32BE(0)
  const index = numeric % library.length
  return library[index] ?? null
}

export async function ensureUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  avatarType?: string | null,
  avatarAsset?: string | null,
  libraryOverride?: AvatarOption[]
): Promise<{ avatar_type: string; avatar_asset: string } | null> {
  if (avatarType && avatarAsset) {
    return { avatar_type: avatarType, avatar_asset: avatarAsset }
  }

  const library = libraryOverride ?? (await loadAvatarLibrary(supabase))
  const choice = pickDeterministicAvatar(userId, library)

  if (!choice) {
    return null
  }

  const { error } = await supabase
    .from('users')
    .update({
      avatar_type: 'library',
      avatar_asset: choice.file_path,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to assign default avatar:', error)
    return null
  }

  return { avatar_type: 'library', avatar_asset: choice.file_path }
}

export function resolveLibrarySelection(
  library: AvatarOption[],
  identifier?: string | null
): AvatarOption | null {
  if (!identifier) return null

  return (
    library.find((option) => option.slug === identifier) ??
    library.find((option) => option.file_path === identifier) ??
    null
  )
}

