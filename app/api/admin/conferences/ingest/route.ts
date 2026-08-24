import { NextRequest, NextResponse } from 'next/server'
import { assertStaff, getConferenceSessionUser } from '@/lib/conferences-auth'
import { listIngestSources, runAllConferenceIngest, runConferenceIngest } from '@/lib/conferences/ingest/run'
import { listConferenceAdapterKeys } from '@/lib/conferences/ingest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const gate = assertStaff(await getConferenceSessionUser())
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const sources = await listIngestSources()
    return NextResponse.json({ sources })
  } catch (error) {
    console.error('GET /api/admin/conferences/ingest', error)
    return NextResponse.json({ error: 'Failed to load ingest sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = assertStaff(await getConferenceSessionUser())
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const body = await request.json().catch(() => ({}))
    const adapterKey = String(body.adapterKey || '')
    if (adapterKey === 'all') {
      const result = await runAllConferenceIngest()
      return NextResponse.json(result)
    }

    const key = adapterKey || 'bgs_abstracts'
    if (!listConferenceAdapterKeys().includes(key)) {
      return NextResponse.json({ error: `Unknown adapter: ${key}` }, { status: 400 })
    }

    const result = await runConferenceIngest({ adapterKey: key })
    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/admin/conferences/ingest', error)
    const message = error instanceof Error ? error.message : 'Ingest failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
