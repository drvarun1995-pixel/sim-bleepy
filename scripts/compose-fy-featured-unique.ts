/**
 * Compose unique Bleepy featured cards from per-slug base images, upload,
 * update fy_pages, and delete previous featured images.
 *
 * Bases expected at: tmp-fy-featured/unique-bases/{slug}.png
 *
 * Run all:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/compose-fy-featured-unique.ts
 * One slug:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/compose-fy-featured-unique.ts abg-made-easy
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { BATCH_POSTS } from './seed-fy-scrubtales-batch'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const W = 1280
const H = 720
const BASE_DIR = path.resolve('tmp-fy-featured/unique-bases')
const OUT_DIR = path.resolve('tmp-fy-featured/unique-composed')

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

async function composeCard(opts: {
  title: string
  cat1: string
  cat2: string
  basePath: string
}): Promise<Buffer> {
  const lines = wrapTitle(opts.title.toUpperCase())
  const overlay = bannerSvg(lines, opts.cat1.toUpperCase(), opts.cat2.toUpperCase())
  const whiteMasks = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="70" y="10" width="1140" height="150" rx="20" fill="#ffffff"/>
  <rect x="140" y="540" width="1000" height="150" rx="20" fill="#ffffff"/>
</svg>`)

  return sharp(opts.basePath)
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
  const only = process.argv[2]?.trim()
  const selected = only ? BATCH_POSTS.filter((p) => p.slug === only) : BATCH_POSTS
  if (!selected.length) {
    console.error('No posts matched')
    process.exit(1)
  }

  let ok = 0
  let failed = 0

  for (const post of selected) {
    console.log(`\n=== ${post.slug}`)
    const basePath = path.join(BASE_DIR, `${post.slug}.png`)
    if (!fs.existsSync(basePath)) {
      console.error(`  missing base: ${basePath}`)
      failed += 1
      continue
    }

    const { data: page, error } = await sb
      .from('fy_pages')
      .select('id, title, slug, featured_image, topic_id, fy_topics!inner(slug)')
      .eq('slug', post.slug)
      .single()
    if (error || !page) {
      console.warn('  page missing, skip')
      failed += 1
      continue
    }

    const topicSlug = (page as any).fy_topics?.slug || post.topicSlug
    const title = post.featuredTitle || post.titleFallback
    const cat1 = post.categoryLine1 || 'PRACTICAL TIPS'
    const cat2 = post.categoryLine2 || 'WORKING IN THE NHS'

    const webp = await composeCard({ title, cat1, cat2, basePath })
    const localOut = path.join(OUT_DIR, `${post.slug}.webp`)
    fs.writeFileSync(localOut, webp)

    const storagePath = `foundation-year/general/${topicSlug}/${post.slug}/images/featured-bleepy.webp`
    const oldCandidates = [
      page.featured_image,
      `foundation-year/general/${topicSlug}/${post.slug}/images/featured.webp`,
      `foundation-year/general/${topicSlug}/${post.slug}/images/featured-bleepy.webp`,
      `foundation-year/general/${topicSlug}/${post.slug}/images/featured-bleepy.png`,
      `foundation-year/general/${topicSlug}/${post.slug}/images/og-featured.webp`,
    ].filter(Boolean) as string[]

    const uniqueOlds = [...new Set(oldCandidates)].filter((p) => p !== storagePath)
    if (uniqueOlds.length) {
      const { error: delError } = await sb.storage.from('placements').remove(uniqueOlds)
      if (delError) console.warn('  old delete warn:', delError.message)
      else console.log(`  deleted ${uniqueOlds.length} old featured path(s)`)
    }

    // Replace current featured path too (fresh unique art)
    await sb.storage.from('placements').remove([storagePath])

    const { error: upError } = await sb.storage.from('placements').upload(storagePath, webp, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '3600',
    })
    if (upError) {
      console.error('  upload failed', upError.message)
      failed += 1
      continue
    }

    const { error: updateError } = await sb
      .from('fy_pages')
      .update({
        featured_image: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
    if (updateError) {
      console.error('  db update failed', updateError.message)
      failed += 1
      continue
    }

    console.log('  ok', storagePath)
    ok += 1
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`)
  if (failed) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
