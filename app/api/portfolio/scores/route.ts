import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  emptyImtScores,
  IMT_SCORE_DOMAINS,
  IMT_SCORE_LADDERS,
  imtScoreTotal,
} from '@/lib/imt-scores'

export const dynamic = 'force-dynamic'

function requireImtUser(session: { user?: { id?: string; role?: string } } | null) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userRole = session.user.role
  if (userRole !== 'ctf' && userRole !== 'admin') {
    return NextResponse.json(
      {
        error: 'Access Denied',
        message: 'IMT Portfolio is only accessible to CTF and Admin users.',
      },
      { status: 403 }
    )
  }
  return null
}

function parseScores(body: Record<string, unknown>) {
  const scores = emptyImtScores()
  for (const domain of IMT_SCORE_DOMAINS) {
    const value = Number(body[domain.key])
    if (!IMT_SCORE_LADDERS[domain.key].includes(value as never)) {
      return { error: `Invalid ${domain.key} score` }
    }
    scores[domain.key] = value
  }
  scores.total = imtScoreTotal(scores)
  return { scores }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const denied = requireImtUser(session as any)
    if (denied) return denied

    const { data, error } = await supabaseAdmin
      .from('imt_self_assessment_scores')
      .select('*')
      .eq('user_id', session!.user.id)
      .maybeSingle()

    if (error) {
      console.error('IMT scores fetch error:', error)
      return NextResponse.json({ error: 'Failed to load scores' }, { status: 500 })
    }

    return NextResponse.json({ scores: data || { user_id: session!.user.id, ...emptyImtScores() } })
  } catch (error) {
    console.error('IMT scores GET error:', error)
    return NextResponse.json({ error: 'Failed to load scores' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const denied = requireImtUser(session as any)
    if (denied) return denied

    const body = await request.json()
    const parsed = parseScores(body)
    if ('error' in parsed && parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('imt_self_assessment_scores')
      .upsert(
        {
          user_id: session!.user.id,
          ...parsed.scores,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('IMT scores save error:', error)
      return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
    }

    return NextResponse.json({ success: true, scores: data })
  } catch (error) {
    console.error('IMT scores PUT error:', error)
    return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
  }
}
