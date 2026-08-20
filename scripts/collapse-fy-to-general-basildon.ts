/**
 * Collapse Foundation Year to two cohorts only:
 *   - general (public clinical + lifestyle guides)
 *   - basildon (members-only: induction + IV fluids + DNAR)
 *
 * Deactivates empty fy1/fy2 topics after moves.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/collapse-fy-to-general-basildon.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { publicGuidePath } from '@/lib/fy-blog-access'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type TopicDef = { slug: string; name: string; description: string; order: number }

const TOPIC_DEFS: Record<'general' | 'basildon', TopicDef[]> = {
  general: [
    {
      slug: 'getting-started',
      name: 'Getting started',
      description: 'Jobs, banking and first steps in the NHS',
      order: 1,
    },
    {
      slug: 'money-and-perks',
      name: 'Money & perks',
      description: 'Discounts, pensions and personal finance',
      order: 2,
    },
    {
      slug: 'team-and-support',
      name: 'Team & support',
      description: 'MDT roles, indemnity and working with others',
      order: 3,
    },
    {
      slug: 'everyday-tools',
      name: 'Everyday tools',
      description: 'Apps and practical admin for day-to-day work',
      order: 4,
    },
    {
      slug: 'prescribing',
      name: 'Prescribing',
      description: 'Safe ward prescribing for foundation doctors',
      order: 5,
    },
    {
      slug: 'on-calls',
      name: 'On-calls',
      description: 'Bleeps, night cover and reviewing patients',
      order: 6,
    },
    {
      slug: 'acute-assessments',
      name: 'Acute assessments',
      description: 'Falls, confusion and bedside assessments',
      order: 7,
    },
    {
      slug: 'core-investigations',
      name: 'Core investigations',
      description: 'ABG, ECG, AKI, cannulas and scans',
      order: 8,
    },
    {
      slug: 'exams-and-cpd',
      name: 'Exams & CPD',
      description: 'Exams, ALS and continuing professional development',
      order: 9,
    },
    {
      slug: 'audit-and-quality',
      name: 'Audit & quality',
      description: 'Clinical audit and quality improvement',
      order: 10,
    },
    {
      slug: 'career-next-steps',
      name: 'Career next steps',
      description: 'Planning the step beyond foundation training',
      order: 11,
    },
  ],
  basildon: [
    {
      slug: 'trust-induction',
      name: 'Trust induction',
      description: 'Members-only Basildon Hospital starter induction',
      order: 1,
    },
    {
      slug: 'local-systems',
      name: 'Local systems',
      description: 'Trust-specific systems and local clinical guidance',
      order: 2,
    },
  ],
}

/** Unique final placement: pageSlug -> cohort + topicSlug + members-only */
const PLACEMENT: Record<
  string,
  { cohort: 'general' | 'basildon'; topic: string; membersOnly?: boolean }
