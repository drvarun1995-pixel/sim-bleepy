/**
 * Recompose Bleepy-style featured cards for the two newest FY1 posts.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/compose-fy1-two-featured.ts
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
const ASSETS = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
)
const OUT_DIR = path.resolve('tmp-fy-featured/unique-composed')
const BASE_DIR = path.resolve('tmp-fy-featured/unique-bases')

const POSTS = [
  {
    slug: 'fy1-review-patient-on-call',
    topicSlug: 'clerking-shifts',
    featuredTitle: 'REVIEW A PATIENT ON-CALL',
    cat1: 'CLINICAL SKILLS',
    cat2: 'CLERKING SHIFTS',
    baseName: 'fy1-review-patient-on-call-bleepy-base.png',
  },
  {
    slug: 'fy1-iv-fluid-prescribing',
    topicSlug: 'clerking-shifts',
    featuredTitle: 'IV FLUID PRESCRIBING GUIDE',
    cat1: 'CLINICAL SKILLS',
    cat2: 'CLERKING SHIFTS',
    baseName: 'fy1-iv-fluid-prescribing-bleepy-base.png',
  },
] as const

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 28): string[] {
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 38 : 46
  const titleBlockH = titleLines.length > 1 ? 118 : 92
  const titleY0 = titleLines.length > 1 ? 52 : 62
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleY0 + i * 46
      return `<text x="640" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`
    })
    .join('\n')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`
  return Buffer.from(svg)
}

async function composeCard(basePath: string, title: string, cat1: string, cat2: string) {
  const lines = wrapTitle(title.toUpperCase())
  const overlay = bannerSvg(lines, cat1.toUpperCase(), cat2.toUpperCase())
  const whiteMasks = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="70" y="10" width="1140" height="150" rx="20" fill="#ffffff"/>
  <rect x="140" y="540" width="1000" height="150" rx="20" fill="#ffffff"/>
</svg>`)

  return sharp(basePath)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([
      { input: await sharp(whiteMasks).png().toBuffer(), top: 0, left: 0 },
      { input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 },
    ])
    .webp({ quality: 85, effort: 4 })
    .toBuffer()
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(BASE_DIR, { recursive: true })

  for (const post of POSTS) {
    console.log(`\n=== ${post.slug}`)
    const src = path.join(ASSETS, post.baseName)
    if (!fs.existsSync(src)) throw new Error(`Missing base: ${src}`)

    // Keep a copy in unique-bases for future recomposes
    const baseCopy = path.join(BASE_DIR, `${post.slug}.png`)
    fs.copyFileSync(src, baseCopy)

    const webp = await composeCard(src, post.featuredTitle, post.cat1, post.cat2)
    const localOut = path.join(OUT_DIR, `${post.slug}.webp`)
    fs.writeFileSync(localOut, webp)
    console.log('  wrote', localOut)

    // Cache-bust filename so CDNs / browsers pick up the new art
    const storagePath = `foundation-year/general/${post.topicSlug}/${post.slug}/images/featured-bleepy-mascot.webp`
    const oldCandidates = [
      `foundation-year/general/${post.topicSlug}/${post.slug}/images/featured-bleepy-unique.webp`,
      `foundation-year/general/${post.topicSlug}/${post.slug}/images/featured-bleepy.webp`,
      `foundation-year/general/${post.topicSlug}/${post.slug}/images/featured.webp`,
    ]

    await sb.storage.from('placements').remove([...oldCandidates, storagePath])

    const { error: upError } = await sb.storage.from('placements').upload(storagePath, webp, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '3600',
    })
    if (upError) throw new Error(`Upload failed: ${upError.message}`)
    console.log('  uploaded', storagePath)

    const { data: pages, error } = await sb
      .from('fy_pages')
      .select('id, slug, fy_topics!inner(slug)')
      .eq('slug', post.slug)
    if (error) throw error

    for (const page of pages || []) {
      const { error: upd } = await sb
        .from('fy_pages')
        .update({
          featured_image: storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)
      if (upd) throw upd
      console.log('  updated page', page.id)
    }
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
