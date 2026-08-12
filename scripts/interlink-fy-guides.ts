/**
 * SEO interlinking for Foundation Year guides.
 *
 * 1) Rewrite login-walled /placements/foundation-year/general/... links → /guides/...
 * 2) Add a small number of highly relevant in-content links (max ~2–3/page)
 * 3) Strip public /guides links that point at members-only posts
 * 4) Also interlink members-only Basildon posts with /placements/... URLs
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/interlink-fy-guides.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { FY_MEMBERS_ONLY_SLUGS } from '../lib/fy-blog-access'

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
    { phrase: 'ECG abnormalities', topic: 'core-investigations', slug: 'ecg-basics-guide' },
    { phrase: 'renal function', topic: 'core-investigations', slug: 'aki-stages-quick-guide' },
  ],
  'fy1-anticoagulation-ward-basics': [
    { phrase: 'VTE prophylaxis', topic: 'prescribing', slug: 'vte-prophylaxis-guide' },
  ],
  'fy1-new-oxygen-requirement': [
    { phrase: 'blood gas', topic: 'core-investigations', slug: 'abg-made-easy' },
    { phrase: 'ABCDE', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'hypotension', topic: 'on-calls', slug: 'fy1-approach-to-hypotension' },
  ],
  'fy1-review-patient-on-call': [
    { phrase: 'on-call', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
    { phrase: 'bleep', topic: 'on-calls', slug: 'nhs-bleep-system' },
    { phrase: 'oxygen', topic: 'on-calls', slug: 'fy1-new-oxygen-requirement' },
    { phrase: 'GCS', topic: 'on-calls', slug: 'fy-reduced-gcs-approach' },
  ],
  'fy1-approach-to-hypotension': [
    { phrase: 'ABCDE', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'blood gas', topic: 'core-investigations', slug: 'abg-made-easy' },
    { phrase: 'oxygen', topic: 'on-calls', slug: 'fy1-new-oxygen-requirement' },
  ],
  'fy-reduced-gcs-approach': [
    { phrase: 'ABCDE', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'blood gas', topic: 'core-investigations', slug: 'abg-made-easy' },
    { phrase: 'confusion', topic: 'acute-assessments', slug: 'confusion-screen-bloods' },
  ],
  'hyponatraemia-foundation-doctors': [
    { phrase: 'reduced GCS', topic: 'on-calls', slug: 'fy-reduced-gcs-approach' },
    { phrase: 'ABCDE', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'renal', topic: 'core-investigations', slug: 'aki-stages-quick-guide' },
  ],
  'abg-made-easy': [
    { phrase: 'oxygen', topic: 'on-calls', slug: 'fy1-new-oxygen-requirement' },
    { phrase: 'Renal failure', topic: 'core-investigations', slug: 'aki-stages-quick-guide' },
    { phrase: 'hypotension', topic: 'on-calls', slug: 'fy1-approach-to-hypotension' },
  ],
  'aki-stages-quick-guide': [
    { phrase: 'potassium', topic: 'prescribing', slug: 'fy1-potassium-prescribing-hypokalaemia' },
    { phrase: 'hypotension', topic: 'on-calls', slug: 'fy1-approach-to-hypotension' },
  ],
  'ecg-basics-guide': [
    { phrase: 'potassium', topic: 'prescribing', slug: 'fy1-potassium-prescribing-hypokalaemia' },
  ],
  'vte-prophylaxis-guide': [
    { phrase: 'anticoagulation', topic: 'prescribing', slug: 'fy1-anticoagulation-ward-basics' },
  ],
  'confusion-screen-bloods': [
    { phrase: 'junior doctor', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'GCS', topic: 'on-calls', slug: 'fy-reduced-gcs-approach' },
    { phrase: 'sodium', topic: 'core-investigations', slug: 'hyponatraemia-foundation-doctors' },
  ],
  'bladder-scan-guide': [
    { phrase: 'on calls', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'iv-cannula-guide': [
    { phrase: 'starting your career in the NHS', topic: 'getting-started', slug: 'nhs-jobs-guide' },
  ],
  'post-falls-assessment': [
    { phrase: 'GCS', topic: 'on-calls', slug: 'fy-reduced-gcs-approach' },
    { phrase: 'hypotension', topic: 'on-calls', slug: 'fy1-approach-to-hypotension' },
    { phrase: 'ABCDE', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
  ],
  'dnar-dnacpr-guide': [
    { phrase: 'on-calls', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'fy1-iv-fluid-prescribing': [
    { phrase: 'hypotension', topic: 'on-calls', slug: 'fy1-approach-to-hypotension' },
    { phrase: 'AKI', topic: 'core-investigations', slug: 'aki-stages-quick-guide' },
  ],
  'nhs-bleep-system': [
    { phrase: 'patient reviews', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'on-call', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'what-are-on-call-shifts': [
    { phrase: 'Clerking', topic: 'on-calls', slug: 'fy1-review-patient-on-call' },
    { phrase: 'bleep', topic: 'on-calls', slug: 'nhs-bleep-system' },
  ],

  // General / soft relevant pairs only
  'all-nhs-discounts-list': [
    { phrase: 'McDonald', topic: 'money-and-perks', slug: 'mcdonalds-nhs-discount' },
  ],
  'mcdonalds-nhs-discount': [
    { phrase: 'NHS discounts', topic: 'money-and-perks', slug: 'all-nhs-discounts-list' },
  ],
  'financial-guide-uk-doctors': [
    { phrase: 'pension', topic: 'money-and-perks', slug: 'nhs-pension-contributions' },
    { phrase: 'savings account', topic: 'getting-started', slug: 'uk-bank-account-guide' },
  ],
  'nhs-pension-contributions': [
    { phrase: 'financial', topic: 'money-and-perks', slug: 'financial-guide-uk-doctors' },
  ],
  'uk-bank-account-guide': [
    { phrase: 'financial', topic: 'money-and-perks', slug: 'financial-guide-uk-doctors' },
  ],
  'nhs-jobs-guide': [
    { phrase: 'CPD courses', topic: 'exams-and-cpd', slug: 'cpd-courses-nhs' },
  ],
  'als-courses-guide': [
    { phrase: 'NHS jobs', topic: 'getting-started', slug: 'nhs-jobs-guide' },
  ],
  'cpd-courses-nhs': [
    { phrase: 'NHS jobs', topic: 'getting-started', slug: 'nhs-jobs-guide' },
    { phrase: 'clinical audit', topic: 'audit-and-quality', slug: 'how-to-do-a-clinical-audit' },
  ],
  'how-to-do-a-clinical-audit': [
    { phrase: 'CPD', topic: 'exams-and-cpd', slug: 'cpd-courses-nhs' },
  ],
  'clinical-gap-job-application': [
    { phrase: 'NHS jobs', topic: 'getting-started', slug: 'nhs-jobs-guide' },
  ],
  'medical-indemnity-insurance': [
    {
      phrase: 'starting your career as a Doctor in the NHS',
      topic: 'getting-started',
      slug: 'nhs-jobs-guide',
    },
  ],
  'nhs-staff-roles-mdt': [
    { phrase: 'On-call doctors', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'nhs-discharge-letter-guide': [
    { phrase: 'on-call', topic: 'on-calls', slug: 'what-are-on-call-shifts' },
  ],
  'free-medical-apps': [
    { phrase: 'NHS Discounts List', topic: 'money-and-perks', slug: 'all-nhs-discounts-list' },
    { phrase: 'bleeps', topic: 'on-calls', slug: 'nhs-bleep-system' },
  ],
  'mrcp-1-pass-in-two-months': [
    { phrase: 'CPD', topic: 'exams-and-cpd', slug: 'cpd-courses-nhs' },
  ],
}

function guideHref(topic: string, slug: string) {
  return `/guides/foundation-year/${topic}/${slug}`
}

function placementHref(cohort: string, topic: string, slug: string) {
  return `/placements/foundation-year/${cohort}/${topic}/${slug}`
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Unwrap public guide links that point at members-only posts. */
function stripMembersOnlyPublicLinks(html: string): string {
  let out = html
  for (const slug of FY_MEMBERS_ONLY_SLUGS) {
    const re = new RegExp(
      `<a\\b([^>]*?)href=(["'])(\\/guides\\/foundation-year\\/[^"']*\\/${escapeRegExp(slug)})\\2([^>]*)>([\\s\\S]*?)<\\/a>`,
      'gi'
    )
    out = out.replace(re, '$5')
  }
  return out
}

