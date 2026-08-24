import {
  computeListingStatus,
  slugifyConferenceName,
  type ConferenceOpportunity,
  type ConferenceSpecialty,
  type WorkflowStatus,
} from '@/lib/conferences'
import { supabaseAdmin } from '@/utils/supabase'

type SpecialtyJoin = {
  specialty_id: string
  specialties: ConferenceSpecialty | ConferenceSpecialty[] | null
}

type OpportunityRow = Omit<ConferenceOpportunity, 'specialties' | 'listing_status' | 'save'> & {
  conference_opportunity_specialties?: SpecialtyJoin[] | null
  conference_saves?: Array<{ id: string; workflow_status: WorkflowStatus; notes: string | null }> | null
  ingest_payload?: unknown
}

function flattenSpecialty(join: SpecialtyJoin): ConferenceSpecialty | null {
  const spec = Array.isArray(join.specialties) ? join.specialties[0] : join.specialties
  if (!spec?.id) return null
  return { id: spec.id, name: spec.name, slug: spec.slug }
}

export function mapOpportunity(
  row: OpportunityRow,
  now = new Date()
): ConferenceOpportunity {
  const specialties = (row.conference_opportunity_specialties || [])
    .map(flattenSpecialty)
    .filter((item): item is ConferenceSpecialty => Boolean(item))

  const save = row.conference_saves?.[0] || null

  return {
    ...row,
    eligible_work_types: row.eligible_work_types || [],
    eligible_career_levels: row.eligible_career_levels || [],
    poster_requirements: (row.poster_requirements || {}) as Record<string, unknown>,
    listing_status: computeListingStatus(row, now),
    specialties,
    save,
  }
}

const OPPORTUNITY_SELECT = `
  *,
  conference_opportunity_specialties (
    specialty_id,
    specialties (id, name, slug)
  )
`

export async function uniqueConferenceSlug(name: string, excludeId?: string) {
  const base = slugifyConferenceName(name)
  let slug = base
  let n = 2
  while (true) {
    let query = supabaseAdmin.from('conference_opportunities').select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    slug = `${base}-${n}`
    n += 1
  }
}

export async function replaceOpportunitySpecialties(opportunityId: string, specialtyIds: string[]) {
  await supabaseAdmin
    .from('conference_opportunity_specialties')
    .delete()
    .eq('opportunity_id', opportunityId)

  const unique = Array.from(new Set(specialtyIds.filter(Boolean)))
  if (!unique.length) return

  const { error } = await supabaseAdmin.from('conference_opportunity_specialties').insert(
    unique.map((specialty_id) => ({ opportunity_id: opportunityId, specialty_id }))
  )
  if (error) throw error
}

async function attachSaves(opportunities: ConferenceOpportunity[], userId?: string) {
  if (!userId || !opportunities.length) return opportunities
  const { data } = await supabaseAdmin
    .from('conference_saves')
    .select('id, workflow_status, notes, opportunity_id')
    .eq('user_id', userId)
    .in('opportunity_id', opportunities.map((opp) => opp.id))

  const byId = new Map((data || []).map((row) => [row.opportunity_id, row]))
  return opportunities.map((opp) => {
    const save = byId.get(opp.id)
    if (!save) return opp
    return {
      ...opp,
      save: { id: save.id, workflow_status: save.workflow_status, notes: save.notes },
    }
  })
}

