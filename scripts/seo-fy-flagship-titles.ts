/**
 * Keyword/title pass for flagship public FY guides (all cohorts sharing the slug).
 *
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seo-fy-flagship-titles.ts
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const UPDATES: { slug: string; title: string }[] = [
  {
    slug: 'what-are-on-call-shifts',
    title: 'On-Call Shifts for Foundation Doctors: What They Are',
  },
  {
    slug: 'dnar-dnacpr-guide',
    title: 'DNAR / DNACPR Rules for UK Doctors: FY Guide',
  },
  {
    slug: 'nhs-bleep-system',
    title: 'NHS Bleep System Explained for Junior Doctors',
  },
  {
    slug: 'abg-made-easy',
    title: 'ABG Interpretation Made Easy for Foundation Doctors',
  },
  {
    slug: 'aki-stages-quick-guide',
    title: 'AKI Stages Explained: Quick Guide for Junior Doctors',
  },
  {
    slug: 'ecg-basics-guide',
    title: 'ECG Basics for Foundation Doctors: Step-by-Step',
  },
  {
    slug: 'mrcp-1-pass-in-two-months',
    title: 'How I Passed MRCP Part 1 in 2 Months',
  },
  {
    slug: 'how-to-do-a-clinical-audit',
    title: 'How to Do a Clinical Audit in the NHS: FY Guide',
  },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env')

  const sb = createClient(url, key)
  let updated = 0

  for (const row of UPDATES) {
    const { data, error } = await sb
      .from('fy_pages')
      .update({ title: row.title, updated_at: new Date().toISOString() })
      .eq('slug', row.slug)
      .select('id, slug, title')

    if (error) {
      console.error(`Failed ${row.slug}:`, error.message)
      continue
    }
    const n = data?.length || 0
    updated += n
    console.log(`${row.slug}: updated ${n} row(s) → ${row.title}`)
  }

  console.log(`Done. Rows updated: ${updated}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
