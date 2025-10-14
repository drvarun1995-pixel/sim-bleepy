import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'ctf', 'educator', 'meded_team'].includes(userData.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch file requests
    const { data: requests, error } = await supabase
      .from('file_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching file requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    // Transform snake_case to camelCase for frontend
    const transformedRequests = (requests || []).map(request => ({
      id: request.id,
      userEmail: request.user_email,
      userName: request.user_name,
      fileName: request.file_name,
      description: request.description,
      additionalInfo: request.additional_info,
      eventId: request.event_id,
      eventTitle: request.event_title,
      eventDate: request.event_date,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    }))

    return NextResponse.json({ requests: transformedRequests })

  } catch (error) {
    console.error('Error in file requests API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
