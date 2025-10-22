import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, attendeeIds } = await request.json()

    if (!eventId || !attendeeIds || !Array.isArray(attendeeIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: eventId, attendeeIds' 
      }, { status: 400 })
    }

    // Check for existing certificates
    const { data: existingCertificates, error } = await supabaseAdmin
      .from('certificates')
      .select('user_id, generated_at, template_id')
      .eq('event_id', eventId)
      .in('user_id', attendeeIds)

    if (error) {
      console.error('Error checking existing certificates:', error)
      return NextResponse.json({ error: 'Failed to check existing certificates' }, { status: 500 })
    }

    return NextResponse.json({
      existingCertificates: existingCertificates || []
    })

  } catch (error) {
    console.error('Error in check-existing endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
