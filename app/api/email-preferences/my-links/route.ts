import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { buildEmailActionUrls } from '@/lib/email-preference-token'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Authenticated helper: signed preference / unsubscribe URLs for the current user (preview & testing). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .maybeSingle()

    if (error || !user?.id || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const urls = buildEmailActionUrls({ userId: user.id, email: user.email })
    return NextResponse.json({
      preferencesUrl: urls.preferencesUrl,
      unsubscribeUrl: urls.unsubscribeUrl,
    })
  } catch (error) {
    console.error('GET /api/email-preferences/my-links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
