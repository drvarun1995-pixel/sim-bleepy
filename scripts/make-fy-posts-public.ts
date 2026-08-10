/**
 * Move selected FY posts from members-only (fy1) to public (general) SEO surface.
 *
 * Copies storage images fy1 → general, rewrites content paths, upserts general pages,
 * and clears requires_auth on fy1 copies so placements links stay open.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/make-fy-posts-public.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const POSTS = [
  {
    slug: 'fy1-potassium-prescribing-hypokalaemia',
    topicSlug: 'clerking-shifts',
  },
  {
    slug: 'fy1-anticoagulation-ward-basics',
    topicSlug: 'clerking-shifts',
  },
  {
    slug: 'fy1-new-oxygen-requirement',
    topicSlug: 'working-on-calls',
  },
] as const

async function topicId(cohort: string, topicSlug: string) {
  const { data, error } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', cohort)
    .eq('slug', topicSlug)
    .maybeSingle()
  if (error || !data) throw new Error(`Missing topic ${cohort}/${topicSlug}`)
  return data.id as string
}

async function copyFolder(fromPrefix: string, toPrefix: string) {
  const { data: files, error } = await sb.storage.from('placements').list(fromPrefix, {
    limit: 100,
  })
  if (error) throw new Error(`List failed ${fromPrefix}: ${error.message}`)
  if (!files?.length) {
    console.warn(`  no files under ${fromPrefix}`)
    return
  }

  for (const file of files) {
    if (!file.name || file.name === '.emptyFolderPlaceholder') continue
    const fromPath = `${fromPrefix}/${file.name}`
    const toPath = `${toPrefix}/${file.name}`
    const { data: blob, error: dlError } = await sb.storage.from('placements').download(fromPath)
    if (dlError || !blob) {
      console.warn(`  skip download ${fromPath}: ${dlError?.message}`)
      continue
    }
    const buf = Buffer.from(await blob.arrayBuffer())
    const contentType =
      file.name.endsWith('.webp')
        ? 'image/webp'
        : file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')
          ? 'image/jpeg'
          : 'image/png'
    const { error: upError } = await sb.storage.from('placements').upload(toPath, buf, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    })
    if (upError) throw new Error(`Upload failed ${toPath}: ${upError.message}`)
    console.log(`  copied ${file.name}`)
  }
}

async function upsertGeneralPage(opts: {
  topicId: string
  slug: string
  title: string
  content: string
  featured_image: string
  display_order: number | null
}) {
  const { data: existing } = await sb
    .from('fy_pages')
    .select('id')
    .eq('topic_id', opts.topicId)
    .eq('slug', opts.slug)
    .maybeSingle()

  const payload = {
    title: opts.title,
    content: opts.content,
    featured_image: opts.featured_image,
    status: 'published' as const,
    is_active: true,
    requires_auth: false,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('requires_auth')) {
      const { requires_auth: _r, ...rest } = payload
      ;({ error } = await sb.from('fy_pages').update(rest).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`  updated general page ${existing.id}`)
    return
  }

  const insertPayload = {
    topic_id: opts.topicId,
    slug: opts.slug,
    display_order: opts.display_order ?? 50,
    ...payload,
  }
  let { error } = await sb.from('fy_pages').insert(insertPayload)
  if (error?.message?.includes('requires_auth')) {
    const { requires_auth: _r, ...rest } = insertPayload
    ;({ error } = await sb.from('fy_pages').insert(rest))
  }
  if (error) throw error
  console.log('  created general page')
}

async function main() {
  for (const post of POSTS) {
    console.log(`\n=== ${post.slug}`)
    const fy1Topic = await topicId('fy1', post.topicSlug)
    const generalTopic = await topicId('general', post.topicSlug)

    const { data: fy1Page, error } = await sb
      .from('fy_pages')
      .select('id, title, content, featured_image, display_order')
      .eq('topic_id', fy1Topic)
      .eq('slug', post.slug)
      .maybeSingle()

    if (error || !fy1Page) {
      throw new Error(`FY1 page missing for ${post.slug}: ${error?.message || 'not found'}`)
    }

    const fromDir = `foundation-year/fy1/${post.topicSlug}/${post.slug}/images`
    const toDir = `foundation-year/general/${post.topicSlug}/${post.slug}/images`
    console.log(`  copying images ${fromDir} → ${toDir}`)
    await copyFolder(fromDir, toDir)

    const fromPrefix = `foundation-year/fy1/${post.topicSlug}/${post.slug}/`
    const toPrefix = `foundation-year/general/${post.topicSlug}/${post.slug}/`
    const content = String(fy1Page.content || '').split(fromPrefix).join(toPrefix)
    const featured = String(fy1Page.featured_image || '').replace(fromPrefix, toPrefix)

    await upsertGeneralPage({
      topicId: generalTopic,
      slug: post.slug,
      title: fy1Page.title,
      content,
      featured_image: featured,
      display_order: fy1Page.display_order,
    })

    // Keep fy1 copy open (not members-only) with public-safe image paths
    const fy1Update = {
      content,
      featured_image: featured,
      requires_auth: false,
      updated_at: new Date().toISOString(),
    }
    let { error: fy1Err } = await sb.from('fy_pages').update(fy1Update).eq('id', fy1Page.id)
    if (fy1Err?.message?.includes('requires_auth')) {
      const { requires_auth: _r, ...rest } = fy1Update
      ;({ error: fy1Err } = await sb.from('fy_pages').update(rest).eq('id', fy1Page.id))
    }
    if (fy1Err) throw fy1Err
    console.log(`  updated fy1 page ${fy1Page.id} → public`)
    console.log(`  public URL: /guides/foundation-year/${post.topicSlug}/${post.slug}`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
