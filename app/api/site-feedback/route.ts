import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminContactFormNotification } from '@/lib/email'
import {
  formatSiteFeedbackMessage,
  isFeedbackPathway,
  isFeedbackRecommend,
  sanitiseMostUseful,
} from '@/lib/site-feedback'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyRecaptcha(token: string): Promise<boolean> {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
  if (!recaptchaSecret) return true

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${recaptchaSecret}&response=${token}`,
    })
    const data = await response.json()
    return data.success && data.score >= 0.5
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}

/**
 * Public website feedback (no login).
 * Stored in contact_messages with category website_feedback for the existing admin inbox.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const rating = body.rating != null ? Number(body.rating) : null
    const message = String(body.message || '').trim()
    const source = String(body.source || 'website').trim().slice(0, 80)
    const pathwayRaw = String(body.pathway || '').trim()
    const recommendRaw = String(body.recommend || '').trim()
    const mostUseful = sanitiseMostUseful(body.mostUseful)
    const quoteConsent = body.quoteConsent === true
    const recaptchaToken = body.recaptchaToken as string | undefined

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and feedback are required' }, { status: 400 })
    }

    if (!isFeedbackPathway(pathwayRaw)) {
      return NextResponse.json({ error: 'Please select your role on Bleepy' }, { status: 400 })
    }

    if (!isFeedbackRecommend(recommendRaw)) {
      return NextResponse.json(
        { error: 'Please say whether you would recommend Bleepy' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Please write at least 10 characters of feedback' },
        { status: 400 }
      )
    }

    if (rating == null || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Please give a rating between 1 and 5' }, { status: 400 })
    }

    if (recaptchaToken) {
      const ok = await verifyRecaptcha(recaptchaToken)
      if (!ok) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    const subjectParts = ['Website feedback']
    subjectParts.push(`${rating}/5`)
    if (recommendRaw === 'yes') subjectParts.push('would recommend')
    if (source && source !== 'website') subjectParts.push(`via ${source}`)

    const fullMessage = formatSiteFeedbackMessage({
      source,
      pathway: pathwayRaw,
      rating,
      recommend: recommendRaw,
      mostUseful,
      quoteConsent,
      message,
    })

    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          subject: subjectParts.join(' · '),
          category: 'website_feedback',
          message: fullMessage,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('site-feedback insert failed:', error)
      return NextResponse.json({ error: 'Failed to save feedback. Please try again.' }, { status: 500 })
    }

    if (data?.[0]?.id) {
      sendAdminContactFormNotification({
        contactId: data[0].id,
        name,
        email,
        subject: subjectParts.join(' · '),
        category: 'website_feedback',
        message: fullMessage,
        submissionTime: new Date().toISOString(),
      }).catch((err) => console.error('site-feedback admin notify failed:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you — your feedback has been received.',
      id: data?.[0]?.id,
    })
  } catch (error) {
    console.error('POST /api/site-feedback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
