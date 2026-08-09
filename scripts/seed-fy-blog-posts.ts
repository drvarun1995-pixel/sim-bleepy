/**
 * Duplicate selected blog posts into Foundation Year (General).
 * Supports bleepy.co.uk and scrubtales.co.uk WordPress HTML.
 *
 * Run all:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-blog-posts.ts
 * Run one slug:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-blog-posts.ts nhs-discharge-letter-guide
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { slugify } from '../lib/foundation-year'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type PostSeed = {
  url: string
  topicSlug: string
  slug: string
  titleFallback: string
}

const POSTS: PostSeed[] = [
  {
    url: 'https://bleepy.co.uk/post-falls-assessment/',
    topicSlug: 'working-on-calls',
    slug: 'post-falls-assessment',
    titleFallback: 'Post-Falls Assessment',
  },
  {
    url: 'https://bleepy.co.uk/confusion-screen-bloods/',
    topicSlug: 'clerking-shifts',
    slug: 'confusion-screen-bloods',
    titleFallback: 'Confusion Screen Bloods',
  },
  {
    url: 'https://bleepy.co.uk/mrcp-1-pass-in-two-months/',
    topicSlug: 'settling-at-nhs',
    slug: 'mrcp-1-pass-in-two-months',
    titleFallback: 'How I Passed MRCP Part 1 In 2 Months',
  },
  {
    url: 'https://bleepy.co.uk/how-to-do-a-clinical-audit/',
    topicSlug: 'settling-at-nhs',
    slug: 'how-to-do-a-clinical-audit',
    titleFallback: 'How To Do A Clinical Audit',
  },
  {
    url: 'https://bleepy.co.uk/nhs-discounts-offers/',
    topicSlug: 'settling-at-nhs',
    slug: 'nhs-discounts-offers',
    titleFallback: 'NHS Discounts & Offers',
  },
  {
    url: 'https://scrubtales.co.uk/nhs-discharge-letter-guide-summary/',
    topicSlug: 'settling-at-nhs',
    slug: 'nhs-discharge-letter-guide',
    titleFallback: 'Write Perfect Discharge Letters: NHS Step-by-Step Guide',
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
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<footer/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*sharedaddy/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*jp-relatedposts/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<section[^>]*class="[^"]*related/i,
    // ScrubTales / tagDiv Newspaper theme
    /<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*tdb_single_tags/i,
    /<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*tdb_single_comments/i,
    /<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<div[^>]*id=["']comments["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  const loose =
    html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]*class="[^"]*td-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
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
  // Related / card thumbs (resized filenames)
  if (/-\d{2,4}x\d{2,4}\.(webp|png|jpe?g|gif)/i.test(u)) {
    if (/768x432|150x150|300x169|1024x576|1068x601|96x96/i.test(u)) return false
  }
  return true
}

function normalizeImageUrl(url: string) {
  let u = decodeHtml(url).replace(/&#038;/g, '&')
  // Prefer full scrubtales originals over jetpack resized when possible
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
  out = out.replace(
    /<span\b[^>]*class=["'][^"']*\bez-toc-section(?:-end)?\b[^"']*["'][^>]*>\s*<\/span>/gi,
    ''
  )
  return out
}

function cleanContentHtml(raw: string): string {
  let html = raw
  // Drop similar posts / share / related blocks
  html = html.replace(/<div[^>]*class="[^"]*sharedaddy[\s\S]*$/i, '')
  html = html.replace(/<div[^>]*class="[^"]*jp-relatedposts[\s\S]*$/i, '')
  html = html.replace(/<h2[^>]*>\s*Similar Posts[\s\S]*$/i, '')
  html = html.replace(/<h2[^>]*>\s*Table of Contents[\s\S]*?<\/(nav|div|ol|ul)>/gi, '')
  html = stripEasyToc(html)
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  html = html.replace(/\ssrcset="[^"]*"/gi, '')
  html = html.replace(/\ssizes="[^"]*"/gi, '')
  html = html.replace(/\sloading="[^"]*"/gi, '')
  html = html.replace(/\sdecoding="[^"]*"/gi, '')
  html = html.replace(/\swidth="[^"]*"/gi, '')
  html = html.replace(/\sheight="[^"]*"/gi, '')
  // Promote lazy-load attrs to src before stripping other data-* attrs
  for (const attr of ['data-src', 'data-lazy-src', 'data-orig-src', 'data-lazy-srcset']) {
    if (attr === 'data-lazy-srcset') continue
    html = html.replace(
      new RegExp(
        `<img([^>]*?)src="data:image[^"]*"([^>]*?)${attr}="([^"]+)"([^>]*)>`,
        'gi'
      ),
      '<img$1src="$3"$2$4>'
    )
    html = html.replace(
      new RegExp(
        `<img([^>]*?)${attr}="([^"]+)"([^>]*?)src="data:image[^"]*"([^>]*)>`,
        'gi'
      ),
      '<img$1src="$2"$3$4>'
    )
  }
  html = html.replace(/\sdata-[a-z-]+="[^"]*"/gi, '')
  // Drop any remaining blank SVG lazy-load spacers
  html = html.replace(
    /<img\b[^>]*src=["']data:image\/svg\+xml[^"']*["'][^>]*>/gi,
    ''
  )
  // After promoting lazy src, drop noscript duplicates and <picture>/<source> chrome
  html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
  html = html.replace(/<source\b[^>]*>/gi, '')
  html = html.replace(/<\/?picture\b[^>]*>/gi, '')
  // Unwrap empty tagDiv / WP chrome wrappers we don't need
  html = html.replace(/<\/?div[^>]*class="[^"]*tdb-block-inner[^"]*"[^>]*>/gi, '')
  html = html.replace(/\sclass="wp-block-paragraph"/gi, '')
  return html.trim()
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
  sourceUrl: string,
  isFeatured = false
): Promise<string> {
  const cleanUrl = normalizeImageUrl(sourceUrl)
  let buffer = await downloadBuffer(cleanUrl)
  const isGif = /\.gif($|\?)/i.test(cleanUrl)
  let fileName = isFeatured
    ? 'featured.webp'
    : `${key}${isGif ? '.gif' : '.webp'}`
  let contentType = isGif ? 'image/gif' : 'image/webp'

  if (!isGif) {
    const webp = await sharp(buffer).webp({ quality: 82, effort: 4 }).toBuffer()
    buffer = Buffer.from(webp)
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

async function seedPost(post: PostSeed) {
  console.log(`\n=== ${post.url}`)
  const res = await fetch(post.url)
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
  const html = await res.text()

  const title =
    pick(html, /property=["']og:title["'][^>]*content=["']([^"']+)/i) ||
    pick(html, /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)/i) ||
    post.titleFallback

  const featured =
    pick(html, /property=["']og:image["'][^>]*content=["']([^"']+)/i) ||
    pick(html, /content=["']([^"']+)["'][^>]*property=["']og:image["']/i)

  let content = cleanContentHtml(extractEntryContent(html))
  if (!content) throw new Error('No entry-content found')

  // Collect image URLs from content
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const found: { full: string; src: string; alt: string }[] = []
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(content)) !== null) {
    const full = match[0]
    const src = normalizeImageUrl(match[1])
    const alt = pick(full, /alt=["']([^"']*)["']/i) || ''
    if (isArticleImage(src)) found.push({ full, src, alt })
  }

  // Unique by URL
  const unique = new Map<string, { full: string; src: string; alt: string }>()
  for (const item of found) {
    if (!unique.has(item.src)) unique.set(item.src, item)
  }

  const { data: topic, error: topicError } = await supabase
    .from('fy_topics')
    .select('id, name, slug')
    .eq('cohort', 'general')
    .eq('slug', post.topicSlug)
    .single()

  if (topicError || !topic) throw new Error(`Topic missing: ${post.topicSlug}`)

  let featuredPath: string | null = null
  if (featured) {
    console.log('  featured...')
    featuredPath = await uploadImage(post.topicSlug, post.slug, 'featured', featured, true)
  }

  let index = 0
  for (const item of unique.values()) {
    index += 1
    const key = `img-${index}`
    console.log(`  image ${index}: ${item.src.slice(0, 90)}...`)
    try {
      const path = await uploadImage(post.topicSlug, post.slug, key, item.src)
      const cls = classifyImage(item.src, item.alt)
      const replacement = `<p style="text-align:center"><img src="${viewUrl(path)}" alt="${item.alt.replace(/"/g, '&quot;')}" class="${cls}" /></p>`
      // Replace every occurrence of this image tag-ish src
      content = content.replace(
        new RegExp(`<img[^>]+src=["']${item.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'),
        replacement
      )
      // Also replace encoded variants
      content = content.replace(
        new RegExp(
          `<img[^>]+src=["']${decodeHtml(item.src).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
          'gi'
        ),
        replacement
      )
    } catch (err: any) {
      console.warn(`  skip image: ${err.message}`)
    }
  }

  // Unwrap nested <p><p>...</p></p> from replacements
  content = content.replace(/<p[^>]*>\s*(<p[^>]*>)/gi, '$1')
  content = content.replace(/(<\/p>)\s*<\/p>/gi, '$1')

  // Soft cleanup leftover wrappers
  content = content
    .replace(/<\/?figure[^>]*>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<\/?noscript>/gi, '')
    .replace(/\n{3,}/g, '\n\n')

  const { data: existing } = await supabase
    .from('fy_pages')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('slug', post.slug)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('fy_pages')
      .update({
        title,
        content,
        featured_image: featuredPath,
        status: 'published',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw error
    console.log(`  updated ${existing.id}`)
  } else {
    const { data: page, error } = await supabase
      .from('fy_pages')
      .insert({
        topic_id: topic.id,
        title,
        slug: post.slug || slugify(title),
        content,
        featured_image: featuredPath,
        status: 'published',
        is_active: true,
        display_order: 1,
      })
      .select('id')
      .single()
    if (error) throw error
    console.log(`  created ${page?.id}`)
  }

  console.log(
    `  open: http://localhost:3000/placements/foundation-year/general/${post.topicSlug}/${post.slug}`
  )
}

async function main() {
  const only = process.argv[2]?.trim()
  const selected = only ? POSTS.filter((p) => p.slug === only || p.topicSlug === only) : POSTS
  if (!selected.length) {
    console.error(`No posts matched "${only}". Known slugs: ${POSTS.map((p) => p.slug).join(', ')}`)
    process.exit(1)
  }
  for (const post of selected) {
    await seedPost(post)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
