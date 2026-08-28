import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requirePersonalPortfolioUser } from '@/lib/portfolio-access'
import {
  emptyImtScores,
  IMT_SCORE_DOMAINS,
  IMT_SCORE_LADDERS,
  imtScoreTotal,
} from '@/lib/imt-scores'

export const dynamic = 'force-dynamic'

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
    const access = await requirePersonalPortfolioUser('IMT Portfolio')
    if (access.error) return access.error
    const session = access.session

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
    const access = await requirePersonalPortfolioUser('IMT Portfolio')
    if (access.error) return access.error
    const session = access.session

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
