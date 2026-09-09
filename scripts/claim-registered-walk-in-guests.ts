/**
 * Promote walk-in shadows who later registered (Forgot password / verified)
 * to normal platform users. Same users.id. Does not rewrite booking source.
 *
 * Default: dry-run.
 * Apply:  $env:APPLY=1; $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/claim-registered-walk-in-guests.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  claimedWalkInAccountFields,
  walkInGuestLooksClaimed,
} from '../lib/walk-in-shared'

config({ path: '.env.local' })

const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log(APPLY ? 'APPLY mode — clearing account_origin on claimed walk-ins' : 'DRY-RUN — no writes')

  const { data: rows, error } = await sb
    .from('users')
    .select(
      'id, email, name, account_origin, email_verified, must_change_password, login_count, last_login, profile_completed, created_at'
    )
    .eq('account_origin', 'walk_in_guest')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const claimed = (rows || []).filter((user) => walkInGuestLooksClaimed(user))
  const shadows = (rows || []).filter((user) => !walkInGuestLooksClaimed(user))

  console.log(`Walk-in rows: ${rows?.length || 0}`)
  console.log(`Claimed (will promote): ${claimed.length}`)
  console.log(`Still shadows (leave): ${shadows.length}`)

  for (const user of claimed) {
    console.log(
      `  CLAIM ${user.email} verified=${user.email_verified} must_change=${user.must_change_password} logins=${user.login_count}`
    )
  }
  for (const user of shadows) {
    console.log(`  SHADOW ${user.email}`)
  }

  if (!APPLY || claimed.length === 0) {
    return
  }

  const fields = claimedWalkInAccountFields()
  const ids = claimed.map((user) => user.id)
  const { error: updateError } = await sb.from('users').update(fields).in('id', ids)
  if (updateError) throw updateError

  const { data: stillTagged, error: checkError } = await sb
    .from('users')
    .select('id, email')
    .eq('account_origin', 'walk_in_guest')
    .in('id', ids)

  if (checkError) throw checkError
  if (stillTagged && stillTagged.length > 0) {
    throw new Error(`Still tagged after update: ${stillTagged.map((u) => u.email).join(', ')}`)
  }

  console.log(`Promoted ${ids.length} claimed walk-in users to registered accounts.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
