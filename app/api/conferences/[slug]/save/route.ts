import { NextRequest, NextResponse } from 'next/server'
import { getConferenceSessionUser } from '@/lib/conferences-auth'
import { getOpportunityBySlugOrId } from '@/lib/conferences-db'
import { WORKFLOW_STATUSES, type WorkflowStatus } from '@/lib/conferences'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const allowed = new Set(WORKFLOW_STATUSES.map((item) => item.value))

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getConferenceSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const opportunity = await getOpportunityBySlugOrId(params.slug)
    if (!opportunity || opportunity.publication_status !== 'published') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const workflow_status = allowed.has(body.workflow_status) ? (body.workflow_status as WorkflowStatus) : 'saved'

    const { data, error } = await supabaseAdmin
      .from('conference_saves')
      .upsert(
        {
          user_id: user.id,
          opportunity_id: opportunity.id,
          workflow_status,
          notes: body.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,opportunity_id' }
      )
      .select('id, workflow_status, notes')
      .single()

    if (error) throw error
    return NextResponse.json({ save: data })
  } catch (error) {
    console.error('POST /api/conferences/[slug]/save', error)
    return NextResponse.json({ error: 'Failed to save conference' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return POST(request, { params })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getConferenceSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const opportunity = await getOpportunityBySlugOrId(params.slug)
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabaseAdmin
      .from('conference_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunity.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/conferences/[slug]/save', error)
    return NextResponse.json({ error: 'Failed to remove save' }, { status: 500 })
  }
}
