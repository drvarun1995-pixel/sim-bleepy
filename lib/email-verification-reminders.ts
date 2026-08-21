import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/utils/supabase'
import { sendVerificationReminderEmail } from '@/lib/email'
import { isExcludedFromLearnerLists } from '@/lib/year-progression'
import {
  VERIFICATION_REMINDER_STEPS,
  type VerificationReminderStepId,
} from '@/lib/email-templates/system'

const BATCH = 40
const TOKEN_HOURS = 48

function appBaseUrl() {
  const fromEnv = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (fromEnv && !/localhost|127\.0\.0\.1|0\.0\.0\.0|vercel\.app/i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }
  return 'https://sim.bleepy.co.uk'
}

async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000).toISOString()
  await supabaseAdmin.from('email_verification_tokens').delete().eq('user_id', userId)
  const { error } = await supabaseAdmin.from('email_verification_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt,
  })
  if (error) throw error
  return token
}

export async function sendDueVerificationReminders(now = new Date()) {
  const sent: Record<VerificationReminderStepId, number> = {
    '12h': 0,
    '3d': 0,
    '7d': 0,
    '30d': 0,
  }
  const failed: Record<string, number> = {}
  const nowMs = now.getTime()

  for (const step of VERIFICATION_REMINDER_STEPS) {
    const minCreated = new Date(nowMs - step.nextDelayMs).toISOString()
    const maxCreated = new Date(nowMs - step.delayMs).toISOString()

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, email_verified, admin_created, created_at')
      .eq('email_verified', false)
      .not('email', 'is', null)
      .gt('created_at', minCreated)
      .lte('created_at', maxCreated)
      .limit(200)

    if (error) {
      failed[step.id] = 0
      console.error(`Verification reminders (${step.id}) query failed:`, error.message)
      continue
    }

    const candidates = (users || []).filter((user) => {
      if (user.admin_created) return false
      if (isExcludedFromLearnerLists(user)) return false
      return true
    })
    if (candidates.length === 0) continue

    const ids = candidates.map((user) => user.id)
    const { data: already, error: alreadyError } = await supabaseAdmin
      .from('email_verification_reminders')
      .select('user_id')
      .eq('step', step.id)
      .in('user_id', ids)

    if (alreadyError) {
      throw new Error(
        alreadyError.message.includes('email_verification_reminders')
          ? 'Run supabase/migrations/20260821_email_verification_reminders.sql in the Supabase SQL editor.'
          : alreadyError.message
      )
    }

    const alreadyIds = new Set((already || []).map((row) => row.user_id))
    const due = candidates.filter((user) => !alreadyIds.has(user.id)).slice(0, BATCH)

    for (const user of due) {
      try {
        const token = await issueVerificationToken(user.id)
        await sendVerificationReminderEmail({
          email: user.email,
          name: user.name,
          verificationUrl: `${appBaseUrl()}/auth/verify?token=${token}`,
          step: step.id,
        })
        const { error: logError } = await supabaseAdmin.from('email_verification_reminders').insert({
          user_id: user.id,
          step: step.id,
        })
        if (logError) throw logError
        sent[step.id] += 1
      } catch (error) {
        console.error(`Verification reminder ${step.id} failed for ${user.email}:`, error)
        failed[step.id] = (failed[step.id] || 0) + 1
      }
    }
  }

  return { sent, failed }
}
