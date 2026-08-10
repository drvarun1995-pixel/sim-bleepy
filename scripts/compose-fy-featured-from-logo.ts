/**
 * Build personalised FY featured cards using the real Bleepy logo asset
 * (avoids AI recolouring / adding a face).
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/compose-fy-featured-from-logo.ts
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
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const OUT_DIR = path.resolve('tmp-fy-featured/unique-composed')

const POSTS = [
  {
    slug: 'fy1-review-patient-on-call',
    topicSlug: 'clerking-shifts',
    featuredTitle: 'REVIEW A PATIENT ON-CALL',
    cat1: 'CLINICAL SKILLS',
    cat2: 'CLERKING SHIFTS',
    // Keep under general (public) image tree for this public post
    imageCohorts: ['general'] as const,
    props: 'clipboard-bleep',
  },
  {
    slug: 'fy1-iv-fluid-prescribing',
    topicSlug: 'clerking-shifts',
    featuredTitle: 'IV FLUID PRESCRIBING GUIDE',
    cat1: 'CLINICAL SKILLS',
    cat2: 'CLERKING SHIFTS',
    // Members-only — fy1 only after dedupe
    imageCohorts: ['fy1'] as const,
    props: 'iv-fluids',
  },
  {
    slug: 'fy1-potassium-prescribing-hypokalaemia',
    topicSlug: 'clerking-shifts',
    featuredTitle: 'PRESCRIBE POTASSIUM SAFELY',
    cat1: 'CLINICAL SKILLS',
    cat2: 'CLERKING SHIFTS',
    imageCohorts: ['general'] as const,
    props: 'potassium',
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
    } else cur = next
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
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`)
}

function propsSvg(kind: 'clipboard-bleep' | 'iv-fluids' | 'potassium'): Buffer {
  if (kind === 'potassium') {
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(220,250)">
    <rect x="0" y="10" width="200" height="220" rx="14" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="6"/>
    <rect x="0" y="10" width="200" height="44" rx="14" fill="#0F766E"/>
    <rect x="0" y="40" width="200" height="14" fill="#0F766E"/>
    <text x="100" y="40" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#ffffff">U&amp;E</text>
    <text x="24" y="90" font-family="Arial" font-size="16" font-weight="700" fill="#334155">Na 138</text>
    <text x="24" y="122" font-family="Arial" font-size="20" font-weight="900" fill="#DC2626">K  2.9</text>
    <text x="24" y="154" font-family="Arial" font-size="16" font-weight="700" fill="#334155">Creat 78</text>
    <text x="24" y="186" font-family="Arial" font-size="14" font-weight="600" fill="#64748B">mmol/L</text>
  </g>
  <g transform="translate(860,250)">
    <rect x="40" y="20" width="90" height="200" rx="28" fill="#E0E7FF" stroke="#3730A3" stroke-width="6"/>
    <rect x="40" y="20" width="90" height="70" rx="28" fill="#4F46E5"/>
    <rect x="40" y="70" width="90" height="20" fill="#4F46E5"/>
    <text x="85" y="65" text-anchor="middle" font-family="Arial Black, Arial" font-size="28" font-weight="900" fill="#ffffff">K+</text>
    <rect x="58" y="110" width="54" height="12" rx="4" fill="#A5B4FC"/>
    <rect x="58" y="136" width="54" height="12" rx="4" fill="#C7D2FE"/>
    <rect x="58" y="162" width="40" height="12" rx="4" fill="#A5B4FC"/>
  </g>
</svg>`)
  }
  if (kind === 'clipboard-bleep') {
    return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- clipboard left -->
  <g transform="translate(250,250)">
    <rect x="0" y="20" width="150" height="190" rx="12" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="6"/>
    <rect x="40" y="0" width="70" height="28" rx="8" fill="#3B82F6"/>
    <rect x="22" y="50" width="106" height="10" rx="4" fill="#94A3B8"/>
    <rect x="22" y="72" width="90" height="10" rx="4" fill="#CBD5E1"/>
    <rect x="22" y="94" width="100" height="10" rx="4" fill="#94A3B8"/>
    <rect x="22" y="116" width="70" height="10" rx="4" fill="#CBD5E1"/>
    <text x="75" y="170" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#0F172A">OBS</text>
  </g>
  <!-- mini bleep right -->
  <g transform="translate(860,300)">
    <rect x="0" y="20" width="110" height="80" rx="14" fill="#C4B5FD" stroke="#4C1D95" stroke-width="5"/>
    <rect x="18" y="34" width="74" height="28" rx="6" fill="#BFDBFE"/>
    <circle cx="78" cy="78" r="10" fill="#F97316"/>
    <path d="M115 30 q20 -25 40 -5" stroke="#F97316" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M118 48 q16 -14 30 0" stroke="#F97316" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`)
  }
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- IV pole + bag right -->
  <g transform="translate(860,220)">
    <rect x="70" y="0" width="10" height="260" rx="4" fill="#334155"/>
    <rect x="40" y="0" width="70" height="10" rx="3" fill="#334155"/>
    <path d="M20 30 h90 l10 110 h-110 z" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="5"/>
    <rect x="55" y="140" width="18" height="28" rx="4" fill="#93C5FD" stroke="#1E3A5F" stroke-width="3"/>
    <line x1="64" y1="168" x2="64" y2="230" stroke="#64748B" stroke-width="4"/>
  </g>
  <!-- prescription clipboard left -->
  <g transform="translate(240,250)">
    <rect x="0" y="20" width="160" height="200" rx="12" fill="#FFF7ED" stroke="#9A3412" stroke-width="6"/>
    <rect x="45" y="0" width="70" height="28" rx="8" fill="#F97316"/>
    <text x="80" y="70" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#9A3412">FLUID CHART</text>
    <rect x="24" y="90" width="112" height="10" rx="4" fill="#FDBA74"/>
    <rect x="24" y="112" width="96" height="10" rx="4" fill="#FED7AA"/>
    <rect x="24" y="134" width="104" height="10" rx="4" fill="#FDBA74"/>
  </g>
</svg>`)
}

async function composeCard(opts: {
  title: string
  cat1: string
  cat2: string
  props: 'clipboard-bleep' | 'iv-fluids' | 'potassium'
}): Promise<Buffer> {
  const logo = await sharp(LOGO)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Soft watermark from logo
  const watermark = await sharp(LOGO)
    .resize(700, 700, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .modulate({ brightness: 1.6, saturation: 0.05 })
    .png()
    .toBuffer()
  const watermarkSoft = await sharp(watermark)
    .composite([
      {
        input: Buffer.from(
          `<svg width="700" height="700"><rect width="700" height="700" fill="white" fill-opacity="0.55"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const lines = wrapTitle(opts.title.toUpperCase())
  const banners = await sharp(bannerSvg(lines, opts.cat1, opts.cat2)).png().toBuffer()
  const props = await sharp(propsSvg(opts.props)).png().toBuffer()

  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: watermarkSoft, top: 120, left: 290 },
      { input: props, top: 0, left: 0 },
      { input: logo, top: 210, left: 460 },
      // ground shadow
      {
        input: Buffer.from(
          `<svg width="220" height="28"><ellipse cx="110" cy="14" rx="100" ry="10" fill="#000" fill-opacity="0.12"/></svg>`
        ),
        top: 545,
        left: 530,
      },
      { input: banners, top: 0, left: 0 },
    ])
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

async function main() {
  if (!fs.existsSync(LOGO)) throw new Error(`Missing logo: ${LOGO}`)
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const post of POSTS) {
    console.log(`\n=== ${post.slug}`)
    const webp = await composeCard({
      title: post.featuredTitle,
      cat1: post.cat1,
      cat2: post.cat2,
      props: post.props,
    })
    const local = path.join(OUT_DIR, `${post.slug}-logo.webp`)
    fs.writeFileSync(local, webp)
    console.log('  wrote', local)

    for (const cohort of post.imageCohorts) {
      const storagePath = `foundation-year/${cohort}/${post.topicSlug}/${post.slug}/images/featured-bleepy-logo.webp`
      await sb.storage.from('placements').remove([storagePath])
      const { error } = await sb.storage.from('placements').upload(storagePath, webp, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      })
      if (error) throw error
      console.log('  uploaded', storagePath)

      const { data: pages } = await sb
        .from('fy_pages')
        .select('id, fy_topics!inner(cohort)')
        .eq('slug', post.slug)
        .eq('fy_topics.cohort', cohort)
      for (const page of pages || []) {
        await sb
          .from('fy_pages')
          .update({
            featured_image: storagePath,
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id)
        console.log('  updated', page.id)
      }
    }
  }
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
