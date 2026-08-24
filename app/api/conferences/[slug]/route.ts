import { NextRequest, NextResponse } from 'next/server'
import { assertStaff, getConferenceSessionUser } from '@/lib/conferences-auth'
import { getOpportunityBySlugOrId, replaceOpportunitySpecialties, uniqueConferenceSlug } from '@/lib/conferences-db'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getConferenceSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const opportunity = await getOpportunityBySlugOrId(params.slug, user.id)
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const preview = request.nextUrl.searchParams.get('preview') === '1'
    const staff = assertStaff(user)
    if (opportunity.publication_status !== 'published' && !(preview && staff.ok)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ opportunity })
  } catch (error) {
    console.error('GET /api/conferences/[slug]', error)
    return NextResponse.json({ error: 'Failed to load conference' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const gate = assertStaff(await getConferenceSessionUser())
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const existing = await getOpportunityBySlugOrId(params.slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const assign = [
      'organising_body', 'start_date', 'end_date', 'location_text', 'city', 'nation', 'format',
      'abstract_open_at', 'abstract_deadline', 'results_date_text', 'submission_status',
      'status_override', 'poster_accepted', 'oral_accepted', 'eligible_work_types',
      'eligible_career_levels', 'abstract_word_limit', 'submission_requirements',
      'conference_fee', 'submission_fee', 'prize_info', 'publication_info', 'recognition_level',
      'official_page_url', 'submission_page_url', 'canonical_url', 'poster_requirements',
      'publication_status', 'admin_notes', 'deadline_not_stated',
    ] as const

    for (const key of assign) {
      if (key in body) updates[key] = body[key]
    }

    if (typeof body.name === 'string' && body.name.trim() && body.name.trim() !== existing.name) {
      updates.name = body.name.trim()
      updates.slug = await uniqueConferenceSlug(body.name.trim(), existing.id)
    }

    if (body.publication_status === 'published') {
      updates.reviewed_by = gate.user.id
      updates.reviewed_at = new Date().toISOString()
      updates.last_verified_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('conference_opportunities')
      .update(updates)
      .eq('id', existing.id)

    if (error) throw error

    if (Array.isArray(body.specialty_ids)) {
      await replaceOpportunitySpecialties(existing.id, body.specialty_ids)
    }

    const opportunity = await getOpportunityBySlugOrId(existing.id, gate.user.id)
    return NextResponse.json({ opportunity })
  } catch (error) {
    console.error('PATCH /api/conferences/[slug]', error)
    return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const gate = assertStaff(await getConferenceSessionUser())
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const existing = await getOpportunityBySlugOrId(params.slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabaseAdmin.from('conference_opportunities').delete().eq('id', existing.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/conferences/[slug]', error)
    return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 })
  }
}
