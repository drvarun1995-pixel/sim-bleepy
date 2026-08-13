import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEmailPrefsToken } from '@/lib/email-preference-token'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type PrefsUser = {
  id: string
  email: string
  name: string | null
  marketing_consent: boolean | null
  analytics_consent: boolean | null
  consent_version: string | null
}

function clientMeta(request: NextRequest) {
  return {
    ip_address:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  }
}

async function loadUserFromToken(
  token: string | null
): Promise<{ user: PrefsUser } | { error: string; status: 401 | 404 }> {
  const payload = verifyEmailPrefsToken(token)
  if (!payload) return { error: 'Invalid or expired link', status: 401 }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, marketing_consent, analytics_consent, consent_version')
    .eq('id', payload.userId)
    .maybeSingle()

  if (error || !user) {
    return { error: 'Account not found', status: 404 }
  }

  if ((user.email || '').toLowerCase() !== payload.email) {
    return { error: 'Invalid or expired link', status: 401 }
  }

  return { user: user as PrefsUser }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`
}

/** GET — load prefs for a signed email link (no login) */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const result = await loadUserFromToken(token)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { user } = result
    return NextResponse.json({
      emailMasked: maskEmail(user.email),
      name: user.name?.split(/\s+/)[0] || null,
      marketing_consent: user.marketing_consent !== false,
      analytics_consent: !!user.analytics_consent,
      consent_version: user.consent_version || '1.1',
    })
  } catch (error) {
    console.error('GET /api/email-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PUT — update prefs via signed email link (no login) */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token : null
    const result = await loadUserFromToken(token)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { user } = result
    const marketing =
      typeof body.marketing_consent === 'boolean' ? body.marketing_consent : null
    const analytics =
      typeof body.analytics_consent === 'boolean' ? body.analytics_consent : null

    if (marketing === null && analytics === null) {
      return NextResponse.json({ error: 'No preferences provided' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      consent_timestamp: new Date().toISOString(),
      consent_version: body.consent_version || '1.1',
      updated_at: new Date().toISOString(),
    }
    if (marketing !== null) updates.marketing_consent = marketing
    if (analytics !== null) updates.analytics_consent = analytics

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, marketing_consent, analytics_consent, consent_timestamp')
      .single()

    if (updateError || !updated) {
      console.error('email-preferences update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    const meta = clientMeta(request)
    try {
      await supabase.from('consent_audit_log').insert({
        user_id: user.id,
        action: 'email_link_preferences_updated',
        old_values: JSON.stringify({
          marketing_consent: user.marketing_consent,
          analytics_consent: user.analytics_consent,
        }),
        new_values: JSON.stringify({
          marketing_consent: updated.marketing_consent,
          analytics_consent: updated.analytics_consent,
        }),
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
        timestamp: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error('email-preferences audit failed:', auditError)
    }

    return NextResponse.json({
      success: true,
      marketing_consent: updated.marketing_consent !== false,
      analytics_consent: !!updated.analytics_consent,
    })
  } catch (error) {
    console.error('PUT /api/email-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
