/**
 * SEO interlinking for public Foundation Year guides.
 *
 * 1) Rewrite login-walled /placements/foundation-year/general/... links → /guides/...
 * 2) Add a small number of highly relevant in-content links (max ~2–3/page)
 * 3) Mirror content updates onto matching fy1 pages when present
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/interlink-fy-guides.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type LinkSpec = {
  /** Case-insensitive phrase to wrap once (must already appear in prose) */
  phrase: string
  topic: string
  slug: string
  titleHint?: string
}

/** Curated relevance map — quality over quantity */
const NEW_LINKS: Record<string, LinkSpec[]> = {
  // Clinical / clerking / on-call
  'fy1-potassium-prescribing-hypokalaemia': [
    { phrase: 'ECG abnormalities', topic: 'clerking-shifts', slug: 'ecg-basics-guide' },
    { phrase: 'renal function', topic: 'clerking-shifts', slug: 'aki-stages-quick-guide' },
  ],
  'fy1-anticoagulation-ward-basics': [
    { phrase: 'VTE prophylaxis', topic: 'clerking-shifts', slug: 'vte-prophylaxis-guide' },
  ],
  'fy1-new-oxygen-requirement': [
    { phrase: 'blood gas', topic: 'clerking-shifts', slug: 'abg-made-easy' },
    { phrase: 'ABCDE', topic: 'clerking-shifts', slug: 'fy1-review-patient-on-call' },
  ],
  'fy1-review-patient-on-call': [
    { phrase: 'on-call', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
    { phrase: 'bleep', topic: 'working-on-calls', slug: 'nhs-bleep-system' },
    { phrase: 'oxygen', topic: 'working-on-calls', slug: 'fy1-new-oxygen-requirement' },
  ],
  'abg-made-easy': [
    { phrase: 'oxygen', topic: 'working-on-calls', slug: 'fy1-new-oxygen-requirement' },
    { phrase: 'Renal failure', topic: 'clerking-shifts', slug: 'aki-stages-quick-guide' },
  ],
  'aki-stages-quick-guide': [
    { phrase: 'potassium', topic: 'clerking-shifts', slug: 'fy1-potassium-prescribing-hypokalaemia' },
  ],
  'ecg-basics-guide': [
    { phrase: 'potassium', topic: 'clerking-shifts', slug: 'fy1-potassium-prescribing-hypokalaemia' },
  ],
  'vte-prophylaxis-guide': [
    { phrase: 'anticoagulation', topic: 'clerking-shifts', slug: 'fy1-anticoagulation-ward-basics' },
  ],
  'confusion-screen-bloods': [
    { phrase: 'junior doctor', topic: 'clerking-shifts', slug: 'fy1-review-patient-on-call' },
  ],
  'bladder-scan-guide': [
    { phrase: 'on calls', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'iv-cannula-guide': [
    { phrase: 'starting your career in the NHS', topic: 'settling-at-nhs', slug: 'nhs-jobs-guide' },
  ],
  'post-falls-assessment': [
    { phrase: 'on-call shift', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
    { phrase: 'bleeps', topic: 'working-on-calls', slug: 'nhs-bleep-system' },
  ],
  'dnar-dnacpr-guide': [
    { phrase: 'on-calls', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'nhs-bleep-system': [
    { phrase: 'patient reviews', topic: 'clerking-shifts', slug: 'fy1-review-patient-on-call' },
    { phrase: 'on-call', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'what-are-on-call-shifts': [
    { phrase: 'Clerking', topic: 'clerking-shifts', slug: 'fy1-review-patient-on-call' },
    { phrase: 'bleep', topic: 'working-on-calls', slug: 'nhs-bleep-system' },
  ],

  // Settling / careers — soft relevant pairs only
  'all-nhs-discounts-list': [
    { phrase: 'McDonald', topic: 'settling-at-nhs', slug: 'mcdonalds-nhs-discount' },
  ],
  'mcdonalds-nhs-discount': [
    { phrase: 'NHS discounts', topic: 'settling-at-nhs', slug: 'all-nhs-discounts-list' },
  ],
  'financial-guide-uk-doctors': [
    { phrase: 'pension', topic: 'settling-at-nhs', slug: 'nhs-pension-contributions' },
    { phrase: 'savings account', topic: 'settling-at-nhs', slug: 'uk-bank-account-guide' },
  ],
  'nhs-pension-contributions': [
    { phrase: 'financial', topic: 'settling-at-nhs', slug: 'financial-guide-uk-doctors' },
  ],
  'uk-bank-account-guide': [
    { phrase: 'financial', topic: 'settling-at-nhs', slug: 'financial-guide-uk-doctors' },
  ],
  'nhs-jobs-guide': [
    { phrase: 'CPD courses', topic: 'settling-at-nhs', slug: 'cpd-courses-nhs' },
  ],
  'als-courses-guide': [
    { phrase: 'NHS jobs', topic: 'settling-at-nhs', slug: 'nhs-jobs-guide' },
  ],
  'cpd-courses-nhs': [
    { phrase: 'NHS jobs', topic: 'settling-at-nhs', slug: 'nhs-jobs-guide' },
    { phrase: 'clinical audit', topic: 'settling-at-nhs', slug: 'how-to-do-a-clinical-audit' },
  ],
  'how-to-do-a-clinical-audit': [
    { phrase: 'CPD', topic: 'settling-at-nhs', slug: 'cpd-courses-nhs' },
  ],
  'clinical-gap-job-application': [
    { phrase: 'NHS jobs', topic: 'settling-at-nhs', slug: 'nhs-jobs-guide' },
  ],
  'medical-indemnity-insurance': [
    { phrase: 'starting your career as a Doctor in the NHS', topic: 'settling-at-nhs', slug: 'nhs-jobs-guide' },
  ],
  'nhs-staff-roles-mdt': [
    { phrase: 'On-call doctors', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'nhs-discharge-letter-guide': [
    { phrase: 'on-call', topic: 'working-on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'free-medical-apps': [
    { phrase: 'NHS Discounts List', topic: 'settling-at-nhs', slug: 'all-nhs-discounts-list' },
    { phrase: 'bleeps', topic: 'working-on-calls', slug: 'nhs-bleep-system' },
  ],
  'mrcp-1-pass-in-two-months': [
    { phrase: 'CPD', topic: 'settling-at-nhs', slug: 'cpd-courses-nhs' },
  ],
}

function guideHref(topic: string, slug: string) {
  return `/guides/foundation-year/${topic}/${slug}`
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Rewrite placements/general FY article links to public /guides/ URLs */
function rewritePlacementsToGuides(html: string): string {
  return html.replace(
    /href="\/placements\/foundation-year\/general\/([^"/]+)\/([^"/]+)(\/?)([^"]*)"/g,
    (_m, topic: string, slug: string, _slash: string, rest: string) => {
      // Only rewrite page links, not image API paths etc.
      if (rest && rest.length > 0) {
        return `href="/placements/foundation-year/general/${topic}/${slug}${_slash}${rest}"`
      }
      return `href="${guideHref(topic, slug)}"`
    }
  )
}

/**
 * Wrap the first occurrence of `phrase` in plain-text segments (outside tags / existing anchors).
 */
function linkPhraseOnce(html: string, phrase: string, href: string): { html: string; linked: boolean } {
  if (html.includes(`href="${href}"`)) {
    return { html, linked: false }
  }

  const parts = html.split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi)
  const re = new RegExp(`\\b(${escapeRegExp(phrase)})\\b`, 'i')
  let linked = false

  const out = parts.map((part) => {
    if (linked) return part
    if (!part || part.startsWith('<')) return part
    if (!re.test(part)) return part
    linked = true
    return part.replace(re, `<a href="${href}">$1</a>`)
  })

  return { html: out.join(''), linked }
}

async function topicIdsByCohort(cohort: string) {
  const { data, error } = await sb
    .from('fy_topics')
    .select('id, slug')
    .eq('cohort', cohort)
    .eq('is_active', true)
  if (error) throw error
  return data || []
}

async function main() {
  const generalTopics = await topicIdsByCohort('general')
  const fy1Topics = await topicIdsByCohort('fy1')
  const generalTopicIds = generalTopics.map((t) => t.id)
  const fy1TopicBySlug = Object.fromEntries(fy1Topics.map((t) => [t.slug, t.id]))
  const generalTopicById = Object.fromEntries(generalTopics.map((t) => [t.id, t.slug]))

  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, topic_id, slug, title, content, requires_auth')
    .in('topic_id', generalTopicIds)
    .eq('status', 'published')
    .eq('is_active', true)

  if (error) throw error

  let updated = 0
  let linksAdded = 0
  let urlsRewritten = 0

  for (const page of pages || []) {
    if (page.requires_auth) continue
    const topicSlug = generalTopicById[page.topic_id]
    if (!topicSlug) continue

    const original = page.content || ''
    let html = rewritePlacementsToGuides(original)
    if (html !== original) urlsRewritten += 1

    const specs = NEW_LINKS[page.slug] || []
    let addedHere = 0
    for (const spec of specs) {
      if (spec.slug === page.slug) continue
      const href = guideHref(spec.topic, spec.slug)
      const result = linkPhraseOnce(html, spec.phrase, href)
      if (result.linked) {
        html = result.html
        addedHere += 1
        linksAdded += 1
      }
      if (addedHere >= 3) break
    }

    if (html === original) {
      console.log(`= ${page.slug} (no change)`)
      continue
    }

    const { error: upErr } = await sb
      .from('fy_pages')
      .update({ content: html, updated_at: new Date().toISOString() })
      .eq('id', page.id)
    if (upErr) throw upErr
    updated += 1
    console.log(
      `✓ ${page.slug} (+${addedHere} links${html !== rewritePlacementsToGuides(original) || original.includes('/placements/foundation-year/general/') ? ', url rewrite' : ''})`
    )

    // Mirror onto fy1 copy when present (same slug + topic)
    const fy1TopicId = fy1TopicBySlug[topicSlug]
    if (fy1TopicId) {
      const { data: fy1Page } = await sb
        .from('fy_pages')
        .select('id')
        .eq('topic_id', fy1TopicId)
        .eq('slug', page.slug)
        .maybeSingle()
      if (fy1Page) {
        await sb
          .from('fy_pages')
          .update({ content: html, updated_at: new Date().toISOString() })
          .eq('id', fy1Page.id)
        console.log(`  ↳ mirrored fy1 copy`)
      }
    }
  }

  console.log(
    `\nDone. pagesUpdated=${updated} newLinks=${linksAdded} pagesWithUrlRewrite=${urlsRewritten}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
