/**
 * FY ops batch:
 * 1) Dedupe cross-cohort page copies
 * 2) Ensure meta_description column + fill SEO descriptions
 * 3) Replace IV algorithm image at full PNG quality
 * 4) Remove unused / orphan featured variants
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/fy-ops-dedupe-meta-iv.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { FY_META_DESCRIPTIONS } from '../lib/fy-meta-descriptions'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ASSETS = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)

/** Prefer official NICE algorithm graphic (clean, high detail). */
const ALGO_SRC = path.join(
  ASSETS,
  'c__Users_FrostBite_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-cf9236d1-b9ff-4b56-a880-83f05cce5353.png'
)

/** Keep members-only posts in fy1 only; public posts in general only. */
const MEMBERS_ONLY_KEEP_COHORT = 'fy1'
const PUBLIC_KEEP_COHORT = 'general'

async function ensureMetaColumn() {
  // Optional DB column — curated descriptions also live in lib/fy-meta-descriptions.ts
  // so SEO works even before the migration is applied.
  console.log(
    'Skipping direct SQL migration (use migrations/fy_pages_meta_description.sql in Supabase SQL editor if desired).'
  )
  console.log('Using lib/fy-meta-descriptions.ts as SEO source of truth.')
  return false
}

async function listFolder(folder: string): Promise<string[]> {
  const { data } = await sb.storage.from('placements').list(folder, { limit: 200 })
  return (data || []).map((f) => `${folder}/${f.name}`)
}

async function removePaths(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (!unique.length) return
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const { error } = await sb.storage.from('placements').remove(chunk)
    if (error) console.warn('  storage remove warn:', error.message)
    else console.log(`  removed ${chunk.length} storage object(s)`)
  }
}

async function dedupePages() {
  const { data, error } = await sb
    .from('fy_pages')
    .select(
      'id, slug, requires_auth, featured_image, content, fy_topics!inner(id, cohort, slug)'
    )
    .eq('status', 'published')
    .eq('is_active', true)
  if (error) throw error

  const bySlug = new Map<string, any[]>()
  for (const p of data || []) {
    const list = bySlug.get(p.slug) || []
    list.push(p)
    bySlug.set(p.slug, list)
  }

  let deleted = 0
  for (const [slug, rows] of bySlug) {
    if (rows.length < 2) continue
    const membersOnly = rows.some((r) => r.requires_auth === true)
    const keepCohort = membersOnly ? MEMBERS_ONLY_KEEP_COHORT : PUBLIC_KEEP_COHORT

    let keep = rows.find((r) => r.fy_topics.cohort === keepCohort)
    if (!keep) {
      // fallback: prefer general, else first
      keep =
        rows.find((r) => r.fy_topics.cohort === 'general') ||
        rows.find((r) => r.fy_topics.cohort === 'fy1') ||
        rows[0]
    }

    const remove = rows.filter((r) => r.id !== keep.id)
    console.log(
      `\nDEDUP ${slug}: keep ${keep.fy_topics.cohort}/${keep.fy_topics.slug}, delete ${remove.map((r) => r.fy_topics.cohort).join(', ')}`
    )

    for (const r of remove) {
      // remove cohort-specific image folder when path is under that cohort
      const folder = `foundation-year/${r.fy_topics.cohort}/${r.fy_topics.slug}/${slug}/images`
      const files = await listFolder(folder)
      await removePaths(files)

      const { error: delErr } = await sb.from('fy_pages').delete().eq('id', r.id)
      if (delErr) throw delErr
      deleted += 1
      console.log(`  deleted page ${r.id}`)
    }
  }
  console.log(`\nDeduped. Deleted ${deleted} duplicate page row(s).`)
}

async function applyMetaDescriptions() {
  const { data, error } = await sb
    .from('fy_pages')
    .select('id, slug, title')
    .eq('status', 'published')
    .eq('is_active', true)
  if (error) throw error

  let updated = 0
  let missing = 0
  let columnMissing = false
  for (const page of data || []) {
    const meta = FY_META_DESCRIPTIONS[page.slug]
    if (!meta) {
      missing += 1
      console.warn('  no meta for', page.slug)
      continue
    }
    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ meta_description: meta, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) {
      if (/meta_description|schema cache|column/i.test(upErr.message)) {
        columnMissing = true
        break
      }
      throw upErr
    }
    updated += 1
  }
  if (columnMissing) {
    console.log(
      'DB column meta_description not present yet — runtime map will still power SEO after deploy.'
    )
    console.log(`Mapped descriptions available for ${Object.keys(FY_META_DESCRIPTIONS).length} slugs`)
    return
  }
  console.log(`Meta descriptions set: ${updated}; missing map entries: ${missing}`)
}

