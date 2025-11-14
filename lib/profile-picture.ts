export const PROFILE_PICTURE_VERSION_PARAM = 'ver'

const buildVersionString = (updatedAt?: string | null): string | null => {
  if (!updatedAt) {
    return null
  }

  const parsed = Date.parse(updatedAt)
  if (!Number.isNaN(parsed)) {
    return String(parsed)
  }

  return encodeURIComponent(updatedAt)
}

export const withProfilePictureVersion = (
  url?: string | null,
  updatedAt?: string | null
): string | null => {
  if (!url) {
    return null
  }

  const version = buildVersionString(updatedAt)
  if (!version) {
    return url
  }

  const [base, query = ''] = url.split('?')
  const params = new URLSearchParams(query)
  params.set(PROFILE_PICTURE_VERSION_PARAM, version)
  const queryString = params.toString()
  return queryString ? `${base}?${queryString}` : base
}

