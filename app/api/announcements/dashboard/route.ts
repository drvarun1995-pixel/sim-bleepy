import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { matchesAnnouncementAudience, type AnnouncementAudience } from '@/lib/learner-targeting'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ announcements: [] })
    }

    const supabase = supabaseAdmin

    // Get user profile information
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role_type, study_year, foundation_year, university, specialty, role, academic_status, email, name')
      .eq('email', session.user.email)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Return empty array if we can't get user profile
      return NextResponse.json({ announcements: [] })
    }

    // Get all active announcements (let frontend handle expiration filtering)
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:users!announcements_author_id_fkey(name, email)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ announcements: [] })
    }

    // Filter announcements based on target audience
    const relevantAnnouncements = announcements.filter(announcement => {
      try {
        const targetAudience: AnnouncementAudience = announcement.target_audience
        return matchesAnnouncementAudience(userProfile, targetAudience)
      } catch (error) {
        console.error('Error parsing target audience:', error)
        return false
      }
    })

    // Format the response
    const formattedAnnouncements = relevantAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      author_name: announcement.author?.name || announcement.author?.email || 'Unknown',
      created_at: announcement.created_at,
      expires_at: announcement.expires_at
    }))

    return NextResponse.json({ announcements: formattedAnnouncements })
  } catch (error) {
    console.error('Error in GET /api/announcements/dashboard:', error)
    return NextResponse.json({ announcements: [] })
  }
}

