/**
 * Reorganize Foundation Year cohorts/topics and place each post uniquely.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/reorganize-fy-sections.ts
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

const TOPIC_DEFS: Record<string, TopicDef[]> = {
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
      description: 'Trust-specific systems and local guidance',
      order: 2,
    },
  ],
  fy1: [
    {
      slug: 'prescribing',
      name: 'Prescribing',
      description: 'Safe FY1 prescribing on the wards',
      order: 1,
    },
    {
      slug: 'on-calls',
      name: 'On-calls',
      description: 'Bleeps, night cover and reviewing patients',
      order: 2,
    },
    {
      slug: 'acute-assessments',
      name: 'Acute assessments',
      description: 'Falls, confusion, DNACPR and bedside assessments',
      order: 3,
    },
    {
      slug: 'core-investigations',
      name: 'Core investigations',
      description: 'ABG, ECG, AKI, cannulas and scans',
      order: 4,
    },
  ],
  fy2: [
    {
      slug: 'exams-and-cpd',
      name: 'Exams & CPD',
      description: 'Exams, ALS and continuing professional development',
      order: 1,
    },
    {
      slug: 'audit-and-quality',
      name: 'Audit & quality',
      description: 'Clinical audit and quality improvement',
      order: 2,
    },
    {
      slug: 'career-next-steps',
      name: 'Career next steps',
      description: 'Planning the step beyond FY2',
      order: 3,
    },
  ],
}

/** Unique final placement: pageSlug -> cohort + topicSlug */
const PLACEMENT: Record<string, { cohort: string; topic: string }> = {
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

  // Basildon-only (members)
  'trust-induction-basildon-hospital': { cohort: 'basildon', topic: 'trust-induction' },

  // FY1
  'fy1-potassium-prescribing-hypokalaemia': { cohort: 'fy1', topic: 'prescribing' },
  'fy1-anticoagulation-ward-basics': { cohort: 'fy1', topic: 'prescribing' },
  'fy1-iv-fluid-prescribing': { cohort: 'fy1', topic: 'prescribing' },
  'vte-prophylaxis-guide': { cohort: 'fy1', topic: 'prescribing' },
  'what-are-on-call-shifts': { cohort: 'fy1', topic: 'on-calls' },
  'nhs-bleep-system': { cohort: 'fy1', topic: 'on-calls' },
  'fy1-review-patient-on-call': { cohort: 'fy1', topic: 'on-calls' },
  'fy1-new-oxygen-requirement': { cohort: 'fy1', topic: 'on-calls' },
  'post-falls-assessment': { cohort: 'fy1', topic: 'acute-assessments' },
  'confusion-screen-bloods': { cohort: 'fy1', topic: 'acute-assessments' },
  'types-of-delusion': { cohort: 'fy1', topic: 'acute-assessments' },
  'dnar-dnacpr-guide': { cohort: 'fy1', topic: 'acute-assessments' },
  'bladder-scan-guide': { cohort: 'fy1', topic: 'acute-assessments' },
  'abg-made-easy': { cohort: 'fy1', topic: 'core-investigations' },
  'aki-stages-quick-guide': { cohort: 'fy1', topic: 'core-investigations' },
  'ecg-basics-guide': { cohort: 'fy1', topic: 'core-investigations' },
  'iv-cannula-guide': { cohort: 'fy1', topic: 'core-investigations' },

  // FY2
  'mrcp-1-pass-in-two-months': { cohort: 'fy2', topic: 'exams-and-cpd' },
  'cpd-courses-nhs': { cohort: 'fy2', topic: 'exams-and-cpd' },
  'als-courses-guide': { cohort: 'fy2', topic: 'exams-and-cpd' },
  'how-to-do-a-clinical-audit': { cohort: 'fy2', topic: 'audit-and-quality' },
}

/** Redundant copies to remove (keep the placement map target). */
const DELETE_SLUGS = new Set(['nhs-discounts-offers'])

/** Basildon hub section is stored under fy1 until DB allows cohort='basildon'. */
function storageCohortFor(cohort: string) {
  return cohort === 'basildon' ? 'fy1' : cohort
}