> = {
  // General
  'nhs-jobs-guide': { cohort: 'general', topic: 'getting-started' },
  'clinical-gap-job-application': { cohort: 'general', topic: 'getting-started' },
  'uk-bank-account-guide': { cohort: 'general', topic: 'getting-started' },
  'nhs-discharge-letter-guide': { cohort: 'general', topic: 'getting-started' },
  'all-nhs-discounts-list': { cohort: 'general', topic: 'money-and-perks' },
  'mcdonalds-nhs-discount': { cohort: 'general', topic: 'money-and-perks' },
  'financial-guide-uk-doctors': { cohort: 'general', topic: 'money-and-perks' },
  'nhs-pension-contributions': { cohort: 'general', topic: 'money-and-perks' },
  'nhs-staff-roles-mdt': { cohort: 'general', topic: 'team-and-support' },
  'medical-indemnity-insurance': { cohort: 'general', topic: 'team-and-support' },
  'free-medical-apps': { cohort: 'general', topic: 'everyday-tools' },
  'dvsa-theory-test': { cohort: 'general', topic: 'everyday-tools' },

  'fy1-potassium-prescribing-hypokalaemia': { cohort: 'general', topic: 'prescribing' },
  'fy1-anticoagulation-ward-basics': { cohort: 'general', topic: 'prescribing' },
  'vte-prophylaxis-guide': { cohort: 'general', topic: 'prescribing' },
  'what-are-on-call-shifts': { cohort: 'general', topic: 'on-calls' },
  'nhs-bleep-system': { cohort: 'general', topic: 'on-calls' },
  'fy1-review-patient-on-call': { cohort: 'general', topic: 'on-calls' },
  'fy1-new-oxygen-requirement': { cohort: 'general', topic: 'on-calls' },
  'fy1-approach-to-hypotension': { cohort: 'general', topic: 'on-calls' },
  'post-falls-assessment': {
    cohort: 'basildon',
    topic: 'local-systems',
    membersOnly: true,
  },
  'confusion-screen-bloods': { cohort: 'general', topic: 'acute-assessments' },
  'types-of-delusion': { cohort: 'general', topic: 'acute-assessments' },
  'bladder-scan-guide': { cohort: 'general', topic: 'acute-assessments' },
  'abg-made-easy': { cohort: 'general', topic: 'core-investigations' },
  'aki-stages-quick-guide': { cohort: 'general', topic: 'core-investigations' },
  'ecg-basics-guide': { cohort: 'general', topic: 'core-investigations' },
  'iv-cannula-guide': { cohort: 'general', topic: 'core-investigations' },
  'mrcp-1-pass-in-two-months': { cohort: 'general', topic: 'exams-and-cpd' },
  'cpd-courses-nhs': { cohort: 'general', topic: 'exams-and-cpd' },
  'als-courses-guide': { cohort: 'general', topic: 'exams-and-cpd' },
  'how-to-do-a-clinical-audit': { cohort: 'general', topic: 'audit-and-quality' },

  // Basildon-only (members)
  'trust-induction-basildon-hospital': {
    cohort: 'basildon',
    topic: 'trust-induction',
    membersOnly: true,
  },
  'fy1-iv-fluid-prescribing': {
    cohort: 'basildon',
    topic: 'local-systems',
    membersOnly: true,
  },
  'dnar-dnacpr-guide': {
    cohort: 'basildon',
    topic: 'local-systems',
    membersOnly: true,
  },
  'dnar-dnacpr-rules-for-doctors-fy-guide': {
    cohort: 'basildon',
    topic: 'local-systems',
    membersOnly: true,
  },
  'mdt-dates-basildon-hospital': {
    cohort: 'basildon',
    topic: 'local-systems',
    membersOnly: true,
  },
}

