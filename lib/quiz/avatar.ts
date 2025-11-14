import { withProfilePictureVersion } from '@/lib/profile-picture'

type AvatarLike = {
  profile_picture_url?: string | null
  profile_picture_updated_at?: string | null
  avatar_thumbnail?: string | null
  avatar_asset?: string | null
  avatar_type?: string | null
} | null | undefined

const normalizeAssetPath = (path?: string | null): string | null => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return path.startsWith('/') ? path : `/${path}`
}

const normalizeWithVersion = (path?: string | null, updatedAt?: string | null): string | null => {
  return withProfilePictureVersion(normalizeAssetPath(path), updatedAt)
}

export const resolveUserAvatar = (user: AvatarLike): string | null => {
  if (!user) return null
  const avatarType = (user.avatar_type || '').toLowerCase()

  const profileUrl = withProfilePictureVersion(user.profile_picture_url, user.profile_picture_updated_at)
  const normalizedThumb = normalizeWithVersion(user.avatar_thumbnail, user.profile_picture_updated_at)
  const normalizedAsset = normalizeWithVersion(user.avatar_asset, user.profile_picture_updated_at)

  if (avatarType === 'upload') {
    return profileUrl || normalizedThumb || normalizedAsset || null
  }

  if (avatarType === 'library') {
    return normalizedThumb || normalizedAsset || null
  }

  return profileUrl || normalizedThumb || normalizedAsset || null
}

