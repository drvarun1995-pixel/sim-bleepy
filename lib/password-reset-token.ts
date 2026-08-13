import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type PasswordResetTokenRow = {
  id: string
  user_id: string
  expires_at: string
  used: boolean | null
}

export function hashPasswordResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

export async function findPasswordResetToken(
  supabase: SupabaseClient,
  rawToken: string
): Promise<PasswordResetTokenRow | null> {
  const hashed = hashPasswordResetToken(rawToken)
  const { data: hashedRow } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', hashed)
    .maybeSingle()

  if (hashedRow) return hashedRow as PasswordResetTokenRow

  // Leftover plaintext tokens from before hashing (1-hour life)
  const { data: plainRow } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', rawToken)
    .maybeSingle()

  return (plainRow as PasswordResetTokenRow) || null
}

export async function invalidateUserResetTokens(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false)
}
