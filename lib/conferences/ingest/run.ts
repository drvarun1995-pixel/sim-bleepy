import { CONFERENCE_ADAPTERS, listConferenceAdapterKeys } from './index'
import { ingestSourceGroups, sourceSeedForAdapter } from './source-registry'
import { supabaseAdmin } from '@/utils/supabase'

const SKIP_REINGEST = new Set(['rejected', 'archived'])

async function specialtyIdsForSlugs(slugs: string[]) {
  if (!slugs.length) return []
  const { data } = await supabaseAdmin.from('specialties').select('id, slug').in('slug', slugs)
  return (data || []).map((row) => row.id as string)
}

async function ensureSource(adapterKey: string) {
  const { data: existing, error } = await supabaseAdmin
    .from('conference_sources')
    .select('*')
    .eq('adapter_key', adapterKey)
    .maybeSingle()
  if (error) throw error
  if (existing) return existing

  const seed = sourceSeedForAdapter(adapterKey)
  if (!seed) throw new Error(`Unknown conference source adapter: ${adapterKey}`)

  const { data: created, error: insertError } = await supabaseAdmin
    .from('conference_sources')
    .insert({
      name: seed.organisation,
      base_url: seed.url,
      adapter_key: adapterKey,
      enabled: true,
    })
    .select('*')
    .single()
  if (insertError) throw insertError
  return created
}

