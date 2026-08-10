/**
 * Server helpers for the public Foundation Year guides surface.
 * Public pages may live in general / fy1 / fy2 (not basildon / members-only).
 */
import { supabaseAdmin } from '@/utils/supabase'
import { FY_MEMBERS_ONLY_SLUGS, isMembersOnlyFyPage } from '@/lib/fy-blog-access'
import { PUBLIC_FY_COHORTS } from '@/lib/foundation-year'

export const PUBLIC_FY_COHORT = 'general' as const

export type PublicFyTopic = {
  id: string
  name: string
  slug: string
  description?: string | null
  display_order?: number | null
  is_active?: boolean | null
  cohort?: string | null
}

export type PublicFyPage = {
  id: string
  topic_id: string
  title: string
  slug: string
  content?: string | null
  featured_image?: string | null
  meta_description?: string | null
  status?: string | null
  is_active?: boolean | null
  requires_auth?: boolean | null
  display_order?: number | null
  updated_at?: string | null
  created_at?: string | null
  topic?: PublicFyTopic | null
}

const FY_PAGE_SELECT =
  'id, topic_id, title, slug, content, featured_image, status, is_active, requires_auth, display_order, updated_at, created_at'

function isPublicRow(page: {
  slug?: string | null
  requires_auth?: boolean | null
  status?: string | null
  is_active?: boolean | null
}) {
  if (page.is_active === false) return false
  if (page.status !== 'published') return false
  if (isMembersOnlyFyPage(page)) return false
  return true
}

async function publicTopicsRaw(): Promise<PublicFyTopic[]> {
  const { data, error } = await supabaseAdmin
    .from('fy_topics')
    .select('id, name, slug, description, display_order, is_active, cohort')
    .in('cohort', [...PUBLIC_FY_COHORTS])
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data || []) as PublicFyTopic[]
}

/** Topics that currently have at least one public page (deduped by slug). */
export async function listPublicFyTopics(): Promise<PublicFyTopic[]> {
  const topics = await publicTopicsRaw()
  const byId = new Map(topics.map((t) => [t.id, t]))
  const topicIds = topics.map((t) => t.id)
  if (!topicIds.length) return []

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select('topic_id, slug, requires_auth, status, is_active')
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .eq('is_active', true)
  if (error) throw error

  const publicTopicIds = new Set<string>()
  for (const p of data || []) {
    if (!isPublicRow(p)) continue
    publicTopicIds.add(p.topic_id)
  }

  const bySlug = new Map<string, PublicFyTopic>()
  for (const t of topics) {
    if (!publicTopicIds.has(t.id)) continue
    const existing = bySlug.get(t.slug)
    if (!existing) {
      bySlug.set(t.slug, t)
      continue
    }
    // Prefer general cohort when the same topic slug exists in multiple cohorts
    if (t.cohort === PUBLIC_FY_COHORT && existing.cohort !== PUBLIC_FY_COHORT) {
      bySlug.set(t.slug, t)
    }
  }

  return [...bySlug.values()].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  )
}

export async function getPublicFyTopicBySlug(
  topicSlug: string
): Promise<PublicFyTopic | null> {
  const topics = await listPublicFyTopics()
  return topics.find((t) => t.slug === topicSlug) || null
}

export async function listPublicFyPagesForTopic(
  topicId: string
): Promise<PublicFyPage[]> {
  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(FY_PAGE_SELECT)
    .eq('topic_id', topicId)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return ((data || []) as PublicFyPage[]).filter(isPublicRow)
}

/**
 * List public pages for a topic slug across public cohorts
 * (handles topics that only exist under fy1/fy2 after reorg).
 */
