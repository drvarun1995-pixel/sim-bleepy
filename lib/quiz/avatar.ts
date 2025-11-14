type AvatarLike = {
  profile_picture_url?: string | null
  avatar_thumbnail?: string | null
  avatar_asset?: string | null
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
  return (
    user.profile_picture_url ||
    normalizeAssetPath(user.avatar_thumbnail) ||
    normalizeAssetPath(user.avatar_asset) ||
    null
  )
}

