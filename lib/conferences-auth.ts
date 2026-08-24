import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageConferences } from '@/lib/roles'
import { supabaseAdmin } from '@/utils/supabase'

export type ConferenceUser = {
  id: string
  email: string
  role: string
  specialty: string | null
  role_type: string | null
}

export async function getConferenceSessionUser(): Promise<ConferenceUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, role, specialty, role_type')
    .eq('email', session.user.email)
    .single()

  if (!user?.id) return null
  return user as ConferenceUser
}

export function assertStaff(user: ConferenceUser | null) {
  if (!user) return { ok: false as const, status: 401 as const, error: 'Unauthorized' }
  if (!canManageConferences(user.role)) {
    return { ok: false as const, status: 403 as const, error: 'Forbidden' }
  }
  return { ok: true as const, user }
}
