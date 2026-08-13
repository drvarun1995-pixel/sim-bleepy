/**
 * Audit + clean invalid UCL study years and leftover UCL Year 1–4 categories.
 *
 * Platform rule: UCL offers Years 5–6 only (see lib/study-years.ts).
 *
 * Default: dry-run (report only).
 * Apply:  $env:APPLY=1; $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/cleanup-ucl-study-years.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const INVALID_UCL_YEARS = new Set(['1', '2', '3', '4'])
const INVALID_CATEGORY_NAMES = [
  'UCL Year 1',
  'UCL Year 2',
  'UCL Year 3',
  'UCL Year 4',
]
const INVALID_CATEGORY_SLUGS = [
  'ucl-year-1',
  'ucl-year-2',
  'ucl-year-3',
  'ucl-year-4',
]

async function main() {
  console.log(APPLY ? 'APPLY mode — writing changes' : 'DRY-RUN — no writes')

  // --- Users with invalid UCL study_year ---
  const { data: uclUsers, error: usersError } = await sb
    .from('users')
    .select('id, email, name, university, study_year, role_type')
    .eq('university', 'UCL')
    .not('study_year', 'is', null)

  if (usersError) {
    throw new Error(`Failed to load UCL users: ${usersError.message}`)
  }

  const invalidUsers = (uclUsers || []).filter((u) =>
    INVALID_UCL_YEARS.has(String(u.study_year || '').trim())
  )

  console.log(`\nUCL users with study_year set: ${(uclUsers || []).length}`)
  console.log(`Invalid UCL study_year (1–4): ${invalidUsers.length}`)
  for (const u of invalidUsers) {
    console.log(`  - ${u.email || u.id}  study_year=${u.study_year}`)
  }

  if (APPLY && invalidUsers.length > 0) {
    const ids = invalidUsers.map((u) => u.id)
    const { error: clearError } = await sb
      .from('users')
      .update({ study_year: null, updated_at: new Date().toISOString() })
      .in('id', ids)

    if (clearError) {
      throw new Error(`Failed to clear invalid study years: ${clearError.message}`)
    }
    console.log(`Cleared study_year for ${ids.length} UCL user(s).`)
  }

  // --- Leftover UCL Year 1–4 categories ---
  const { data: categories, error: catError } = await sb
    .from('categories')
    .select('id, name, slug')
    .or(
      [
        ...INVALID_CATEGORY_NAMES.map((n) => `name.eq.${n}`),
        ...INVALID_CATEGORY_SLUGS.map((s) => `slug.eq.${s}`),
      ].join(',')
    )

  if (catError) {
    throw new Error(`Failed to load categories: ${catError.message}`)
  }

  const badCategories = categories || []
  console.log(`\nInvalid UCL Year 1–4 categories: ${badCategories.length}`)
  for (const c of badCategories) {
    console.log(`  - ${c.name} (${c.slug}) id=${c.id}`)
  }

  if (badCategories.length === 0) {
    console.log('\nDone.')
    return
  }

  const categoryIds = badCategories.map((c) => c.id)

  // Count event links
  const { data: links, error: linkError } = await sb
    .from('event_categories')
    .select('event_id, category_id')
    .in('category_id', categoryIds)

  if (linkError) {
    throw new Error(`Failed to load event_categories: ${linkError.message}`)
  }

  const linkedEventIds = Array.from(new Set((links || []).map((l) => l.event_id)))
  console.log(`Events linked to those categories: ${linkedEventIds.length}`)

  // Prefer remapping to parent UCL category when available
  const { data: uclParent } = await sb
    .from('categories')
    .select('id, name')
    .eq('name', 'UCL')
    .maybeSingle()

  if (APPLY) {
    if (uclParent?.id && (links || []).length > 0) {
      for (const link of links || []) {
        // Drop old link
        const { error: delLinkErr } = await sb
          .from('event_categories')
          .delete()
          .eq('event_id', link.event_id)
          .eq('category_id', link.category_id)
        if (delLinkErr) {
          console.warn(
            `Could not unlink event ${link.event_id} from ${link.category_id}:`,
            delLinkErr.message
          )
          continue
        }

        // Ensure parent UCL link exists
        const { error: upsertErr } = await sb.from('event_categories').upsert(
          { event_id: link.event_id, category_id: uclParent.id },
          { onConflict: 'event_id,category_id', ignoreDuplicates: true }
        )
        if (upsertErr) {
          // Some schemas may not support onConflict — try insert ignore via select
          const { data: existing } = await sb
            .from('event_categories')
            .select('event_id')
            .eq('event_id', link.event_id)
            .eq('category_id', uclParent.id)
            .maybeSingle()
          if (!existing) {
            const { error: insertErr } = await sb
              .from('event_categories')
              .insert({ event_id: link.event_id, category_id: uclParent.id })
            if (insertErr) {
              console.warn(
                `Could not attach UCL parent to event ${link.event_id}:`,
                insertErr.message
              )
            }
          }
        }
      }
      console.log(
        `Remapped ${links?.length || 0} event category link(s) toward parent UCL (${uclParent.id}).`
      )
    } else if ((links || []).length > 0) {
      const { error: delAllLinksErr } = await sb
        .from('event_categories')
        .delete()
        .in('category_id', categoryIds)
      if (delAllLinksErr) {
        throw new Error(`Failed to delete event links: ${delAllLinksErr.message}`)
      }
      console.log(`Deleted ${links?.length || 0} event_categories link(s).`)
    }

    const { error: delCatErr } = await sb.from('categories').delete().in('id', categoryIds)
    if (delCatErr) {
      throw new Error(`Failed to delete categories: ${delCatErr.message}`)
    }
    console.log(`Deleted ${categoryIds.length} invalid UCL Year 1–4 categor(ies).`)
  } else if (uclParent?.id) {
    console.log(
      `\nWould remap linked events to parent category "${uclParent.name}" (${uclParent.id}), then delete invalid categories.`
    )
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
