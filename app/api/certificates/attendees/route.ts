import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 })
    }

    // Import Supabase server client with service role
    // This bypasses RLS for server-side operations while maintaining security
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
    )

    // Query event bookings with user details
    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        id,
        user_id,
        checked_in,
        status,
        users!event_bookings_user_id_fkey (id, name, email)
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform data to match frontend expectations
    const attendees = data?.map((booking: any) => ({
      id: booking.id,
      user_id: booking.user_id,
      checked_in: booking.checked_in,
      status: booking.status,
      users: booking.users || {
        id: booking.user_id,
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    })) || []

    return NextResponse.json({ 
      success: true, 
      attendees,
      count: attendees.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
