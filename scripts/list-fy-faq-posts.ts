import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const { extractFyFaqItems, shouldEmitFyFaqSchema } = await import('../lib/fy-faq-schema')
  const { isMembersOnlyFyPage } = await import('../lib/fy-blog-access')

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: topics, error: tErr } = await sb
    .from('fy_topics')
    .select('id, slug, name')
    .eq('cohort', 'general')
    .eq('is_active', true)
  if (tErr) throw tErr

  const topicMap = new Map((topics || []).map((t) => [t.id, t]))
  const topicIds = [...topicMap.keys()]
  if (!topicIds.length) {
    console.log('No general topics')
    return
  }

  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('topic_id, slug, title, content, status, is_active, requires_auth')
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .eq('is_active', true)
  if (error) throw error

  const withFaq: { title: string; path: string; faqs: number }[] = []
  let publicCount = 0

  for (const page of pages || []) {
    if (page.requires_auth === true || isMembersOnlyFyPage(page)) continue
    publicCount++
    const items = extractFyFaqItems(page.content || '')
    if (!shouldEmitFyFaqSchema(page.content || '', items)) continue
    const topic = topicMap.get(page.topic_id)
    if (!topic) continue
    withFaq.push({
      title: page.title,
      path: `/guides/foundation-year/${topic.slug}/${page.slug}`,
      faqs: items.length,
    })
  }

  withFaq.sort((a, b) => b.faqs - a.faqs)
  console.log(`FAQ schema on ${withFaq.length} of ${publicCount} public general guides:\n`)
  for (const row of withFaq) {
    console.log(`- ${row.title} (${row.faqs})`)
    console.log(`  ${row.path}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
