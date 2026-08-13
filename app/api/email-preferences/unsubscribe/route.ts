import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEmailPrefsToken } from '@/lib/email-preference-token'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * One-click unsubscribe via signed email link (no login).
 * Sets marketing_consent = false so the user is excluded from marketing/admin list sends.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token =
      typeof body.token === 'string'
        ? body.token
        : request.nextUrl.searchParams.get('token')

    const payload = verifyEmailPrefsToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, marketing_consent')
      .eq('id', payload.userId)
      .maybeSingle()

    if (error || !user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if ((user.email || '').toLowerCase() !== payload.email) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 401 })
    }

    if (user.marketing_consent === false) {
      return NextResponse.json({
        success: true,
        alreadyUnsubscribed: true,
        message: 'You were already unsubscribed from marketing emails.',
      })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        marketing_consent: false,
        consent_timestamp: new Date().toISOString(),
        consent_version: '1.1',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('unsubscribe update failed:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    try {
      await supabase.from('consent_audit_log').insert({
        user_id: user.id,
        action: 'email_link_unsubscribed',
        old_values: JSON.stringify({ marketing_consent: user.marketing_consent }),
        new_values: JSON.stringify({ marketing_consent: false }),
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error('unsubscribe audit failed:', auditError)
    }

    return NextResponse.json({
      success: true,
      alreadyUnsubscribed: false,
      message: 'You have been unsubscribed from Bleepy marketing emails.',
    })
  } catch (error) {
    console.error('POST /api/email-preferences/unsubscribe:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
