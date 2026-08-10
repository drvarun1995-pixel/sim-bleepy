import type { SupabaseClient } from '@supabase/supabase-js'

type DeleteResult = {
  ok: boolean
  error?: string
  steps: string[]
}

async function del(
  supabase: SupabaseClient,
  steps: string[],
  table: string,
  column: string,
  userId: string
) {
  const { error } = await supabase.from(table).delete().eq(column, userId)
  if (error) {
    // Missing table/column is fine across environments
    if (isMissingRelationError(error)) {
      steps.push(`${table}: skipped (missing)`)
      return
    }
    throw new Error(`${table}.${column}: ${error.message}`)
  }
  steps.push(`${table}: deleted`)
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  const msg = (error.message || '').toLowerCase()
  return (
    error.code === '42P01' ||
    error.code === '42703' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the')
  )
}

async function nullify(
  supabase: SupabaseClient,
  steps: string[],
  table: string,
  column: string,
  userId: string
) {
  const { error } = await supabase
    .from(table)
    .update({ [column]: null })
    .eq(column, userId)
  if (error) {
    if (isMissingRelationError(error)) {
      steps.push(`${table}.${column}: skipped nullify`)
      return
    }
    throw new Error(`${table}.${column} nullify: ${error.message}`)
  }
  steps.push(`${table}.${column}: nulled`)
}

/**
 * Permanently remove a user and their personal/app data.
 * Shared teaching content they authored is kept with created_by/uploaded_by cleared.
 */
export async function deleteUserAndAllData(
  supabase: SupabaseClient,
  userId: string,
  opts?: { email?: string | null }
): Promise<DeleteResult> {
  const steps: string[] = []

  try {
    // --- Quiz / games (this blocked meded deletes: quiz_challenges.host_id) ---
    // Challenges cascade to participants/answers via challenge_id FK
    await del(supabase, steps, 'quiz_challenges', 'host_id', userId)
    await del(supabase, steps, 'quiz_challenge_participants', 'user_id', userId)
    await del(supabase, steps, 'quiz_practice_sessions', 'user_id', userId)
    await del(supabase, steps, 'quiz_user_xp', 'user_id', userId)
    await del(supabase, steps, 'quiz_xp_transactions', 'user_id', userId)
    await del(supabase, steps, 'quiz_leaderboard_snapshots', 'user_id', userId)
    await nullify(supabase, steps, 'quiz_questions', 'created_by', userId)

    // --- Core learning / events ---
    await del(supabase, steps, 'attempts', 'user_id', userId)
    await del(supabase, steps, 'event_bookings', 'user_id', userId)
    await del(supabase, steps, 'saved_events', 'user_id', userId)
    await del(supabase, steps, 'qr_code_scans', 'user_id', userId)
    await del(supabase, steps, 'feedback_responses', 'user_id', userId)
    await del(supabase, steps, 'fy_page_feedback', 'user_id', userId)

    // Certificates (+ storage)
    {
      const { data: certificates } = await supabase
        .from('certificates')
        .select('certificate_filename')
        .eq('user_id', userId)
      const paths = (certificates || [])
        .map((c) => c.certificate_filename)
        .filter(Boolean) as string[]
      if (paths.length) {
        await supabase.storage.from('certificates').remove(paths)
        steps.push(`certificates storage: removed ${paths.length}`)
      }
      await del(supabase, steps, 'certificates', 'user_id', userId)
      await nullify(supabase, steps, 'certificates', 'generated_by', userId)
    }

    // Resources: keep shared teaching files, clear uploader link
    await nullify(supabase, steps, 'resources', 'uploaded_by', userId)
    await nullify(supabase, steps, 'placement_documents', 'uploaded_by', userId)

    // Authored shared content — keep pages/topics, clear authorship
    await nullify(supabase, steps, 'fy_pages', 'created_by', userId)
    await nullify(supabase, steps, 'fy_topics', 'created_by', userId)
    await nullify(supabase, steps, 'announcements', 'created_by', userId)
    await nullify(supabase, steps, 'events', 'created_by', userId)
    await nullify(supabase, steps, 'feedback_templates', 'created_by', userId)
    await nullify(supabase, steps, 'feedback_templates', 'shared_by', userId)
    await nullify(supabase, steps, 'admin_email_logs', 'sender_user_id', userId)
    await nullify(supabase, steps, 'platform_settings', 'updated_by', userId)

    // --- Portfolio / profile ---
    await del(supabase, steps, 'portfolio_files', 'user_id', userId)
    await del(supabase, steps, 'teaching_portfolio', 'user_id', userId)
    await del(supabase, steps, 'teaching_portfolio_entries', 'user_id', userId)
    await del(supabase, steps, 'imt_portfolio', 'user_id', userId)
    await del(supabase, steps, 'profiles', 'id', userId)
    await del(supabase, steps, 'email_signatures', 'user_id', userId)

    try {
      const { data: files } = await supabase.storage.from('profile-pictures').list(userId)
      if (files?.length) {
        await supabase.storage
          .from('profile-pictures')
          .remove(files.map((f) => `${userId}/${f.name}`))
        steps.push(`profile-pictures: removed ${files.length}`)
      }
    } catch {
      steps.push('profile-pictures: skipped')
    }

    // --- Push / notifications / logs ---
    await del(supabase, steps, 'push_subscriptions', 'user_id', userId)
    await del(supabase, steps, 'push_notification_preferences', 'user_id', userId)
    await del(supabase, steps, 'notification_logs', 'user_id', userId)
    await del(supabase, steps, 'system_logs', 'user_id', userId)
    await del(supabase, steps, 'user_activity', 'user_id', userId)
    await del(supabase, steps, 'download_logs', 'user_id', userId)
    await del(supabase, steps, 'consent_audit_log', 'user_id', userId)
    await del(supabase, steps, 'cron_tasks', 'user_id', userId)

    // --- Tokens / analytics / gamification ---
    await del(supabase, steps, 'email_verification_tokens', 'user_id', userId)
    await del(supabase, steps, 'password_reset_tokens', 'user_id', userId)
    await del(supabase, steps, 'user_analytics', 'user_id', userId)
    await del(supabase, steps, 'api_usage', 'user_id', userId)
    await del(supabase, steps, 'user_preferences', 'user_id', userId)
    await del(supabase, steps, 'user_achievements', 'user_id', userId)
    await del(supabase, steps, 'user_levels', 'user_id', userId)
    await del(supabase, steps, 'user_skills', 'user_id', userId)
    await del(supabase, steps, 'user_streaks', 'user_id', userId)
    await del(supabase, steps, 'xp_transactions', 'user_id', userId)

    // Simulator sessions/scores
    {
      const { data: userSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
      const sessionIds = (userSessions || []).map((s) => s.id)
      if (sessionIds.length) {
        await supabase.from('scores').delete().in('session_id', sessionIds)
        steps.push(`scores: deleted for ${sessionIds.length} sessions`)
      }
      await del(supabase, steps, 'sessions', 'user_id', userId)
    }

    // FY blog analytics (if stored with user_id)
    await del(supabase, steps, 'fy_blog_sessions', 'user_id', userId)

    // Finally the users row
    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId)
    if (deleteError) {
      throw new Error(`users: ${deleteError.message}`)
    }
    steps.push('users: deleted')

    // App auth is NextAuth + users.password_hash; no separate Auth user scan required.
    if (opts?.email) {
      steps.push(`account email cleared: ${opts.email}`)
    }

    return { ok: true, steps }
  } catch (err: any) {
    console.error('deleteUserAndAllData failed:', err)
    return { ok: false, error: err?.message || 'Failed to delete user data', steps }
  }
}
