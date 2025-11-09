import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase'

export type ConnectionType = 'friend' | 'mentor'
export type ConnectionStatus = 'pending' | 'accepted' | 'blocked' | 'snoozed' | 'declined'

export interface ConnectionRecord {
  id: string
  requester_id: string
  addressee_id: string
  connection_type: ConnectionType
  status: ConnectionStatus
  initiated_by_requester: boolean
  requested_at: string
  responded_at: string | null
  snoozed_until: string | null
  notes: string | null
}

export const STAFF_ROLES = ['admin', 'meded_team', 'ctf'] as const

export const isStaffRole = (role?: string | null): boolean => {
  if (!role) return false
  return STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])
}

export const fetchExistingConnection = async (
  userId: string,
  targetId: string,
  type: ConnectionType
): Promise<ConnectionRecord | null> => {
  const { data, error }: PostgrestSingleResponse<ConnectionRecord> = await supabaseAdmin
    .from('user_connections')
    .select('*')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${targetId},connection_type.eq.${type}),and(requester_id.eq.${targetId},addressee_id.eq.${userId},connection_type.eq.${type})`
    )
    .order('requested_at', { ascending: false })
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch connection', error)
  }

  return data ?? null
}

export const getConnectionParticipantId = (
  connection: ConnectionRecord,
  viewerId: string
): string => {
  if (connection.requester_id === viewerId) {
    return connection.addressee_id
  }
  return connection.requester_id
}

export const CONNECTION_ACTIONS = {
  ACCEPT: 'accept',
  DECLINE: 'decline',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  SNOOZE: 'snooze',
  UNSNOOZE: 'unsnooze',
  REMOVE: 'remove',
} as const

export type ConnectionAction = (typeof CONNECTION_ACTIONS)[keyof typeof CONNECTION_ACTIONS]

export interface ProfileSummary {
  id: string
  name: string | null
  public_display_name: string | null
  public_slug: string | null
  is_public: boolean | null
  allow_messages: boolean | null
  avatar_type: string | null
  avatar_asset: string | null
  avatar_thumbnail?: string | null
  profile_picture_url: string | null
  role: string | null
  role_type: string | null
  university: string | null
  specialty: string | null
}

export interface ConnectionListItem extends ConnectionRecord {
  counterpart: ProfileSummary
  initiated_by_viewer: boolean
  mutual_connection_count: number
  mutual_connection_ids: string[]
}

export const buildProfileSummary = (record: any): ProfileSummary => ({
  id: record?.id ?? '',
  name: record?.name ?? null,
  public_display_name: record?.public_display_name ?? null,
  public_slug: record?.public_slug ?? null,
  is_public: record?.is_public ?? null,
  allow_messages: record?.allow_messages ?? null,
  avatar_type: record?.avatar_type ?? null,
  avatar_asset: record?.avatar_asset ?? null,
  avatar_thumbnail: record?.avatar_thumbnail ?? null,
  profile_picture_url: record?.profile_picture_url ?? null,
  role: record?.role ?? null,
  role_type: record?.role_type ?? null,
  university: record?.university ?? null,
  specialty: record?.specialty ?? null,
})
