import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

/**
 * Lock diagnostic / test API routes. Returns 404 (not 403) to avoid advertising them.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return null
}
