import { NextRequest, NextResponse } from 'next/server'
import { assertStaff, getConferenceSessionUser } from '@/lib/conferences-auth'
import { listOpportunities, replaceOpportunitySpecialties, uniqueConferenceSlug } from '@/lib/conferences-db'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

function parseListParams(request: NextRequest, staffView: boolean) {
  const { searchParams } = request.nextUrl
  const deadline = searchParams.get('deadline')
  const deadlineDays = deadline === '7' || deadline === '30' || deadline === '90' ? Number(deadline) : undefined
  return {
    q: searchParams.get('q') || undefined,
    specialty: searchParams.get('specialty') || undefined,
    presentation: (searchParams.get('presentation') as 'poster' | 'oral' | 'both' | null) || undefined,
    workType: searchParams.get('workType') || undefined,
    careerLevel: searchParams.get('careerLevel') || undefined,
    format: searchParams.get('format') || undefined,
    nation: searchParams.get('nation') || undefined,
    recognition: searchParams.get('recognition') || undefined,
    prize: (searchParams.get('prize') as 'yes' | 'no' | null) || undefined,
    deadlineDays,
    includeClosed: searchParams.get('includeClosed') === 'true',
    publicationStatus: searchParams.get('publicationStatus') || undefined,
    publicationStatuses: searchParams.get('publicationStatuses')?.split(',').filter(Boolean) || undefined,
    excludePublicationStatuses: searchParams.get('excludePublicationStatuses')?.split(',').filter(Boolean) || undefined,
    sort: (searchParams.get('sort') as 'deadline' | 'event' | 'verified' | null) || 'deadline',
    page: Number(searchParams.get('page') || 1),
    limit: Number(searchParams.get('limit') || 20),
    staffView,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getConferenceSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const staff = assertStaff(user)
    const staffView = request.nextUrl.searchParams.get('staff') === 'true'
    if (staffView && !staff.ok) {
      return NextResponse.json({ error: staff.error }, { status: staff.status })
    }

    const result = await listOpportunities({
      ...parseListParams(request, Boolean(staffView && staff.ok)),
      userId: user.id,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/conferences', error)
    return NextResponse.json({ error: 'Failed to load conferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = assertStaff(await getConferenceSessionUser())
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const body = await request.json()
    const name = String(body.name || '').trim()
    const officialPageUrl = String(body.official_page_url || '').trim()
    const specialtyIds: string[] = Array.isArray(body.specialty_ids) ? body.specialty_ids : []

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!officialPageUrl) return NextResponse.json({ error: 'Official page URL is required' }, { status: 400 })
    if (!specialtyIds.length) return NextResponse.json({ error: 'Select at least one specialty' }, { status: 400 })
    if (!body.abstract_deadline && !body.deadline_not_stated) {
      return NextResponse.json({ error: 'Provide an abstract deadline or mark it as not stated' }, { status: 400 })
    }

    const slug = await uniqueConferenceSlug(name)
    const { data, error } = await supabaseAdmin
      .from('conference_opportunities')
      .insert({
        name,
        slug,
        organising_body: body.organising_body || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        location_text: body.location_text || null,
        city: body.city || null,
        nation: body.nation || null,
        format: body.format || null,
        abstract_open_at: body.abstract_open_at || null,
        abstract_deadline: body.abstract_deadline || null,
        results_date_text: body.results_date_text || null,
        submission_status: body.submission_status || 'upcoming',
        status_override: body.status_override || null,
        poster_accepted: body.poster_accepted ?? null,
        oral_accepted: body.oral_accepted ?? null,
        eligible_work_types: body.eligible_work_types || [],
        eligible_career_levels: body.eligible_career_levels || [],
        abstract_word_limit: body.abstract_word_limit || null,
        submission_requirements: body.submission_requirements || null,
        conference_fee: body.conference_fee || null,
        submission_fee: body.submission_fee || null,
        prize_info: body.prize_info || null,
        publication_info: body.publication_info || null,
        recognition_level: body.recognition_level || null,
        official_page_url: officialPageUrl,
        submission_page_url: body.submission_page_url || null,
        canonical_url: body.canonical_url || officialPageUrl,
        poster_requirements: body.poster_requirements || {},
        source_type: 'staff',
        last_verified_at: new Date().toISOString(),
        publication_status: body.publication_status || 'draft',
        created_by: gate.user.id,
        admin_notes: body.admin_notes || null,
        deadline_not_stated: Boolean(body.deadline_not_stated),
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A conference with this official URL already exists' }, { status: 409 })
      }
      throw error
    }

    await replaceOpportunitySpecialties(data.id, specialtyIds)
    return NextResponse.json({ opportunity: data })
  } catch (error) {
    console.error('POST /api/conferences', error)
    return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 })
  }
}
