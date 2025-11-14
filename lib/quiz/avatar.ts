type AvatarLike = {
  profile_picture_url?: string | null
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

export const resolveUserAvatar = (user: AvatarLike): string | null => {
  if (!user) return null
  const avatarType = (user.avatar_type || '').toLowerCase()
  const normalizedThumb = normalizeAssetPath(user.avatar_thumbnail)
  const normalizedAsset = normalizeAssetPath(user.avatar_asset)

  if (avatarType === 'upload') {
    return user.profile_picture_url || normalizedThumb || normalizedAsset || null
  }

  if (avatarType === 'library') {
    return normalizedThumb || normalizedAsset || null
  }

  return user.profile_picture_url || normalizedThumb || normalizedAsset || null
}