async function ensureTopics() {
  const topicIdByKey = new Map<string, string>() // presentational cohort:slug -> id

  for (const [cohort, defs] of Object.entries(TOPIC_DEFS)) {
    const storageCohort = storageCohortFor(cohort)
    for (const def of defs) {
      const { data: existing } = await sb
        .from('fy_topics')
        .select('id')
        .eq('cohort', storageCohort)
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
        console.log(`= topic ${cohort}/${def.slug} (storage ${storageCohort})`)
      } else {
        const { data: created, error } = await sb
          .from('fy_topics')
          .insert({
            cohort: storageCohort,
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
        console.log(`+ topic ${cohort}/${def.slug} (storage ${storageCohort})`)
      }
    }
  }

  return topicIdByKey
}

function rewriteContentTopicLinks(
  html: string,
  slugToTopic: Map<string, string>
): string {
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
  console.log(
    'Note: Basildon-Only is a hub section stored under FY1 topics (trust-induction / local-systems) until migrations/add-fy-basildon-cohort.sql is applied.'
  )
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

  // Group pages by slug
  const bySlug = new Map<string, typeof pages>()
  for (const p of pages || []) {
    const list = bySlug.get(p.slug) || []
    list.push(p)
    bySlug.set(p.slug, list)
  }

  const slugToTopic = new Map<string, string>()
  for (const [slug, dest] of Object.entries(PLACEMENT)) {
    slugToTopic.set(slug, dest.topic)
  }

  // Delete redundant / extra duplicates
  for (const [slug, copies] of bySlug.entries()) {
    if (DELETE_SLUGS.has(slug)) {
      for (const copy of copies) {
        const { error } = await sb.from('fy_pages').delete().eq('id', copy.id)
        if (error) throw error
        console.log(`× deleted redundant ${slug} (${topicById[copy.topic_id]?.cohort})`)
      }
      bySlug.delete(slug)
      continue
    }

    const dest = PLACEMENT[slug]
    if (!dest) {
      console.log(`! unmapped slug kept as-is: ${slug}`)
      continue
    }

    // Prefer keeping a copy already on the destination cohort; else keep general; else first
    const ranked = [...copies].sort((a, b) => {
      const ca = topicById[a.topic_id]?.cohort
      const cb = topicById[b.topic_id]?.cohort
      const score = (c?: string) =>
        c === dest.cohort ? 0 : c === 'general' ? 1 : 2
      return score(ca) - score(cb)
    })
    const keep = ranked[0]
    for (const extra of ranked.slice(1)) {
      const { error } = await sb.from('fy_pages').delete().eq('id', extra.id)
      if (error) throw error
      console.log(
        `× deleted duplicate ${slug} from ${topicById[extra.topic_id]?.cohort}`
      )
    }
    bySlug.set(slug, [keep])
  }

  // Move keepers to destination topics + rewrite internal guide links
  for (const [slug, copies] of bySlug.entries()) {
    const dest = PLACEMENT[slug]
    if (!dest) continue
    const page = copies[0]
    if (!page) continue

    const destTopicId = topicIds.get(`${dest.cohort}:${dest.topic}`)
    if (!destTopicId) throw new Error(`Missing topic ${dest.cohort}/${dest.topic}`)

    const nextContent = rewriteContentTopicLinks(page.content || '', slugToTopic)
    const needsMove = page.topic_id !== destTopicId
    const needsContent = nextContent !== (page.content || '')

    if (!needsMove && !needsContent) {
      console.log(`= ${slug} already at ${dest.cohort}/${dest.topic}`)
      continue
    }

    const { error } = await sb
      .from('fy_pages')
      .update({
        topic_id: destTopicId,
        content: nextContent,
        updated_at: new Date().toISOString(),
        ...(dest.cohort === 'basildon' || slug === 'fy1-iv-fluid-prescribing'
          ? { requires_auth: true }
          : {}),
      })
      .eq('id', page.id)
    if (error) throw error
    console.log(
      `→ ${slug} => ${dest.cohort}/${dest.topic}${needsContent ? ' (links updated)' : ''}`
    )
  }

  // Deactivate legacy topics that are not in the new defs
  const keepTopicIds = new Set(topicIds.values())
  for (const t of allTopics || []) {
    if (keepTopicIds.has(t.id)) continue
    // Only deactivate if empty
    const { count } = await sb
      .from('fy_pages')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', t.id)
    if ((count || 0) > 0) {
      console.log(`! kept legacy topic with pages: ${t.cohort}/${t.slug}`)
      continue
    }
    await sb
      .from('fy_topics')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', t.id)
    console.log(`⊘ deactivated empty topic ${t.cohort}/${t.slug}`)
  }

  console.log('\nDone. Foundation Year sections reorganized with unique post placement.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