async function ensureTopics() {
  const topicIdByKey = new Map<string, string>()

  for (const [cohort, defs] of Object.entries(TOPIC_DEFS)) {
    for (const def of defs) {
      const { data: existing } = await sb
        .from('fy_topics')
        .select('id')
        .eq('cohort', cohort)
        .eq('slug', def.slug)
        .maybeSingle()

      if (existing?.id) {
        await sb
          .from('fy_topics')
          .update({
            name: def.name,
            description: def.description,
            display_order: def.order,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        topicIdByKey.set(`${cohort}:${def.slug}`, existing.id)
        console.log(`= topic ${cohort}/${def.slug}`)
      } else {
        const { data: created, error } = await sb
          .from('fy_topics')
          .insert({
            cohort,
            slug: def.slug,
            name: def.name,
            description: def.description,
            display_order: def.order,
            is_active: true,
          })
          .select('id')
          .single()
        if (error) throw error
        topicIdByKey.set(`${cohort}:${def.slug}`, created.id)
        console.log(`+ topic ${cohort}/${def.slug}`)
      }
    }
  }

  return topicIdByKey
}

function rewriteContentTopicLinks(html: string, slugToTopic: Map<string, string>): string {
  if (!html) return html
  return html.replace(
    /href=(["'])(\/guides\/foundation-year\/[^"']+)\1/gi,
    (full, quote: string, href: string) => {
      const m = href.match(/^\/guides\/foundation-year\/([^/]+)\/([^/]+)\/?$/i)
      if (!m) return full
      const pageSlug = m[2]
      const newTopic = slugToTopic.get(pageSlug)
      if (!newTopic) return full
      const next = publicGuidePath(newTopic, pageSlug)
      return `href=${quote}${next}${quote}`
    }
  )
}

async function main() {
  const topicIds = await ensureTopics()

  const { data: allTopics, error: tErr } = await sb
    .from('fy_topics')
    .select('id, cohort, slug, name')
  if (tErr) throw tErr
  const topicById = Object.fromEntries((allTopics || []).map((t) => [t.id, t]))

  const { data: pages, error: pErr } = await sb
    .from('fy_pages')
    .select('id, topic_id, slug, title, content, status, is_active, requires_auth')
  if (pErr) throw pErr

  const bySlug = new Map<string, NonNullable<typeof pages>>()
  for (const p of pages || []) {
    const list = bySlug.get(p.slug) || []
    list.push(p)
    bySlug.set(p.slug, list)
  }

  const slugToTopic = new Map<string, string>()
  for (const [slug, dest] of Object.entries(PLACEMENT)) {
    slugToTopic.set(slug, dest.topic)
  }

  // Deduplicate: keep preferred cohort copy
  for (const [slug, copies] of bySlug.entries()) {
    const dest = PLACEMENT[slug]
    if (!dest) {
      console.log(`! unmapped slug kept as-is: ${slug}`)
      continue
    }

    const ranked = [...copies].sort((a, b) => {
      const ca = topicById[a.topic_id]?.cohort
      const cb = topicById[b.topic_id]?.cohort
      const score = (c?: string) => (c === dest.cohort ? 0 : c === 'general' ? 1 : 2)
      return score(ca) - score(cb)
    })
    const keep = ranked[0]
    for (const extra of ranked.slice(1)) {
      const { error } = await sb.from('fy_pages').delete().eq('id', extra.id)
      if (error) throw error
      console.log(`× deleted duplicate ${slug} from ${topicById[extra.topic_id]?.cohort}`)
    }
    bySlug.set(slug, [keep])
  }

  for (const [slug, copies] of bySlug.entries()) {
    const dest = PLACEMENT[slug]
    if (!dest) continue
    const page = copies[0]
    if (!page) continue

    const destTopicId = topicIds.get(`${dest.cohort}:${dest.topic}`)
    if (!destTopicId) throw new Error(`Missing topic ${dest.cohort}/${dest.topic}`)

    const nextContent = rewriteContentTopicLinks(page.content || '', slugToTopic)
    const membersOnly = !!dest.membersOnly
    const needsMove = page.topic_id !== destTopicId
    const needsContent = nextContent !== (page.content || '')
    const needsAuth = page.requires_auth !== membersOnly

    if (!needsMove && !needsContent && !needsAuth) {
      console.log(`= ${slug} already at ${dest.cohort}/${dest.topic} auth=${membersOnly}`)
      continue
    }

    const { error } = await sb
      .from('fy_pages')
      .update({
        topic_id: destTopicId,
        content: nextContent,
        requires_auth: membersOnly,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
    if (error) throw error
    console.log(
      `→ ${slug} => ${dest.cohort}/${dest.topic} membersOnly=${membersOnly}${
        needsContent ? ' (links updated)' : ''
      }`
    )
  }

  // Deactivate fy1/fy2 topics (and any other empty non-kept topics)
  const keepTopicIds = new Set(topicIds.values())
  for (const t of allTopics || []) {
    if (keepTopicIds.has(t.id)) continue
    const { count } = await sb
      .from('fy_pages')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', t.id)
    if ((count || 0) > 0) {
      console.log(`! kept legacy topic with pages: ${t.cohort}/${t.slug} (${count})`)
      continue
    }
    await sb
      .from('fy_topics')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', t.id)
    console.log(`⊘ deactivated empty topic ${t.cohort}/${t.slug}`)
  }

  console.log('\nDone. Cohorts collapsed to general + basildon.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
