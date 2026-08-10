/**
 * Server helpers for the public Foundation Year guides surface (general cohort only).
 */
import { supabaseAdmin } from '@/utils/supabase'
import { FY_MEMBERS_ONLY_SLUGS, isMembersOnlyFyPage } from '@/lib/fy-blog-access'

export const PUBLIC_FY_COHORT = 'general' as const

export type PublicFyTopic = {
  id: string
  name: string
  slug: string
  description?: string | null
  display_order?: number | null
  is_active?: boolean | null
}

export type PublicFyPage = {
  id: string
  topic_id: string
  title: string
  slug: string
  content?: string | null
  featured_image?: string | null
  status?: string | null
  is_active?: boolean | null
  requires_auth?: boolean | null
  display_order?: number | null
  updated_at?: string | null
  created_at?: string | null
  topic?: PublicFyTopic | null
}

async function generalTopicIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('fy_topics')
    .select('id')
    .eq('cohort', PUBLIC_FY_COHORT)
    .eq('is_active', true)
  if (error) throw error
  return (data || []).map((t) => t.id)
}

export async function listPublicFyTopics(): Promise<PublicFyTopic[]> {
  const { data, error } = await supabaseAdmin
    .from('fy_topics')
    .select('id, name, slug, description, display_order, is_active')
    .eq('cohort', PUBLIC_FY_COHORT)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data || []) as PublicFyTopic[]
}

export async function getPublicFyTopicBySlug(
  topicSlug: string
): Promise<PublicFyTopic | null> {
  const { data, error } = await supabaseAdmin
    .from('fy_topics')
    .select('id, name, slug, description, display_order, is_active')
    .eq('cohort', PUBLIC_FY_COHORT)
    .eq('slug', topicSlug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return (data as PublicFyTopic) || null
}

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

export async function listPublicFyPagesForTopic(
  topicId: string
): Promise<PublicFyPage[]> {
  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(
      'id, topic_id, title, slug, content, featured_image, status, is_active, requires_auth, display_order, updated_at, created_at'
    )
    .eq('topic_id', topicId)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return ((data || []) as PublicFyPage[]).filter(isPublicRow)
}

export async function listAllPublicFyPages(): Promise<
  Array<PublicFyPage & { topic_slug: string; topic_name: string }>
> {
  const topics = await listPublicFyTopics()
  const byId = new Map(topics.map((t) => [t.id, t]))
  const topicIds = topics.map((t) => t.id)
  if (!topicIds.length) return []

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(
      'id, topic_id, title, slug, content, featured_image, status, is_active, requires_auth, display_order, updated_at, created_at'
    )
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
  if (error) throw error

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
    .filter((p) => p.topic_slug)
}

export async function getPublicFyPage(
  topicSlug: string,
  pageSlug: string
): Promise<(PublicFyPage & { topic: PublicFyTopic }) | null> {
  if (FY_MEMBERS_ONLY_SLUGS.has(pageSlug)) return null

  const topic = await getPublicFyTopicBySlug(topicSlug)
  if (!topic) return null

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select(
      'id, topic_id, title, slug, content, featured_image, status, is_active, requires_auth, display_order, updated_at, created_at'
    )
    .eq('topic_id', topic.id)
    .eq('slug', pageSlug)
    .eq('status', 'published')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!data || !isPublicRow(data)) return null
  return { ...(data as PublicFyPage), topic }
}

/** Allow logged-out image view for public general-cohort FY assets only. */
export async function canViewFyImageWithoutAuth(filePath: string): Promise<boolean> {
  if (!filePath || filePath.includes('..')) return false
  if (!filePath.startsWith('foundation-year/general/')) return false

  const parts = filePath.split('/')
  // foundation-year / general / topicSlug / pageSlug / images / file
  if (parts.length < 5) return false
  const pageSlug = parts[3]
  if (!pageSlug || FY_MEMBERS_ONLY_SLUGS.has(pageSlug)) return false

  const topicIds = await generalTopicIds()
  if (!topicIds.length) return false

  const { data, error } = await supabaseAdmin
    .from('fy_pages')
    .select('id, slug, requires_auth, status, is_active')
    .eq('slug', pageSlug)
    .in('topic_id', topicIds)
    .limit(1)
    .maybeSingle()

  if (error || !data) return false
  return isPublicRow(data)
}
