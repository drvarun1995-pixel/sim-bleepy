/**
 * Import a batch of ScrubTales posts into Foundation Year (General).
 * Skips slugs that already exist. Does NOT use ScrubTales og:image as featured
 * (Bleepy featured cards are composed separately).
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-scrubtales-batch.ts
 * One slug:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-scrubtales-batch.ts abg-made-easy
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { slugify } from '../lib/foundation-year'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type PostSeed = {
  url: string
  topicSlug: string
  slug: string
  titleFallback: string
  categoryLine1?: string
  categoryLine2?: string
  featuredTitle?: string
}

export const BATCH_POSTS: PostSeed[] = [
  {
    url: 'https://scrubtales.co.uk/types-of-delusion-examples-differences/',
    topicSlug: 'clerking-shifts',
    slug: 'types-of-delusion',
    titleFallback: 'Types of Delusion: Examples & Differences',
    featuredTitle: 'TYPES OF DELUSION',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/financial-guide-for-uk-doctors/',
    topicSlug: 'settling-at-nhs',
    slug: 'financial-guide-uk-doctors',
    titleFallback: 'Financial Guide for UK Doctors',
    featuredTitle: 'FINANCIAL GUIDE FOR UK DOCTORS',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/abg-made-easy/',
    topicSlug: 'clerking-shifts',
    slug: 'abg-made-easy',
    titleFallback: 'ABG Made Easy',
    featuredTitle: 'ABG MADE EASY',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/aki-stages-quick-guide-junior-doctors/',
    topicSlug: 'clerking-shifts',
    slug: 'aki-stages-quick-guide',
    titleFallback: 'AKI Stages: Quick Guide for Junior Doctors',
    featuredTitle: 'AKI STAGES QUICK GUIDE',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/all-nhs-discounts-list-table/',
    topicSlug: 'settling-at-nhs',
    slug: 'all-nhs-discounts-list',
    titleFallback: 'All NHS Discounts List',
    featuredTitle: 'ALL NHS DISCOUNTS LIST',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/best-5-medical-indemnity-insurance-nhs-doctors/',
    topicSlug: 'settling-at-nhs',
    slug: 'medical-indemnity-insurance',
    titleFallback: 'Best Medical Indemnity Insurance for NHS Doctors',
    featuredTitle: 'MEDICAL INDEMNITY INSURANCE',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/best-places-to-find-nhs-jobs-imgs/',
    topicSlug: 'settling-at-nhs',
    slug: 'nhs-jobs-guide',
    titleFallback: 'Best Places to Find NHS Jobs',
    featuredTitle: 'BEST PLACES TO FIND NHS JOBS',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/best-free-medical-apps-for-doctors/',
    topicSlug: 'settling-at-nhs',
    slug: 'free-medical-apps',
    titleFallback: 'Best Free Medical Apps for Doctors',
    featuredTitle: 'BEST FREE MEDICAL APPS',
    categoryLine1: 'PRACTICAL TIPS',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/bladder-scan-ultrasound-scanner-results/',
    topicSlug: 'clerking-shifts',
    slug: 'bladder-scan-guide',
    titleFallback: 'Bladder Scan Ultrasound: How to Read Results',
    featuredTitle: 'BLADDER SCAN GUIDE',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/clinical-gap-nhs-job-application-guide/',
    topicSlug: 'settling-at-nhs',
    slug: 'clinical-gap-job-application',
    titleFallback: 'Clinical Gap: NHS Job Application Guide',
    featuredTitle: 'CLINICAL GAP JOB GUIDE',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/dnar-guide-uk-doctors-dnacpr/',
    topicSlug: 'working-on-calls',
    slug: 'dnar-dnacpr-guide',
    titleFallback: 'DNAR / DNACPR Guide for UK Doctors',
    featuredTitle: 'DNAR DNACPR GUIDE',
    categoryLine1: 'PRACTICAL TIPS',
    categoryLine2: 'WORKING ON-CALLS',
  },
  {
    url: 'https://scrubtales.co.uk/cpd-courses-free-paid-list-nhs-trac-jobs/',
    topicSlug: 'settling-at-nhs',
    slug: 'cpd-courses-nhs',
    titleFallback: 'CPD Courses: Free & Paid List for NHS Doctors',
    featuredTitle: 'CPD COURSES FOR NHS DOCTORS',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/vte-prophylaxis-risk-assessment-guidelines/',
    topicSlug: 'clerking-shifts',
    slug: 'vte-prophylaxis-guide',
    titleFallback: 'VTE Prophylaxis Risk Assessment Guidelines',
    featuredTitle: 'VTE PROPHYLAXIS GUIDE',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/how-to-pass-dvsa-theory-test/',
    topicSlug: 'settling-at-nhs',
    slug: 'dvsa-theory-test',
    titleFallback: 'How to Pass the DVSA Theory Test',
    featuredTitle: 'PASS THE DVSA THEORY TEST',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/mcdonalds-nhs-discount-offer-guide/',
    topicSlug: 'settling-at-nhs',
    slug: 'mcdonalds-nhs-discount',
    titleFallback: "McDonald's NHS Discount Offer Guide",
    featuredTitle: "MCDONALD'S NHS DISCOUNT",
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/nhs-bleep-system-guide/',
    topicSlug: 'working-on-calls',
    slug: 'nhs-bleep-system',
    titleFallback: 'NHS Bleep System Guide',
    featuredTitle: 'NHS BLEEP SYSTEM GUIDE',
    categoryLine1: 'PRACTICAL TIPS',
    categoryLine2: 'WORKING ON-CALLS',
  },
  {
    url: 'https://scrubtales.co.uk/nhs-pension-contributions-explained/',
    topicSlug: 'settling-at-nhs',
    slug: 'nhs-pension-contributions',
    titleFallback: 'NHS Pension Contributions Explained',
    featuredTitle: 'NHS PENSION CONTRIBUTIONS',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/ecg-basics-guide-step-by-step/',
    topicSlug: 'clerking-shifts',
    slug: 'ecg-basics-guide',
    titleFallback: 'ECG Basics: Step-by-Step Guide',
    featuredTitle: 'ECG BASICS STEP BY STEP',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/iv-cannula-guide-nhs-uk/',
    topicSlug: 'clerking-shifts',
    slug: 'iv-cannula-guide',
    titleFallback: 'IV Cannula Guide for NHS UK',
    featuredTitle: 'IV CANNULA GUIDE',
    categoryLine1: 'CLINICAL SKILLS',
    categoryLine2: 'CLERKING SHIFTS',
  },
  {
    url: 'https://scrubtales.co.uk/open-bank-account-uk-nhs-pros-cons/',
    topicSlug: 'settling-at-nhs',
    slug: 'uk-bank-account-guide',
    titleFallback: 'Opening a UK Bank Account: Pros & Cons for NHS Doctors',
    featuredTitle: 'UK BANK ACCOUNT GUIDE',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
  {
    url: 'https://scrubtales.co.uk/understanding-nhs-staff-roles-in-mdt/',
    topicSlug: 'where-to-seek-support',
    slug: 'nhs-staff-roles-mdt',
    titleFallback: 'Understanding NHS Staff Roles in the MDT',
    featuredTitle: 'NHS STAFF ROLES IN THE MDT',
    categoryLine1: 'PRACTICAL TIPS',
    categoryLine2: 'SEEKING SUPPORT',
  },
  {
    url: 'https://scrubtales.co.uk/als-courses-advanced-life-support-certification/',
    topicSlug: 'settling-at-nhs',
    slug: 'als-courses-guide',
    titleFallback: 'ALS Courses & Advanced Life Support Certification',
    featuredTitle: 'ALS COURSES GUIDE',
    categoryLine1: 'GENERAL GUIDES',
    categoryLine2: 'WORKING IN THE NHS',
  },
]

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function pick(html: string, re: RegExp) {
  const m = html.match(re)
  return m?.[1] ? decodeHtml(m[1]) : null
}

function extractEntryContent(html: string): string {
  const patterns = [
    /<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*tdb_single_tags/i,
    /<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*tdb_single_comments/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<footer/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*sharedaddy/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  const loose =
    html.match(/<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  return loose?.[1] || ''
}

function isArticleImage(url: string) {
  const u = url.toLowerCase()
  if (!/wp-content|uploads|scrubtales|i0\.wp\.com/i.test(u)) return false
  if (
    /bleepy-logo|ultimatemember|profile_photo|gravatar|scrubtales-white-header|dr\.?-apoorva|author/i.test(
      u
    )
  ) {
    return false
  }
  if (/-\d{2,4}x\d{2,4}\.(webp|png|jpe?g|gif)/i.test(u)) {
    if (/768x432|150x150|300x169|1024x576|1068x601|96x96/i.test(u)) return false
  }
  return true
}

function normalizeImageUrl(url: string) {
  let u = decodeHtml(url).replace(/&#038;/g, '&')
  u = u.replace(/\?fit=\d+%2C\d+&ssl=1/i, '')
  u = u.replace(/\?fit=\d+,\d+&ssl=1/i, '')
  return u
}

function classifyImage(url: string, alt: string) {
  const u = url.toLowerCase()
  const a = alt.toLowerCase()
  if (u.endsWith('.gif') || u.includes('.gif?')) return 'fy-img fy-img-gif'
  if (/phone|app|accurx|handbook|blue-light|proforma|portrait|book|4at/i.test(u + a)) {
    return 'fy-img fy-img-portrait'
  }
  return 'fy-img fy-img-wide'
}

function removeBalancedElement(html: string, start: number): string | null {
  if (html[start] !== '<') return null
  const tagMatch = html.slice(start).match(/^<\/?([a-zA-Z][\w:-]*)/)
  if (!tagMatch || html[start + 1] === '/') return null
  const tag = tagMatch[1].toLowerCase()
  let i = start
  let depth = 0
  while (i < html.length) {
    const next = html.indexOf('<', i)
    if (next === -1) return null
    const slice = html.slice(next)
    const open = slice.match(new RegExp(`^<${tag}\\b[^>]*>`, 'i'))
    const close = slice.match(new RegExp(`^</${tag}\\s*>`, 'i'))
    const selfClosing = slice.match(new RegExp(`^<${tag}\\b[^>]*/>`, 'i'))
    if (selfClosing) {
      if (depth === 0) return html.slice(0, start) + html.slice(next + selfClosing[0].length)
      i = next + selfClosing[0].length
      continue
    }
    if (open) {
      depth += 1
      i = next + open[0].length
      continue
    }
    if (close) {
      depth -= 1
      i = next + close[0].length
      if (depth === 0) return html.slice(0, start) + html.slice(i)
      continue
    }
    i = next + 1
  }
  return null
}

function stripEasyToc(html: string): string {
  let out = html
  const rootPatterns = [
    /<div\b[^>]*\bid=["']ez-toc-container["'][^>]*>/i,
    /<div\b[^>]*\bclass=["'][^"']*\bez-toc(?:-container)?\b[^"']*["'][^>]*>/i,
  ]
  let guard = 0
  while (guard < 20) {
    guard += 1
    let removed = false
    for (const re of rootPatterns) {
      const match = out.match(re)
      if (!match || match.index === undefined) continue
      const next = removeBalancedElement(out, match.index)
      if (next !== null && next !== out) {
        out = next
        removed = true
        break
      }
    }
    if (!removed) break
  }
  return out.replace(
    /<span\b[^>]*class=["'][^"']*\bez-toc-section(?:-end)?\b[^"']*["'][^>]*>\s*<\/span>/gi,
    ''
  )
}

function cleanContentHtml(raw: string): string {
  let html = raw
  html = html.replace(/<div[^>]*class="[^"]*sharedaddy[\s\S]*$/i, '')
  html = html.replace(/<div[^>]*class="[^"]*jp-relatedposts[\s\S]*$/i, '')
  html = html.replace(/<h2[^>]*>\s*Similar Posts[\s\S]*$/i, '')
  html = stripEasyToc(html)
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  html = html.replace(/\ssrcset="[^"]*"/gi, '')
  html = html.replace(/\ssizes="[^"]*"/gi, '')
  html = html.replace(/\sloading="[^"]*"/gi, '')
  html = html.replace(/\sdecoding="[^"]*"/gi, '')
  html = html.replace(/\swidth="[^"]*"/gi, '')
  html = html.replace(/\sheight="[^"]*"/gi, '')
  for (const attr of ['data-src', 'data-lazy-src', 'data-orig-src']) {
    html = html.replace(
      new RegExp(`<img([^>]*?)src="data:image[^"]*"([^>]*?)${attr}="([^"]+)"([^>]*)>`, 'gi'),
      '<img$1src="$3"$2$4>'
    )
    html = html.replace(
      new RegExp(`<img([^>]*?)${attr}="([^"]+)"([^>]*?)src="data:image[^"]*"([^>]*)>`, 'gi'),
      '<img$1src="$2"$3$4>'
    )
  }
  html = html.replace(/\sdata-[a-z-]+="[^"]*"/gi, '')
  html = html.replace(/<img\b[^>]*src=["']data:image\/svg\+xml[^"']*["'][^>]*>/gi, '')
  html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
  html = html.replace(/<source\b[^>]*>/gi, '')
  html = html.replace(/<\/?picture\b[^>]*>/gi, '')
  html = html.replace(/<\/?div[^>]*class="[^"]*tdb-block-inner[^"]*"[^>]*>/gi, '')
  html = html.replace(/\sclass="wp-block-paragraph"/gi, '')
  return html.trim()
}

/** UK-doctor audience + year bump + scrubtales link cleanup */
function rewriteForUkAudience(html: string): string {
  let out = html

  // Year bump in visible text only (avoid breaking image/asset URLs)
  out = out.replace(/(src|href)=["'][^"']*["']/gi, (m) => m.replace(/2025/g, '§YR§'))
  out = out.replace(/\b2025\b/g, '2026')
  out = out.replace(/§YR§/g, '2025')

  // Common IMG / international framing
  const replacements: Array<[RegExp, string]> = [
    [/\bIMGs?\b/g, 'doctors'],
    [/international medical graduates?/gi, 'doctors'],
    [/international doctors?/gi, 'doctors'],
    [/for IMGs\b/gi, 'for doctors'],
    [/as an IMG\b/gi, 'as a doctor'],
    [/overseas doctors?/gi, 'doctors'],
    [/doctors coming to the UK/gi, 'doctors working in the UK'],
    [/new to the UK\/NHS/gi, 'new to NHS practice'],
    [/new to the UK/gi, 'new to NHS practice'],
    [/relocating to the UK/gi, 'starting work in the NHS'],
    [/planning to apply from abroad/gi, 'preparing for NHS roles'],
    [/from abroad/gi, 'elsewhere'],
    [/If you are an international doctor[, ]*/gi, ''],
    [/designed for international doctors/gi, 'designed for NHS doctors'],
    [/perfect for IMGs/gi, 'useful for foundation doctors'],
    [/clinical attachments?/gi, 'supervised placements'],
  ]

  for (const [re, to] of replacements) out = out.replace(re, to)

  // Retarget or unwrap scrubtales links
  out = out.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, inner) => {
    const hrefMatch = String(attrs).match(/href=["']([^"']+)["']/i)
    const href = (hrefMatch?.[1] || '').toLowerCase()
    if (!href.includes('scrubtales.co.uk')) return full

    const map: Record<string, string> = {
      'nhs-on-call-duties-for-doctors-img-guide':
        '/placements/foundation-year/general/working-on-calls/what-are-on-call-shifts',
      'confusion-screen-bloods':
        '/placements/foundation-year/general/clerking-shifts/confusion-screen-bloods',
      'post-falls-assessment':
        '/placements/foundation-year/general/working-on-calls/post-falls-assessment',
      'nhs-discharge-letter-guide-summary':
        '/placements/foundation-year/general/settling-at-nhs/nhs-discharge-letter-guide',
      'how-to-do-a-clinical-audit':
        '/placements/foundation-year/general/settling-at-nhs/how-to-do-a-clinical-audit',
      'nhs-discounts-offers':
        '/placements/foundation-year/general/settling-at-nhs/nhs-discounts-offers',
      'dnar-guide-uk-doctors-dnacpr':
        '/placements/foundation-year/general/working-on-calls/dnar-dnacpr-guide',
      'understanding-nhs-staff-roles-in-mdt':
        '/placements/foundation-year/general/where-to-seek-support/nhs-staff-roles-mdt',
      'aki-stages-quick-guide-junior-doctors':
        '/placements/foundation-year/general/clerking-shifts/aki-stages-quick-guide',
      'abg-made-easy': '/placements/foundation-year/general/clerking-shifts/abg-made-easy',
      'ecg-basics-guide-step-by-step':
        '/placements/foundation-year/general/clerking-shifts/ecg-basics-guide',
      'iv-cannula-guide-nhs-uk':
        '/placements/foundation-year/general/clerking-shifts/iv-cannula-guide',
      'vte-prophylaxis-risk-assessment-guidelines':
        '/placements/foundation-year/general/clerking-shifts/vte-prophylaxis-guide',
      'nhs-bleep-system-guide':
        '/placements/foundation-year/general/working-on-calls/nhs-bleep-system',
    }

    for (const [key, dest] of Object.entries(map)) {
      if (href.includes(key)) {
        const cleaned = String(attrs)
          .replace(/\s*target=["'][^"']*["']/gi, '')
          .replace(/\s*rel=["'][^"']*["']/gi, '')
          .replace(/href=["'][^"']*["']/i, `href="${dest}"`)
        return `<a${cleaned}>${inner}</a>`
      }
    }
    return inner
  })

  // Alt text cleanup
  out = out.replace(/\bfor IMG Doctors\b/gi, 'for NHS Doctors')
  out = out.replace(/\bIMG Doctors\b/gi, 'NHS Doctors')
  out = out.replace(/\bfor IMGs\b/gi, 'for doctors')

  return out
}

function viewUrl(path: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(path)}`
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadImage(
  scope: string,
  pageSlug: string,
  key: string,
  sourceUrl: string
): Promise<string> {
  const cleanUrl = normalizeImageUrl(sourceUrl)
  let buffer = await downloadBuffer(cleanUrl)
  const isGif = /\.gif($|\?)/i.test(cleanUrl)
  const fileName = `${key}${isGif ? '.gif' : '.webp'}`
  const contentType = isGif ? 'image/gif' : 'image/webp'

  if (!isGif) {
    buffer = Buffer.from(await sharp(buffer).webp({ quality: 82, effort: 4 }).toBuffer())
  }

  const path = `foundation-year/general/${scope}/${pageSlug}/images/${fileName}`
  const { error } = await supabase.storage.from('placements').upload(path, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed (${fileName}): ${error.message}`)
  return path
}

async function seedPost(post: PostSeed, force = false) {
  console.log(`\n=== ${post.slug}`)

  const { data: existingAny } = await supabase
    .from('fy_pages')
    .select('id, slug, title')
    .eq('slug', post.slug)
    .maybeSingle()

  if (existingAny && !force) {
    console.log(`  SKIP already exists: ${existingAny.title}`)
    return { skipped: true as const, slug: post.slug }
  }

  const res = await fetch(post.url)
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
  const html = await res.text()

  let title =
    pick(html, /property=["']og:title["'][^>]*content=["']([^"']+)/i) ||
    pick(html, /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)/i) ||
    post.titleFallback

  // Soften IMG-y titles
  title = title
    .replace(/\bfor IMGs\b/gi, 'for Doctors')
    .replace(/\bIMG\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  let content = rewriteForUkAudience(cleanContentHtml(extractEntryContent(html)))
  if (!content) throw new Error('No content found')

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const found: { src: string; alt: string }[] = []
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(content)) !== null) {
    const src = normalizeImageUrl(match[1])
    const alt = pick(match[0], /alt=["']([^"']*)["']/i) || ''
    if (isArticleImage(src)) found.push({ src, alt })
  }
  const unique = new Map<string, { src: string; alt: string }>()
  for (const item of found) if (!unique.has(item.src)) unique.set(item.src, item)

  const { data: topic, error: topicError } = await supabase
    .from('fy_topics')
    .select('id, slug')
    .eq('cohort', 'general')
    .eq('slug', post.topicSlug)
    .single()
  if (topicError || !topic) throw new Error(`Topic missing: ${post.topicSlug}`)

  let index = 0
  for (const item of unique.values()) {
    index += 1
    const key = `img-${index}`
    process.stdout.write(`  image ${index}... `)
    try {
      const path = await uploadImage(post.topicSlug, post.slug, key, item.src)
      const cls = classifyImage(item.src, item.alt)
      const alt = item.alt
        .replace(/"/g, '&quot;')
        .replace(/\bIMG\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
      const replacement = `<p style="text-align:center"><img src="${viewUrl(path)}" alt="${alt}" class="${cls}" /></p>`
      const srcVariants = [
        item.src,
        decodeHtml(item.src),
        item.src.replace(/&/g, '&amp;'),
        item.src.replace(/&/g, '&#038;'),
      ]
      for (const variant of [...new Set(srcVariants)]) {
        content = content.replace(
          new RegExp(
            `<img[^>]+src=["']${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
            'gi'
          ),
          replacement
        )
      }
      console.log('ok')
    } catch (err: any) {
      console.log('skip', err.message)
    }
  }

  content = content.replace(/<p[^>]*>\s*(<p[^>]*>)/gi, '$1')
  content = content.replace(/(<\/p>)\s*<\/p>/gi, '$1')
  content = content
    .replace(/<\/?figure[^>]*>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/\n{3,}/g, '\n\n')

  if (existingAny) {
    const { error } = await supabase
      .from('fy_pages')
      .update({
        title,
        content,
        status: 'published',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAny.id)
    if (error) throw error
    console.log(`  updated ${existingAny.id}`)
  } else {
    const { data: page, error } = await supabase
      .from('fy_pages')
      .insert({
        topic_id: topic.id,
        title,
        slug: post.slug || slugify(title),
        content,
        featured_image: null,
        status: 'published',
        is_active: true,
        display_order: 1,
      })
      .select('id')
      .single()
    if (error) throw error
    console.log(`  created ${page?.id}`)
  }

  console.log(`  open: /placements/foundation-year/general/${post.topicSlug}/${post.slug}`)
  return { skipped: false as const, slug: post.slug, topicSlug: post.topicSlug }
}

async function main() {
  const only = process.argv[2]?.trim()
  const force = process.argv.includes('--force')
  const selected = only
    ? BATCH_POSTS.filter((p) => p.slug === only || p.topicSlug === only)
    : BATCH_POSTS
  if (!selected.length) {
    console.error(`No match. Slugs: ${BATCH_POSTS.map((p) => p.slug).join(', ')}`)
    process.exit(1)
  }

  let created = 0
  let skipped = 0
  for (const post of selected) {
    try {
      const result = await seedPost(post, force)
      if (result.skipped) skipped += 1
      else created += 1
    } catch (err: any) {
      console.error(`  FAILED ${post.slug}:`, err.message)
    }
  }
  console.log(`\nDone. imported/updated=${created} skipped=${skipped}`)
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /seed-fy-scrubtales-batch\.(ts|js|mjs|cjs)$/i.test(process.argv[1].replace(/\\/g, '/'))

if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
