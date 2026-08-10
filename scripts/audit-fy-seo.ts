/**
 * Audit Foundation Year posts for SEO surface quality.
 * Excludes the two newest clerking posts by default (pass --include-new to include).
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/audit-fy-seo.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const EXCLUDE = new Set([
  'fy1-review-patient-on-call',
  'fy1-iv-fluid-prescribing',
])

const includeNew = process.argv.includes('--include-new')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function firstParagraph(html: string | null | undefined): string {
  if (!html) return ''
  const m = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)
  const raw = m?.[1] ?? html
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function imgAlts(html: string | null | undefined): {
  total: number
  withAlt: number
  emptyAlt: number
  missingAttr: number
  samples: string[]
} {
  if (!html) {
    return { total: 0, withAlt: 0, emptyAlt: 0, missingAttr: 0, samples: [] }
  }
  const tags = html.match(/<img\b[^>]*>/gi) || []
  let withAlt = 0
  let emptyAlt = 0
  let missingAttr = 0
  const samples: string[] = []
  for (const tag of tags) {
    const altM = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i)
    if (!altM) {
      missingAttr += 1
      if (samples.length < 2) samples.push('(missing alt attr)')
      continue
    }
    const val = altM[2].trim()
    if (!val) {
      emptyAlt += 1
      if (samples.length < 2) samples.push('(empty alt)')
    } else {
      withAlt += 1
      if (samples.length < 2) samples.push(val.slice(0, 80))
    }
  }
  return { total: tags.length, withAlt, emptyAlt, missingAttr, samples }
}

function gradeDescription(desc: string): 'ok' | 'thin' | 'missing' {
  if (!desc) return 'missing'
  if (desc.length < 70) return 'thin'
  return 'ok'
}

async function main() {
  const { data, error } = await sb
    .from('fy_pages')
    .select(
      'id, title, slug, content, featured_image, status, is_active, requires_auth, updated_at, fy_topics!inner(cohort, slug, name)'
    )
    .eq('status', 'published')
    .eq('is_active', true)
    .order('slug')

  if (error) throw error

  const pages = (data || []).filter((p: any) => {
    if (includeNew) return true
    return !EXCLUDE.has(p.slug)
  })

  // Prefer general cohort for public SEO surface; still report all cohorts
  type Row = {
    cohort: string
    topic: string
    slug: string
    title: string
    metaDesc: string
    descGrade: string
    descLen: number
    featured: boolean
    featuredPath: string
    imgs: number
    altsOk: number
    altsEmpty: number
    altsMissing: number
    altSamples: string
    publicSurface: boolean
  }

  const rows: Row[] = pages.map((p: any) => {
    const topic = p.fy_topics
    const desc = firstParagraph(p.content)
    const alts = imgAlts(p.content)
    const publicSurface =
      topic.cohort === 'general' &&
      p.requires_auth !== true &&
      typeof p.featured_image === 'string' &&
      p.featured_image.startsWith('foundation-year/general/')

    return {
      cohort: topic.cohort,
      topic: topic.slug,
      slug: p.slug,
      title: p.title,
      metaDesc: desc,
      descGrade: gradeDescription(desc),
      descLen: desc.length,
      featured: Boolean(p.featured_image),
      featuredPath: p.featured_image || '',
      imgs: alts.total,
      altsOk: alts.withAlt,
      altsEmpty: alts.emptyAlt,
      altsMissing: alts.missingAttr,
      altSamples: alts.samples.join(' | '),
      publicSurface,
    }
  })

  const general = rows.filter((r) => r.cohort === 'general')
  const others = rows.filter((r) => r.cohort !== 'general')

  console.log('=== FY SEO AUDIT ===')
  console.log(
    `Published pages scanned: ${rows.length} (excluded newest two: ${!includeNew})`
  )
  console.log(`General (public SEO surface): ${general.length}`)
  console.log(`Other cohorts: ${others.length}`)
  console.log('')
  console.log(
    'NOTE: DB has no meta_description / primary_keyword / featured_alt columns.'
  )
  console.log(
    'Meta description = first <p> (runtime). Featured alt = `${title} — Foundation Year guide` (runtime).'
  )
  console.log('Primary keyword = NOT stored or emitted anywhere.')
  console.log('')

  const printGroup = (label: string, list: Row[]) => {
    console.log(`\n--- ${label} (${list.length}) ---`)
    for (const r of list.sort((a, b) => a.slug.localeCompare(b.slug))) {
      const altIssue = r.imgs > 0 && r.altsOk < r.imgs
      const flags = [
        r.descGrade !== 'ok' ? `DESC_${r.descGrade.toUpperCase()}` : null,
        !r.featured ? 'NO_FEATURED' : null,
        altIssue ? 'ALT_GAPS' : r.imgs === 0 ? 'NO_INLINE_IMGS' : 'ALTS_OK',
        r.publicSurface ? 'PUBLIC' : 'MEMBERS_OR_PRIVATE_IMG',
      ]
        .filter(Boolean)
        .join(' ')

      console.log(
        `[${r.cohort}/${r.topic}] ${r.slug}\n` +
          `  title: ${r.title}\n` +
          `  metaDesc(${r.descLen}): ${r.metaDesc.slice(0, 140)}${r.metaDesc.length > 140 ? '…' : ''}\n` +
          `  imgs: ${r.imgs} okAlt=${r.altsOk} empty=${r.altsEmpty} missing=${r.altsMissing}` +
          (r.altSamples ? ` samples: ${r.altSamples}` : '') +
          `\n` +
          `  featured: ${r.featured ? r.featuredPath : 'NONE'}\n` +
          `  flags: ${flags}\n`
      )
    }
  }

  printGroup('GENERAL cohort', general)
  printGroup('FY1 / FY2 / other cohorts', others)

  // Summary counts (general only — what Google sees)
  const descOk = general.filter((r) => r.descGrade === 'ok').length
  const descThin = general.filter((r) => r.descGrade === 'thin').length
  const descMissing = general.filter((r) => r.descGrade === 'missing').length
  const withInline = general.filter((r) => r.imgs > 0)
  const allAltsOk = withInline.filter((r) => r.altsOk === r.imgs).length
  const altGaps = withInline.filter((r) => r.altsOk < r.imgs).length
  const noImgs = general.filter((r) => r.imgs === 0).length
  const featuredOk = general.filter((r) => r.featured).length

  console.log('\n=== SUMMARY (general / public) ===')
  console.log(`Meta description OK (>=70 chars first <p>): ${descOk}/${general.length}`)
  console.log(`Meta description thin: ${descThin}`)
  console.log(`Meta description missing: ${descMissing}`)
  console.log(`Featured image set: ${featuredOk}/${general.length}`)
  console.log(`Inline images with all alts filled: ${allAltsOk}/${withInline.length} (posts with images)`)
  console.log(`Inline image alt gaps: ${altGaps}`)
  console.log(`Posts with no inline images: ${noImgs}`)
  console.log(`Primary keyword field: 0/${general.length} (not in schema)`)
  console.log(
    `Featured image alt stored: 0/${general.length} (runtime fallback only)`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