/** Rewrite placements/general FY article links to public /guides/ URLs */
function rewritePlacementsToGuides(html: string): string {
  return html.replace(
    /href="\/placements\/foundation-year\/general\/([^"/]+)\/([^"/]+)(\/?)([^"]*)"/g,
    (_m, topic: string, slug: string, _slash: string, rest: string) => {
      if (rest && rest.length > 0) {
        return `href="/placements/foundation-year/general/${topic}/${slug}${_slash}${rest}"`
      }
      if (FY_MEMBERS_ONLY_SLUGS.has(slug)) {
        return `href="/placements/foundation-year/general/${topic}/${slug}"`
      }
      return `href="${guideHref(topic, slug)}"`
    }
  )
}

/** Prefer body copy: skip the first short lead paragraph when a later match exists. */
function firstParagraphEnd(html: string): number {
  const m = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)
  if (!m || m.index == null) return 0
  return m.index + m[0].length
}

/**
 * Wrap an occurrence of `phrase` in plain-text segments (outside tags / existing anchors).
 * Prefers a match after the first paragraph when available.
 */
function linkPhraseOnce(
  html: string,
  phrase: string,
  href: string
): { html: string; linked: boolean } {
  const already = html.includes(`href="${href}"`)
  if (already) {
    return { html, linked: false }
  }

  const parts = html.split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi)
  const re = new RegExp(`\\b(${escapeRegExp(phrase)})\\b`, 'i')
  const skipUntil = firstParagraphEnd(html)

  for (const preferBody of [true, false]) {
    let charPos = 0
    let linked = false
    const out = parts.map((part) => {
      const start = charPos
      charPos += part.length
      if (linked) return part
      if (!part || part.startsWith('<')) return part
      if (preferBody && start < skipUntil) return part
      if (!re.test(part)) return part
      linked = true
      return part.replace(re, `<a href="${href}" class="fy-inline-link">$1</a>`)
    })
    if (linked) return { html: out.join(''), linked: true }
  }

  return { html, linked: false }
}

