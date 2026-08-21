import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  buildWeeklyNewsletterEmail,
  defaultWeeklyNewsletter,
  type WeeklyNewsletterData,
} from '@/lib/email-templates/newsletter'
import { personalizeEmailPlaceholders } from '@/lib/email-templates/layout'
import {
  NEWSLETTER_PREVIEW_PERSONAS,
  loadNewsletterWeekContent,
  personalizeNewsletterHtml,
} from '@/lib/email-templates/newsletter-personalize'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || !['admin', 'meded_team'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = (await request.json()) as {
      data?: WeeklyNewsletterData
      persona?: string
    }

    const personaKey = body.persona && NEWSLETTER_PREVIEW_PERSONAS[body.persona] ? body.persona : 'all'
    const persona = NEWSLETTER_PREVIEW_PERSONAS[personaKey]
    const newsletter = { ...defaultWeeklyNewsletter(), ...(body.data || {}) }
    const built = buildWeeklyNewsletterEmail(newsletter)
    const week = await loadNewsletterWeekContent()
    const html = personalizeEmailPlaceholders(
      personalizeNewsletterHtml(built.html, persona.profile, week),
      persona.profile.name
    )

    return NextResponse.json({
      subject: built.subject,
      html,
      persona: personaKey,
      personaLabel: persona.label,
      eventCount: week.events.length,
    })
  } catch (error) {
    console.error('Newsletter preview failed:', error)
    return NextResponse.json({ error: 'Failed to build newsletter preview' }, { status: 500 })
  }
}
