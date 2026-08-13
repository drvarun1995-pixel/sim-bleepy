import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { requireSimulationFellowshipUser } from '@/lib/simulation-fellowship-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const access = await requireSimulationFellowshipUser()
    if (access.error) return access.error

    const { data: files, error } = await supabaseAdmin
      .from('simulation_fellowship_files')
      .select('*')
      .eq('user_id', access.session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Simulation fellowship fetch error:', error)
      const missing = /simulation_fellowship_files|does not exist|schema cache/i.test(error.message || '')
      return NextResponse.json(
        {
          error: missing
            ? 'Simulation Fellowship table is not installed yet. Run supabase/migrations/20260813_simulation_fellowship.sql in the Supabase SQL editor.'
            : 'Failed to fetch files',
        },
        { status: missing ? 503 : 500 }
      )
    }

    return NextResponse.json({ files: files || [] }, { status: 200 })
  } catch (error) {
    console.error('Simulation fellowship fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