export async function runConferenceIngest(options?: { adapterKey?: string; html?: string }) {
  const startedAt = new Date().toISOString()
  const key = options?.adapterKey || 'bgs_abstracts'

  const source = await ensureSource(key)
  if (!source.enabled) throw new Error(`Conference source ${key} is disabled`)

  const adapter = CONFERENCE_ADAPTERS[key]
  if (!adapter) throw new Error(`No adapter implemented for ${key}`)

  const { data: run } = await supabaseAdmin
    .from('conference_ingest_runs')
    .insert({ source_id: source.id, started_at: startedAt })
    .select('id')
    .single()

  let found = 0
  let created = 0
  let updated = 0
  let queued = 0
  let skipped = 0
  let errorMessage: string | null = null

  try {
    const items = await adapter.listOpportunities(options?.html)
    found = items.length

    for (const item of items) {
      const closed =
        item.submission_status === 'closed' ||
        (Boolean(item.abstract_deadline) && new Date(item.abstract_deadline as string) < new Date())

      const { data: existing } = await supabaseAdmin
        .from('conference_opportunities')
        .select('id, publication_status, slug')
        .eq('canonical_url', item.canonical_url)
        .maybeSingle()

      if (existing?.publication_status && SKIP_REINGEST.has(existing.publication_status)) {
        skipped += 1
        continue
      }

      if (closed) {
        skipped += 1
        if (existing?.id && existing.publication_status !== 'published') {
          await supabaseAdmin
            .from('conference_opportunities')
            .update({
              publication_status: 'archived',
              submission_status: 'closed',
              abstract_deadline: item.abstract_deadline,
              last_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        }
        continue
      }

      const payload = {
        name: item.name,
        organising_body: item.organising_body,
        start_date: item.start_date,
        end_date: item.end_date,
        location_text: item.location_text,
        city: item.city,
        nation: item.nation,
        format: item.format,
        abstract_open_at: item.abstract_open_at,
        abstract_deadline: item.abstract_deadline,
        results_date_text: item.results_date_text,
        submission_status: item.submission_status,
        poster_accepted: item.poster_accepted,
        oral_accepted: item.oral_accepted,
        eligible_work_types: item.eligible_work_types,
        eligible_career_levels: item.eligible_career_levels,
        abstract_word_limit: item.abstract_word_limit,
        submission_requirements: item.submission_requirements,
        prize_info: item.prize_info,
        publication_info: item.publication_info,
        recognition_level: item.recognition_level,
        official_page_url: item.official_page_url,
        submission_page_url: item.submission_page_url,
        canonical_url: item.canonical_url,
        poster_requirements: item.poster_requirements,
        source_type: 'scraped',
        source_id: source.id,
        ingest_payload: item.ingest_payload,
        verification_confidence: item.verification_confidence,
        last_verified_at: new Date().toISOString(),
        deadline_not_stated: !item.abstract_deadline,
      }

      if (existing?.id) {
        const { error } = await supabaseAdmin
          .from('conference_opportunities')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
        updated += 1
        if (existing.publication_status === 'pending_review' || existing.publication_status === 'draft') queued += 1

        if (!existing.publication_status || existing.publication_status === 'pending_review' || existing.publication_status === 'draft') {
          const specialtyIds = await specialtyIdsForSlugs(item.suggested_specialty_slugs)
          if (specialtyIds.length) {
            await supabaseAdmin.from('conference_opportunity_specialties').delete().eq('opportunity_id', existing.id)
            await supabaseAdmin.from('conference_opportunity_specialties').insert(
              specialtyIds.map((specialty_id) => ({ opportunity_id: existing.id, specialty_id }))
            )
          }
        }
      } else {
        const slugBase = item.canonical_url.split('#')[1] || slugifySafe(item.name)
        let slug = slugBase
        let n = 2
        while (true) {
          const { data: clash } = await supabaseAdmin
            .from('conference_opportunities')
            .select('id')
            .eq('slug', slug)
            .maybeSingle()
          if (!clash) break
          slug = `${slugBase}-${n}`
          n += 1
        }

        const { data: createdRow, error } = await supabaseAdmin
          .from('conference_opportunities')
          .insert({
            ...payload,
            slug,
            publication_status: 'pending_review',
          })
          .select('id')
          .single()
        if (error) throw error
        created += 1
        queued += 1

        const specialtyIds = await specialtyIdsForSlugs(item.suggested_specialty_slugs)
        if (createdRow?.id && specialtyIds.length) {
          await supabaseAdmin.from('conference_opportunity_specialties').insert(
            specialtyIds.map((specialty_id) => ({ opportunity_id: createdRow.id, specialty_id }))
          )
        }
      }
    }

    await supabaseAdmin
      .from('conference_sources')
      .update({ last_run_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
      .eq('id', source.id)
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Ingest failed'
    await supabaseAdmin
      .from('conference_sources')
      .update({ last_error: errorMessage, updated_at: new Date().toISOString() })
      .eq('id', source.id)
    throw error
  } finally {
    if (run?.id) {
      await supabaseAdmin
        .from('conference_ingest_runs')
        .update({
          finished_at: new Date().toISOString(),
          items_found: found,
          items_created: created,
          items_updated: updated,
          items_queued: queued,
          error: errorMessage,
        })
        .eq('id', run.id)
    }
  }

  return { source: key, found, created, updated, queued, skipped }
}

export async function runAllConferenceIngest() {
  const results = []
  for (const adapterKey of listConferenceAdapterKeys()) {
    try {
      results.push({ ok: true, ...(await runConferenceIngest({ adapterKey })) })
    } catch (error) {
      results.push({
        ok: false,
        source: adapterKey,
        error: error instanceof Error ? error.message : 'Ingest failed',
      })
    }
  }
  return { results }
}

export async function listIngestSources() {
  const { data: rows } = await supabaseAdmin
    .from('conference_sources')
    .select('adapter_key, enabled, last_run_at, last_error, name, base_url')

  const byKey = new Map((rows || []).map((row) => [row.adapter_key, row]))
  return ingestSourceGroups().map((seed) => {
    const row = byKey.get(seed.adapterKey)
    return {
      adapterKey: seed.adapterKey,
      name: seed.name,
      organisation: seed.organisation,
      specialty: seed.specialty,
      url: seed.url,
      urls: seed.urls,
      notes: seed.notes,
      priority: seed.priority,
      kind: seed.kind,
      enabled: row?.enabled !== false,
      last_run_at: row?.last_run_at || null,
      last_error: row?.last_error || null,
    }
  })
}

function slugifySafe(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'conference'
}