export async function listPublicFyPagesForTopicSlug(
  topicSlug: string
): Promise<Array<PublicFyPage & { topic_slug: string; topic_name: string }>> {
  const { data: topics, error: tErr } = await supabaseAdmin
    .from('fy_topics')
    .select('id, name, slug, cohort')
    .in('cohort', [...PUBLIC_FY_COHORTS])
    .eq('slug', topicSlug)
    .eq('is_active', true)
  if (tErr) throw tErr
  const topicRows = topics || []
  if (!topicRows.length) return []

  const byId = new Map(topicRows.map((t) => [t.id, t]))
  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(FY_PAGE_SELECT)
    .in(
      'topic_id',
      topicRows.map((t) => t.id)
    )
    .eq('status', 'published')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error

  const seen = new Set<string>()
  const out: Array<PublicFyPage & { topic_slug: string; topic_name: string }> = []
  for (const p of (data || []) as PublicFyPage[]) {
    if (!isPublicRow(p) || seen.has(p.slug)) continue
    seen.add(p.slug)
    const topic = byId.get(p.topic_id)
    out.push({
      ...p,
      topic_slug: topic?.slug || topicSlug,
      topic_name: topic?.name || topicSlug,
    })
  }
  return out
}

export async function listAllPublicFyPages(): Promise<
  Array<PublicFyPage & { topic_slug: string; topic_name: string }>
> {
  const topics = await publicTopicsRaw()
  const byId = new Map(topics.map((t) => [t.id, t]))
  const topicIds = topics.map((t) => t.id)
  if (!topicIds.length) return []

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(FY_PAGE_SELECT)
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
  if (error) throw error

  const seen = new Set<string>()
  return ((data || []) as PublicFyPage[])
    .filter(isPublicRow)
    .map((p) => {
      const topic = byId.get(p.topic_id)
      return {
        ...p,
        topic_slug: topic?.slug || '',
        topic_name: topic?.name || '',
      }
    })
    .filter((p) => {
      if (!p.topic_slug || seen.has(p.slug)) return false
      seen.add(p.slug)
      return true
    })
}

export async function getPublicFyPage(
  topicSlug: string,
  pageSlug: string
): Promise<(PublicFyPage & { topic: PublicFyTopic; canonicalTopicSlug: string }) | null> {
  if (FY_MEMBERS_ONLY_SLUGS.has(pageSlug)) return null

  const { data: topics, error: tErr } = await supabaseAdmin
    .from('fy_topics')
    .select('id, name, slug, description, display_order, is_active, cohort')
    .in('cohort', [...PUBLIC_FY_COHORTS])
    .eq('is_active', true)
  if (tErr) throw tErr

  const topicRows = (topics || []) as PublicFyTopic[]
  const topicIds = topicRows.map((t) => t.id)
  if (!topicIds.length) return null

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(FY_PAGE_SELECT)
    .in('topic_id', topicIds)
    .eq('slug', pageSlug)
    .eq('status', 'published')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!data || !isPublicRow(data)) return null

  const topic = topicRows.find((t) => t.id === data.topic_id)
  if (!topic) return null

  return {
    ...(data as PublicFyPage),
    topic,
    canonicalTopicSlug: topic.slug,
  }
}

/** Allow logged-out image view for public FY assets (not basildon / members-only). */
export async function canViewFyImageWithoutAuth(filePath: string): Promise<boolean> {
  if (!filePath || filePath.includes('..')) return false
  if (!filePath.startsWith('foundation-year/')) return false

  const parts = filePath.split('/')
  // foundation-year / cohort / topicSlug / pageSlug / images / file
  if (parts.length < 5) return false
  const cohort = parts[1]
  const pageSlug = parts[3]
  if (!pageSlug || FY_MEMBERS_ONLY_SLUGS.has(pageSlug)) return false
  if (!(PUBLIC_FY_COHORTS as readonly string[]).includes(cohort)) return false

  const { data: topics, error: tErr } = await supabaseAdmin
    .from('fy_topics')
    .select('id')
    .eq('cohort', cohort)
    .eq('is_active', true)
  if (tErr || !topics?.length) return false

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select('id, slug, requires_auth, status, is_active')
    .eq('slug', pageSlug)
    .in(
      'topic_id',
      topics.map((t) => t.id)
    )
    .limit(1)
    .maybeSingle()

  if (error || !data) return false
  return isPublicRow(data)
}
