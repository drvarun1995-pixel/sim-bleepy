import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendCustomHtmlEmail } from '@/lib/email'
import { randomUUID } from 'crypto'
import { absolutizeEmailImageUrls, promoteAdminEmailImages } from '@/lib/admin-email-images'

const MAX_INDIVIDUAL_RECIPIENTS = 50

export const dynamic = 'force-dynamic'

interface SendEmailPayload {
  subject?: string
  html?: string
  recipientScope?: 'all' | 'role' | 'individual'
  recipientRoles?: string[]
  recipientIds?: string[]
  draftId?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sender } = await supabaseAdmin
      .from('users')
      .select('id, role, name, email')
      .eq('email', session.user.email)
      .single()

    if (!sender || !['admin', 'meded_team'].includes(sender.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = (await request.json()) as SendEmailPayload
    const subject = (body.subject || '').trim()
    const html = (body.html || '').trim()
    const recipientScope = body.recipientScope || 'individual'
    const draftId = body.draftId || null

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    if (!html) {
      return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
    }

    let recipientsQuery = supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .not('email', 'is', null)

    if (recipientScope === 'role') {
      const roles = Array.from(new Set(body.recipientRoles || [])).filter(Boolean)
      if (roles.length === 0) {
        return NextResponse.json({ error: 'At least one role must be selected' }, { status: 400 })
      }
      recipientsQuery = recipientsQuery.in('role', roles)
    } else if (recipientScope === 'individual') {
      const ids = Array.from(new Set(body.recipientIds || [])).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: 'Please select at least one recipient' }, { status: 400 })
      }
      if (ids.length > MAX_INDIVIDUAL_RECIPIENTS) {
        return NextResponse.json({ error: `You can only send to ${MAX_INDIVIDUAL_RECIPIENTS} users at a time` }, { status: 400 })
      }
      recipientsQuery = recipientsQuery.in('id', ids)
    }

    const { data: recipientsData, error: recipientsError } = await recipientsQuery
    if (recipientsError) {
      console.error('Failed to fetch recipients:', recipientsError)
      return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 })
    }

    const recipients = (recipientsData || []).filter((user) => !!user.email)
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for the selected criteria' }, { status: 400 })
    }

    const dedupedRecipients = []
    const seenEmails = new Set<string>()
    for (const recipient of recipients) {
      const email = (recipient.email || '').toLowerCase()
      if (!email || seenEmails.has(email)) continue
      seenEmails.add(email)
      dedupedRecipients.push(recipient)
    }

    if (dedupedRecipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are missing email addresses' }, { status: 400 })
    }

    // Prepare HTML (promote images + set absolute URLs)
    const logId = randomUUID()
    const { html: promotedHtml } = await promoteAdminEmailImages({
      draftId,
      html,
      logId,
    })

    // Use the production URL if available, otherwise construct from environment
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    
    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`
      } else if (process.env.NEXTAUTH_URL) {
        baseUrl = process.env.NEXTAUTH_URL
      } else {
        baseUrl = 'http://localhost:3000'
      }
    }
    
    // Ensure baseUrl doesn't end with a slash
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    const sendHtml = absolutizeEmailImageUrls(promotedHtml, baseUrl)

    const successes: { email: string; id?: string; name?: string | null }[] = []
    const failures: { email: string; id?: string; name?: string | null; error: string }[] = []

    for (const recipient of dedupedRecipients) {
      try {
        await sendCustomHtmlEmail(recipient.email as string, subject, sendHtml)
        successes.push({ email: recipient.email as string, id: recipient.id, name: recipient.name || null })
      } catch (error: any) {
        failures.push({
          email: recipient.email as string,
          id: recipient.id,
          name: recipient.name || null,
          error: error?.message || 'Failed to send',
        })
      }
    }

    // Insert log entry
    await supabaseAdmin.from('admin_email_logs').insert({
      id: logId,
      sender_user_id: sender.id,
      sender_email: sender.email,
      sender_name: sender.name || null,
      subject,
      body_html: sendHtml,
      recipient_scope: recipientScope,
      recipient_roles: recipientScope === 'role' ? body.recipientRoles || [] : null,
      recipient_ids: dedupedRecipients.map((r) => r.id),
      recipient_emails: dedupedRecipients.map((r) => r.email),
      recipient_names: dedupedRecipients.map((r) => r.name || null),
      recipient_name_search: dedupedRecipients
        .map((r) => (r.name ? `${r.name} <${r.email}>` : r.email))
        .filter(Boolean)
        .join(', '),
      total_recipients: dedupedRecipients.length,
      success_count: successes.length,
      failed_count: failures.length,
      failed_recipient_emails: failures.map((f) => f.email),
      failed_recipient_ids: failures.map((f) => f.id).filter((id): id is string => Boolean(id)),
      failure_messages: failures.map((f) => ({ email: f.email, message: f.error })),
    })

    return NextResponse.json({
      success: failures.length === 0,
      sent: successes.length,
      failed: failures,
      logId,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/emails/send:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

