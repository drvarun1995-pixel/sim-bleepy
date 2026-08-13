import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function requireYearProgressionAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: 'Unauthorized', status: 401 as const }
  }
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role')
    .eq('email', session.user.email)
    .maybeSingle()
  if (!user) return { error: 'User not found', status: 404 as const }
  if (!['admin', 'meded_team'].includes(user.role)) {
    return { error: 'Forbidden', status: 403 as const }
  }
  return { user }
}