async function replaceAlgorithmPng() {
  if (!fs.existsSync(ALGO_SRC)) throw new Error(`Missing algorithm source: ${ALGO_SRC}`)

  // Lossless-ish: keep PNG, no downscale (only orient)
  const png = await sharp(ALGO_SRC).rotate().png({ compressionLevel: 9 }).toBuffer()
  console.log(`Algorithm PNG bytes=${png.length}`)

  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, content, featured_image, fy_topics!inner(cohort, slug)')
    .eq('slug', 'fy1-iv-fluid-prescribing')
  if (error) throw error
  if (!pages?.length) {
    console.warn('No IV fluids page left after dedupe')
    return
  }

  for (const page of pages) {
    const cohort = page.fy_topics.cohort
    const topic = page.fy_topics.slug
    const folder = `foundation-year/${cohort}/${topic}/fy1-iv-fluid-prescribing/images`
    const storagePath = `${folder}/iv-fluids-algorithm.png`

    // remove degraded webp variant
    await removePaths([`${folder}/iv-fluids-algorithm.webp`])

    const { error: upErr } = await sb.storage.from('placements').upload(storagePath, png, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '3600',
    })
    if (upErr) throw upErr
    console.log('  uploaded', storagePath)

    let content = page.content || ''
    content = content
      .replace(/iv-fluids-algorithm\.webp/g, 'iv-fluids-algorithm.png')
      .replace(
        /alt="IV fluids recommended algorithm covering assessment, resuscitation, maintenance and replacement"/g,
        'alt="NICE algorithms for IV fluid therapy in adults: assessment, resuscitation, maintenance, replacement and redistribution"'
      )

    const { error: pageErr } = await sb
      .from('fy_pages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (pageErr) throw pageErr
    console.log('  updated content', page.id)
  }
}

async function cleanupUnusedFeatured() {
  // Known unused featured filenames across the two posts + leftover public paths
  const leftovers = [
    'foundation-year/general/clerking-shifts/fy1-review-patient-on-call/images/featured-bleepy-unique.webp',
    'foundation-year/general/clerking-shifts/fy1-review-patient-on-call/images/featured-bleepy-mascot.webp',
    'foundation-year/general/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-unique.webp',
    'foundation-year/general/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-mascot.webp',
    'foundation-year/fy1/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-unique.webp',
    'foundation-year/fy1/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-mascot.webp',
    'foundation-year/fy2/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-unique.webp',
    'foundation-year/fy2/clerking-shifts/fy1-iv-fluid-prescribing/images/featured-bleepy-mascot.webp',
    // old AI infographics no longer referenced after teaching-slide rebuild
    'foundation-year/general/clerking-shifts/fy1-iv-fluid-prescribing/images/iv-fluids-resuscitation-maintenance-replacement.webp',
    'foundation-year/general/clerking-shifts/fy1-iv-fluid-prescribing/images/fluid-status-assessment-fy1.webp',
    'foundation-year/general/clerking-shifts/fy1-iv-fluid-prescribing/images/fy1-iv-fluid-prescribing-framework.webp',
  ]
  await removePaths(leftovers)

  // After dedupe, purge empty fy2/general IV folders if pages gone
  for (const cohort of ['general', 'fy2'] as const) {
    const folder = `foundation-year/${cohort}/clerking-shifts/fy1-iv-fluid-prescribing/images`
    const files = await listFolder(folder)
    if (files.length) {
      console.log(`Cleaning leftover IV folder ${folder}`)
      await removePaths(files)
    }
  }
}

async function main() {
  console.log('=== 1) meta column ===')
  await ensureMetaColumn()

  console.log('\n=== 2) dedupe cohorts ===')
  await dedupePages()

  console.log('\n=== 3) SEO meta descriptions ===')
  await applyMetaDescriptions()

  console.log('\n=== 4) replace algorithm (PNG, no quality loss) ===')
  await replaceAlgorithmPng()

  console.log('\n=== 5) cleanup unused featured/orphan images ===')
  await cleanupUnusedFeatured()

  console.log('\nAll ops done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
