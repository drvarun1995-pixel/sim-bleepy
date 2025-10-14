import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH /api/announcements/[id] - Update an announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()

    // Check if announcement exists and user has permission to edit
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Permission check: Admin/MedEd/CTF can edit all, Educator can only edit their own
    const isAuthor = announcement.author_id === user.id
    const isAdmin = user.role === 'admin'
    const isMedEdTeam = user.role === 'meded_team'
    const isCTF = user.role === 'ctf'
    const hasAdminPermissions = isAdmin || isMedEdTeam || isCTF
    
    if (!hasAdminPermissions && !isAuthor) {
      return NextResponse.json({ 
        error: 'Forbidden: You can only edit your own announcements' 
      }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.content !== undefined) updateData.content = body.content.trim()
    if (body.target_audience !== undefined) updateData.target_audience = body.target_audience
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.expires_at !== undefined) {
      updateData.expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null
    }

    // Update the announcement
    const { data: updatedAnnouncement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: 'Failed to update announcement',
        details: error.message || 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({ announcement: updatedAnnouncement })
  } catch (error) {
    console.error('Error in PATCH /api/announcements/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/announcements/[id] - Delete an announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Check if announcement exists and user has permission to delete
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Permission check: Admin/MedEd/CTF can delete all, Educator can only delete their own
    const isAuthor = announcement.author_id === user.id
    const isAdmin = user.role === 'admin'
    const isMedEdTeam = user.role === 'meded_team'
    const isCTF = user.role === 'ctf'
    const hasAdminPermissions = isAdmin || isMedEdTeam || isCTF
    
    if (!hasAdminPermissions && !isAuthor) {
      return NextResponse.json({ 
        error: 'Forbidden: You can only delete your own announcements' 
      }, { status: 403 })
    }

    // Delete the announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting announcement:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: 'Failed to delete announcement',
        details: error.message || 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/announcements/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
