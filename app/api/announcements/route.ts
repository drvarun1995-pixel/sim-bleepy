import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/announcements - Get all announcements (for admin/educator management)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Check if user is admin or educator
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all announcements with author information
    // Include author_id for permission checking
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:users!announcements_author_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      // Check if the table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Announcements table not found. Please run the database setup script.',
          code: 'TABLE_NOT_FOUND'
        }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    // Format the response
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      author_name: announcement.author?.name || announcement.author?.email || 'Unknown'
    }))

    return NextResponse.json({ announcements: formattedAnnouncements })
  } catch (error) {
    console.error('Error in GET /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/announcements - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Check if user is admin or educator
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, target_audience, priority = 'normal', is_active = true, expires_at } = body

    // Validate required fields
    if (!title || !content || !target_audience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate target audience structure
    if (typeof target_audience !== 'object' || !target_audience.type) {
      return NextResponse.json({ error: 'Invalid target audience format' }, { status: 400 })
    }

    // Create the announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        target_audience,
        priority,
        is_active,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Check if the table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Announcements table not found. Please run the database setup script.',
          code: 'TABLE_NOT_FOUND'
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: 'Failed to create announcement', 
        details: error.message || 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