/** Ensure internal FY anchors use the visible link class. */
function tagInternalGuideLinks(html: string): string {
  return html.replace(
    /<a(\s+[^>]*?)href="(\/(?:guides|placements)\/foundation-year\/[^"]+)"([^>]*)>/gi,
    (_m, before: string, href: string, after: string) => {
      const attrs = `${before} href="${href}"${after}`
      if (/\bclass\s*=/.test(attrs)) {
        if (/\bfy-inline-link\b/.test(attrs)) {
          return `<a${attrs}>`
        }
        return `<a${attrs.replace(
          /\bclass=(["'])([^"']*)\1/,
          (_cm, q: string, cls: string) => `class=${q}${cls} fy-inline-link${q}`
        )}>`
      }
      return `<a href="${href}" class="fy-inline-link"${after}>`
    }
  )
}

/**
 * If the only link to href wraps `phrase` in the lead paragraph, unwrap it and
 * re-link a later body occurrence so readers actually see the interlink.
 */
function moveLeadLinkIntoBody(html: string, phrase: string, href: string): string {
  const leadEnd = firstParagraphEnd(html)
  if (!leadEnd) return html
  const lead = html.slice(0, leadEnd)
  const body = html.slice(leadEnd)
  const wrapRe = new RegExp(
    `<a\\b[^>]*href="${escapeRegExp(href)}"[^>]*>\\s*(${escapeRegExp(phrase)})\\s*<\\/a>`,
    'i'
  )
  if (!wrapRe.test(lead)) return html
  if (body.includes(`href="${href}"`)) return html

  const unwrappedLead = lead.replace(wrapRe, '$1')
  const parts = body.split(/(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>)/gi)
  const re = new RegExp(`\\b(${escapeRegExp(phrase)})\\b`, 'i')
  let linked = false
  const linkedBody = parts
    .map((part) => {
      if (linked || !part || part.startsWith('<') || !re.test(part)) return part
      linked = true
      return part.replace(re, `<a href="${href}" class="fy-inline-link">$1</a>`)
    })
    .join('')

  return linked ? unwrappedLead + linkedBody : html
}

