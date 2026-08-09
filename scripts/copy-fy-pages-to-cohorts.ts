/**
 * Copy published Foundation Year pages from `general` into `fy1` and `fy2`
 * for matching topic slugs (idempotent upsert by topic_id + slug).
 *
 * Reuses featured_image / content paths (images already served by path).
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/copy-fy-pages-to-cohorts.ts
 * Dry run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/copy-fy-pages-to-cohorts.ts --dry-run
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const DRY = process.argv.includes('--dry-run')
const TARGETS = ['fy1', 'fy2'] as const

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type Topic = { id: string; cohort: string; slug: string; name: string }
type Page = {
  id: string
  topic_id: string
  title: string
  slug: string
  content: string | null
  featured_image: string | null
  status: string
  display_order: number | null
  is_active: boolean | null
  requires_auth?: boolean | null
}

async function main() {
  const { data: topics, error: tErr } = await sb
    .from('fy_topics')
    .select('id, cohort, slug, name')
  if (tErr) throw tErr

  const byCohortSlug = new Map<string, Topic>()
  for (const t of topics || []) {
    byCohortSlug.set(`${t.cohort}:${t.slug}`, t as Topic)
  }

  const generalTopics = (topics || []).filter((t) => t.cohort === 'general')
  let created = 0
  let updated = 0
  let skipped = 0

  for (const topic of generalTopics) {
    const { data: pages, error: pErr } = await sb
      .from('fy_pages')
      .select(
        'id, topic_id, title, slug, content, featured_image, status, display_order, is_active, requires_auth'
      )
      .eq('topic_id', topic.id)
      .eq('status', 'published')
      .eq('is_active', true)

    if (pErr) {
      // requires_auth column may be missing in select if migration not applied — retry without it
      const retry = await sb
        .from('fy_pages')
        .select(
          'id, topic_id, title, slug, content, featured_image, status, display_order, is_active'
        )
        .eq('topic_id', topic.id)
        .eq('status', 'published')
        .eq('is_active', true)
      if (retry.error) throw retry.error
      await copyPages(topic.slug, (retry.data || []) as Page[], byCohortSlug, {
        onCreate: () => {
          created += 1
        },
        onUpdate: () => {
          updated += 1
        },
        onSkip: () => {
          skipped += 1
        },
      })
      continue
    }

    await copyPages(topic.slug, (pages || []) as Page[], byCohortSlug, {
      onCreate: () => {
        created += 1
      },
      onUpdate: () => {
        updated += 1
      },
      onSkip: () => {
        skipped += 1
      },
    })
  }

  console.log(
    `\nDone. created=${created} updated=${updated} skipped=${skipped} dryRun=${DRY}`
  )
}

async function copyPages(
  topicSlug: string,
  pages: Page[],
  byCohortSlug: Map<string, Topic>,
  counters: { onCreate: () => void; onUpdate: () => void; onSkip: () => void }
) {
  for (const target of TARGETS) {
    const destTopic = byCohortSlug.get(`${target}:${topicSlug}`)
    if (!destTopic) {
      console.warn(`Missing topic ${target}/${topicSlug}`)
      continue
    }

    for (const page of pages) {
      const { data: existing } = await sb
        .from('fy_pages')
        .select('id')
        .eq('topic_id', destTopic.id)
        .eq('slug', page.slug)
        .maybeSingle()

      const payload: Record<string, unknown> = {
        topic_id: destTopic.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        featured_image: page.featured_image,
        status: page.status,
        display_order: page.display_order ?? 0,
        is_active: page.is_active ?? true,
        updated_at: new Date().toISOString(),
      }
      if (typeof page.requires_auth === 'boolean') {
        payload.requires_auth = page.requires_auth
      }

      console.log(
        `${existing ? 'UPDATE' : 'CREATE'} ${target}/${topicSlug}/${page.slug}`
      )
      if (DRY) {
        counters.onSkip()
        continue
      }

      if (existing?.id) {
        let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
        if (error?.message?.includes('requires_auth')) {
          delete payload.requires_auth
          ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing.id))
        }
        if (error) throw error
        counters.onUpdate()
      } else {
        let { error } = await sb.from('fy_pages').insert(payload)
        if (error?.message?.includes('requires_auth')) {
          delete payload.requires_auth
          ;({ error } = await sb.from('fy_pages').insert(payload))
        }
        if (error) throw error
        counters.onCreate()
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