export async function getOpportunityBySlugOrId(slugOrId: string, includeSaveForUserId?: string) {
  let query = supabaseAdmin.from('conference_opportunities').select(OPPORTUNITY_SELECT)
  const looksLikeUuid = /^[0-9a-f-]{36}$/i.test(slugOrId)
  query = looksLikeUuid ? query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`) : query.eq('slug', slugOrId)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) return null
  const mapped = mapOpportunity(data as OpportunityRow)
  const [withSave] = await attachSaves([mapped], includeSaveForUserId)
  return withSave
}

type ListParams = {
  q?: string
  specialty?: string
  presentation?: 'poster' | 'oral' | 'both'
  workType?: string
  careerLevel?: string
  format?: string
  nation?: string
  recognition?: string
  prize?: 'yes' | 'no'
  deadlineDays?: number
  includeClosed?: boolean
  publicationStatus?: string
  publicationStatuses?: string[]
  excludePublicationStatuses?: string[]
  staffView?: boolean
  sort?: 'deadline' | 'event' | 'verified'
  page?: number
  limit?: number
  userId?: string
}

export async function listOpportunities(params: ListParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, Math.max(1, params.limit || 20))
  const from = (page - 1) * limit
  const to = from + limit - 1
  const now = new Date()

  let query = supabaseAdmin.from('conference_opportunities').select(OPPORTUNITY_SELECT, { count: 'exact' })

  if (params.staffView) {
    if (params.publicationStatuses?.length) {
      query = query.in('publication_status', params.publicationStatuses)
    } else if (params.publicationStatus) {
      query = query.eq('publication_status', params.publicationStatus)
    }
    if (params.excludePublicationStatuses?.length) {
      query = query.not(
        'publication_status',
        'in',
        `(${params.excludePublicationStatuses.join(',')})`
      )
    }
  } else {
    query = query.eq('publication_status', 'published')
  }

  if (params.q) {
    const q = params.q.replace(/,/g, ' ').trim()
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,organising_body.ilike.%${q}%,location_text.ilike.%${q}%,city.ilike.%${q}%`
      )
    }
  }

  if (params.specialty) {
    const { data: links } = await supabaseAdmin
      .from('conference_opportunity_specialties')
      .select('opportunity_id')
      .eq('specialty_id', params.specialty)
    const ids = (links || []).map((row) => row.opportunity_id)
    if (!ids.length) return { opportunities: [] as ConferenceOpportunity[], total: 0, page, limit }
    query = query.in('id', ids)
  }

  if (params.presentation === 'poster') query = query.eq('poster_accepted', true)
  if (params.presentation === 'oral') query = query.eq('oral_accepted', true)
  if (params.presentation === 'both') query = query.eq('poster_accepted', true).eq('oral_accepted', true)
  if (params.workType) query = query.contains('eligible_work_types', [params.workType])
  if (params.careerLevel) query = query.contains('eligible_career_levels', [params.careerLevel])
  if (params.format) query = query.eq('format', params.format)
  if (params.nation) query = query.eq('nation', params.nation)
  if (params.recognition) query = query.eq('recognition_level', params.recognition)
  if (params.prize === 'yes') query = query.not('prize_info', 'is', null).neq('prize_info', '')
  if (params.prize === 'no') query = query.or('prize_info.is.null,prize_info.eq.')

  if (params.deadlineDays) {
    const until = new Date(now.getTime() + params.deadlineDays * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('abstract_deadline', now.toISOString()).lte('abstract_deadline', until)
  }

  if (params.sort === 'event') query = query.order('start_date', { ascending: true, nullsFirst: false })
  else if (params.sort === 'verified') query = query.order('last_verified_at', { ascending: false, nullsFirst: false })
  else query = query.order('abstract_deadline', { ascending: true, nullsFirst: false })

  if (!params.includeClosed) {
    const today = now.toISOString().slice(0, 10)
    query = query.or(`end_date.is.null,end_date.gte.${today}`)
    query = query.or(
      `status_override.in.(open,upcoming),abstract_deadline.gte.${now.toISOString()},and(abstract_deadline.is.null,deadline_not_stated.eq.true)`
    )
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  const mapped = (data || []).map((row) => mapOpportunity(row as OpportunityRow, now))
  const opportunities = await attachSaves(mapped, params.userId)

  return { opportunities, total: count || opportunities.length, page, limit }
}

export async function listSavedOpportunities(userId: string) {
  const { data: saves, error: saveError } = await supabaseAdmin
    .from('conference_saves')
    .select('id, workflow_status, notes, opportunity_id, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (saveError) throw saveError
  if (!saves?.length) return [] as ConferenceOpportunity[]

  const { data, error } = await supabaseAdmin
    .from('conference_opportunities')
    .select(OPPORTUNITY_SELECT)
    .in('id', saves.map((row) => row.opportunity_id))

  if (error) throw error

  const mapped = (data || []).map((row) => mapOpportunity(row as OpportunityRow))
  const byId = new Map(mapped.map((opp) => [opp.id, opp]))

  return saves
    .map((save) => {
      const opp = byId.get(save.opportunity_id)
      if (!opp) return null
      return {
        ...opp,
        save: {
          id: save.id,
          workflow_status: save.workflow_status,
          notes: save.notes,
        },
      }
    })
    .filter((item): item is ConferenceOpportunity => Boolean(item))
}
