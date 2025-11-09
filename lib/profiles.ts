import type { SupabaseClient } from '@supabase/supabase-js'

const STAFF_ROLES = ['admin', 'meded_team', 'ctf']

export interface ViewerContext {
  id?: string | null
  role?: string | null
}

export interface ProfileRecord {
  id: string
  public_slug?: string | null
  role?: string | null
  name: string | null
  public_display_name: string | null
  profile_picture_url: string | null
  avatar_type: string | null
  avatar_asset: string | null
  avatar_thumbnail?: string | null
  is_public: boolean | null
  allow_messages: boolean | null
  created_at?: string | null
  role_type?: string | null
  university?: string | null
  hospital_trust?: string | null
  specialty?: string | null
  study_year?: string | null
  foundation_year?: string | null
  tagline?: string | null
  about_me?: string | null
  interests?: string[] | null
}

const disallowedChars = /[^a-z0-9]+/g

const roleLabels: Record<string, string> = {
  medical_student: 'Medical Student',
  foundation_doctor: 'Foundation Year Doctor',
  clinical_fellow: 'Clinical Fellow',
  specialty_doctor: 'Specialty Doctor',
  registrar: 'Registrar',
  consultant: 'Consultant',
}

const interestLabels: Record<string, string> = {
  clinical_skills: 'Clinical Skills',
  research: 'Research & Academia',
  surgery: 'Surgery',
  medicine: 'Medicine',
  pediatrics: 'Pediatrics',
  emergency: 'Emergency Medicine',
  psychiatry: 'Psychiatry',
  radiology: 'Radiology',
  orthopedics: 'Orthopedics',
  cardiology: 'Cardiology',
  oncology: 'Oncology',
  neurology: 'Neurology',
}

const platformRoleLabels: Record<string, string> = {
  student: 'Student',
  educator: 'Educator',
  admin: 'Admin',
  meded_team: 'MedEd Team',
  meded: 'MedEd',
  ctf: 'CTF',
}

export const formatRoleLabel = (roleType?: string | null): string | null => {
  if (!roleType) return null
  return roleLabels[roleType] ?? roleType.replace(/_/g, ' ')
}

export const formatInterestLabels = (values?: string[] | null): string[] => {
  if (!values?.length) return []
  return values.map(value => interestLabels[value] ?? value.replace(/_/g, ' '))
}

export const formatPlatformRoleLabel = (role?: string | null): string | null => {
  if (!role) return null
  return platformRoleLabels[role] ?? role.replace(/_/g, ' ')
}

const slugBase = (fullName?: string | null): string => {
  if (!fullName) return 'user'
  const normalized = fullName
    .toLowerCase()
    .trim()
    .replace(disallowedChars, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized.length > 0 ? normalized : 'user'
}

const randomSuffix = (): string => {
  const value = Math.floor(1000 + Math.random() * 9000)
  return value.toString()
}

export async function ensureUserSlug(
  supabase: SupabaseClient,
  userId: string,
  name?: string | null,
  currentSlug?: string | null
): Promise<string | null> {
  if (currentSlug) {
    return currentSlug
  }

  const base = slugBase(name)

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${base}-${randomSuffix()}`

    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('public_slug', candidate)
      .maybeSingle()

    if (lookupError) {
      console.error('Error checking slug availability:', lookupError)
      continue
    }

    if (!existing || existing.id === userId) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ public_slug: candidate })
        .eq('id', userId)

      if (updateError) {
        console.error('Error assigning profile slug:', updateError)
        continue
      }

      return candidate
    }
  }

  return null
}

export const canViewProfile = (
  record: ProfileRecord,
  viewer: ViewerContext,
  options?: { viewerIsConnection?: boolean }
): boolean => {
  const viewerId = viewer.id ?? null
  const viewerRole = viewer.role ?? null
  const viewerIsOwner = Boolean(viewerId && viewerId === record.id)
  const viewerIsStaff = Boolean(viewerRole && STAFF_ROLES.includes(viewerRole))

  if (record.is_public) return true
  if (viewerIsOwner) return true
  if (viewerIsStaff) return true
  if (options?.viewerIsConnection) return true

  return false
}

export const buildPublicProfilePayload = (
  record: ProfileRecord,
  viewer: ViewerContext,
  options?: { viewerIsConnection?: boolean }
) => {
  const viewerId = viewer.id ?? null
  const viewerRole = viewer.role ?? null
  const viewerIsOwner = Boolean(viewerId && viewerId === record.id)
  const viewerIsStaff = Boolean(viewerRole && STAFF_ROLES.includes(viewerRole))
  const viewerIsConnection = Boolean(options?.viewerIsConnection)
  const isPublic = Boolean(record.is_public)
  const platformRole = formatPlatformRoleLabel(record.role)
  const roleTypeLabel = formatRoleLabel(record.role_type)
  const shouldShowRoleType =
    Boolean(record.role_type && record.role_type !== 'meded_team')

  const displayName =
    record.public_display_name?.trim() ||
    record.name?.trim() ||
    'Bleepy User'

  let avatarUrl: string | null = null
  if (record.avatar_type === 'upload') {
    avatarUrl = record.profile_picture_url || record.avatar_asset || null
  } else if (record.avatar_asset) {
    avatarUrl = record.avatar_asset.startsWith('/') ? record.avatar_asset : `/${record.avatar_asset}`
  }

  const avatarThumbnail = record.avatar_thumbnail
    ? record.avatar_thumbnail.startsWith('/')
      ? record.avatar_thumbnail
      : `/${record.avatar_thumbnail}`
    : null

  const interests = formatInterestLabels(record.interests)

  return {
    viewer: {
      isOwner: viewerIsOwner,
      isStaff: viewerIsStaff,
      isConnection: viewerIsConnection,
    },
    profile: {
      id: record.id,
      slug: record.public_slug ?? null,
      displayName,
      avatarUrl,
      avatarType: record.avatar_type ?? 'library',
      avatarThumbnail,
      isPublic,
      allowMessages: Boolean(record.allow_messages),
      platformRole,
      roleType: shouldShowRoleType ? roleTypeLabel : null,
      university: record.university,
      studyYear: record.study_year,
      foundationYear: record.foundation_year,
      specialty: record.specialty,
      hospitalTrust: record.hospital_trust,
      tagline: record.tagline,
      about: record.about_me,
      interests,
      createdAt: record.created_at,
    },
  }
}