async function topicIdsByCohort(cohort: string) {
  const { data, error } = await sb
    .from('fy_topics')
    .select('id, slug, cohort')
    .eq('cohort', cohort)
    .eq('is_active', true)
  if (error) throw error
  return data || []
}

async function main() {
  const topics = [
    ...(await topicIdsByCohort('general')),
    ...(await topicIdsByCohort('basildon')),
    ...(await topicIdsByCohort('fy1')),
    ...(await topicIdsByCohort('fy2')),
  ]

  const topicIds = topics.map((t) => t.id)
  const topicMetaById = Object.fromEntries(
    topics.map((t) => [t.id, { slug: t.slug, cohort: t.cohort }])
  )

  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, topic_id, slug, title, content, requires_auth')
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .eq('is_active', true)

  if (error) throw error

  const locationBySlug = new Map<
    string,
    { cohort: string; topic: string; membersOnly: boolean }
  >()
  for (const page of pages || []) {
    const meta = topicMetaById[page.topic_id]
    if (!meta) continue
    locationBySlug.set(page.slug, {
      cohort: meta.cohort,
      topic: meta.slug,
      membersOnly:
        page.requires_auth === true || FY_MEMBERS_ONLY_SLUGS.has(page.slug),
    })
  }

  let updated = 0
  let linksAdded = 0
  let urlsRewritten = 0
  let membersLinksStripped = 0

  for (const page of pages || []) {
    const meta = topicMetaById[page.topic_id]
    if (!meta) continue

    const membersOnly =
      page.requires_auth === true || FY_MEMBERS_ONLY_SLUGS.has(page.slug)
    const original = page.content || ''
    let html = rewritePlacementsToGuides(original)
    if (html !== original) urlsRewritten += 1

    const beforeStrip = html
    html = stripMembersOnlyPublicLinks(html)
    if (html !== beforeStrip) membersLinksStripped += 1

    const specs = NEW_LINKS[page.slug] || []
    let addedHere = 0
    for (const spec of specs) {
      if (spec.slug === page.slug) continue
      const target = locationBySlug.get(spec.slug)
      if (!target) continue

      // Public pages must not deep-link into members-only guides via /guides.
      if (!membersOnly && target.membersOnly) continue

      const publicHref = membersOnly
        ? placementHref(
            target.cohort === 'basildon' ? 'basildon' : 'general',
            target.topic,
            spec.slug
          )
        : guideHref(target.topic, spec.slug)

      const beforeMove = html
      html = moveLeadLinkIntoBody(html, spec.phrase, publicHref)
      if (html !== beforeMove) {
        addedHere += 1
        linksAdded += 1
      }
      const result = linkPhraseOnce(html, spec.phrase, publicHref)
      if (result.linked) {
        html = result.html
        addedHere += 1
        linksAdded += 1
      }
      if (addedHere >= 3) break
    }

    html = tagInternalGuideLinks(html)

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
    console.log(`✓ ${meta.cohort}/${meta.slug}/${page.slug} (+${addedHere} links)`)
  }

  console.log(
    `\nDone. pagesUpdated=${updated} newLinks=${linksAdded} pagesWithUrlRewrite=${urlsRewritten} membersLinksStripped=${membersLinksStripped}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
