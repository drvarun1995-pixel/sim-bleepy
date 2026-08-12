/**
 * Replace generic logo featured cards with unique Bleepy mascot scenes.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/compose-fy-recent-unique-featured.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const W = 1280
const H = 720
const CURSOR_ASSETS = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)
const BASE_DIR = path.resolve('tmp-fy-featured/unique-bases')
const OUT_DIR = path.resolve('tmp-fy-featured/unique-composed')
const REPO_ASSETS = path.resolve('assets/fy-unique-new')

type PostSpec = {
  slug: string
  featuredTitle: string
  cat1: string
  cat2: string
  baseFile: string
}

const POSTS: PostSpec[] = [
  {
    slug: 'breathlessness-assessment-fy-guide',
    featuredTitle: 'BREATHLESSNESS ASSESSMENT',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-breathlessness-assessment-fy-guide.png',
  },
  {
    slug: 'acute-seizure-management-fy-guide',
    featuredTitle: 'ACUTE SEIZURE MANAGEMENT',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-acute-seizure-management-fy-guide.png',
  },
  {
    slug: 'tachycardia-on-the-ward-fy-guide',
    featuredTitle: 'TACHYCARDIA ON THE WARD',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-tachycardia-on-the-ward-fy-guide.png',
  },
  {
    slug: 'foundation-doctor-chest-pain',
    featuredTitle: 'CHEST PAIN ASSESSMENT',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-foundation-doctor-chest-pain.png',
  },
  {
    slug: 'hyponatraemia-foundation-doctors',
    featuredTitle: 'HYPONATRAEMIA ASSESSMENT',
    cat1: 'CORE INVESTIGATIONS',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-hyponatraemia-foundation-doctors.png',
  },
  {
    slug: 'fy-reduced-gcs-approach',
    featuredTitle: 'REDUCED GCS ASSESSMENT',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy-reduced-gcs-approach.png',
  },
  {
    slug: 'fy1-approach-to-hypotension',
    featuredTitle: 'HYPOTENSION ON THE WARD',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy1-approach-to-hypotension.png',
  },
  {
    slug: 'fy1-new-oxygen-requirement',
    featuredTitle: 'NEW OXYGEN REQUIREMENT',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy1-new-oxygen-requirement.png',
  },
  {
    slug: 'fy1-review-patient-on-call',
    featuredTitle: 'ON-CALL PATIENT REVIEW',
    cat1: 'ON-CALL & ACUTE CARE',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy1-review-patient-on-call-v2.png',
  },
  {
    slug: 'fy1-anticoagulation-ward-basics',
    featuredTitle: 'ANTICOAGULATION BASICS',
    cat1: 'PRESCRIBING',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy1-anticoagulation-ward-basics.png',
  },
  {
    slug: 'fy1-potassium-prescribing-hypokalaemia',
    featuredTitle: 'POTASSIUM PRESCRIBING',
    cat1: 'PRESCRIBING',
    cat2: 'FOUNDATION YEAR',
    baseFile: 'fy-unique-fy1-potassium-prescribing-hypokalaemia-v2.png',
  },
]

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 26): string[] {
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 36 : 44
  const titleBlockH = titleLines.length > 1 ? 118 : 92
  const titleY0 = titleLines.length > 1 ? 52 : 62
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleY0 + i * 46
      return `<text x="640" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`)
}

async function composeCard(basePath: string, title: string, cat1: string, cat2: string) {
  const lines = wrapTitle(title.toUpperCase())
  const overlay = bannerSvg(lines, cat1.toUpperCase(), cat2.toUpperCase())
  const whiteMasks = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="70" y="10" width="1140" height="150" rx="20" fill="#ffffff"/>
  <rect x="140" y="540" width="1000" height="150" rx="20" fill="#ffffff"/>
</svg>`)

  // Prefer contain for near-16:9 bases so boots/props are not cropped away.
  const meta = await sharp(basePath).metadata()
  const ratio = meta.width && meta.height ? meta.width / meta.height : 1
  const fit: keyof sharp.FitEnum = ratio >= 1.4 ? 'contain' : 'cover'

  return sharp(basePath)
    .resize(W, H, {
      fit,
      position: 'centre',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .composite([
      { input: await sharp(whiteMasks).png().toBuffer(), top: 0, left: 0 },
      { input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 },
    ])
    .webp({ quality: 88, effort: 5 })
    .toBuffer()
}

function resolveBase(baseFile: string): string {
  const candidates = [
    path.join(CURSOR_ASSETS, baseFile),
    path.join(REPO_ASSETS, baseFile),
    path.join(BASE_DIR, baseFile),
    path.resolve('assets', baseFile),
  ]
  const found = candidates.find((p) => fs.existsSync(p))
  if (!found) throw new Error(`Missing base ${baseFile}`)
  return found
}

async function main() {
  fs.mkdirSync(BASE_DIR, { recursive: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(REPO_ASSETS, { recursive: true })

  const only = process.argv[2]?.trim()
  const selected = only ? POSTS.filter((p) => p.slug === only) : POSTS
  if (!selected.length) {
    console.error(`No posts matched${only ? `: ${only}` : ''}`)
    process.exit(1)
  }

  let ok = 0
  const deletedPaths: string[] = []

  for (const post of selected) {
    console.log(`\n=== ${post.slug}`)
    const src = resolveBase(post.baseFile)
    const baseCopy = path.join(BASE_DIR, `${post.slug}.png`)
    const repoCopy = path.join(REPO_ASSETS, `${post.slug}.png`)
    fs.copyFileSync(src, baseCopy)
    fs.copyFileSync(src, repoCopy)

    const { data: page, error } = await sb
      .from('fy_pages')
      .select('id, slug, featured_image, fy_topics!inner(slug, cohort)')
      .eq('slug', post.slug)
      .single()
    if (error || !page) throw new Error(`Page missing ${post.slug}: ${error?.message}`)

    const topicSlug = (page as any).fy_topics.slug as string
    const cohort = ((page as any).fy_topics.cohort as string) || 'general'
    const webp = await composeCard(src, post.featuredTitle, post.cat1, post.cat2)
    fs.writeFileSync(path.join(OUT_DIR, `${post.slug}.webp`), webp)

    const storagePath = `foundation-year/${cohort}/${topicSlug}/${post.slug}/images/featured-bleepy-unique.webp`
    const oldCandidates = [
      page.featured_image,
      `foundation-year/${cohort}/${topicSlug}/${post.slug}/images/featured-bleepy-logo.webp`,
      `foundation-year/${cohort}/${topicSlug}/${post.slug}/images/featured-bleepy.webp`,
      `foundation-year/${cohort}/${topicSlug}/${post.slug}/images/featured-bleepy-mascot.webp`,
      `foundation-year/${cohort}/${topicSlug}/${post.slug}/images/featured.webp`,
      // historical path mismatches from earlier seeds
      `foundation-year/general/working-on-calls/${post.slug}/images/featured-bleepy-logo.webp`,
      `foundation-year/general/clerking-shifts/${post.slug}/images/featured-bleepy-logo.webp`,
      `foundation-year/general/on-calls/${post.slug}/images/featured-bleepy-logo.webp`,
    ].filter(Boolean) as string[]

    const toDelete = [...new Set(oldCandidates)].filter((p) => p !== storagePath)
    if (toDelete.length) {
      const { error: delErr } = await sb.storage.from('placements').remove(toDelete)
      if (delErr) console.warn('  delete warn:', delErr.message)
      else {
        console.log(`  deleted ${toDelete.length} old featured path(s)`)
        deletedPaths.push(...toDelete)
      }
    }

    await sb.storage.from('placements').remove([storagePath])
    const { error: upErr } = await sb.storage.from('placements').upload(storagePath, webp, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '3600',
    })
    if (upErr) throw new Error(`Upload failed ${post.slug}: ${upErr.message}`)

    const { error: updErr } = await sb
      .from('fy_pages')
      .update({
        featured_image: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
    if (updErr) throw updErr

    console.log('  ok', storagePath)
    ok += 1
  }

  console.log(`\nDone. updated=${ok}`)
  console.log('Deleted old featured paths:', deletedPaths.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
