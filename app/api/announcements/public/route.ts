import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/announcements/public - Get public announcements for general audience
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  try {
    const supabase = createClient()

    // Get all active announcements that are public (target audience is 'all')
    // and haven't expired, ordered by priority and creation date
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
      console.error('Error fetching public announcements:', error)
      return NextResponse.json({ announcements: [] })
    }

    // Filter announcements for public audience (target audience type is 'all')
    const now = new Date()
    const publicAnnouncements = announcements.filter(announcement => {
      try {
        const targetAudience = announcement.target_audience
        if (targetAudience && typeof targetAudience === 'object' && targetAudience.type === 'all') {
          // Check if announcement hasn't expired
          if (announcement.expires_at && new Date(announcement.expires_at) <= now) {
            return false
          }
          return true
        }
        return false
      } catch (error) {
        console.error('Error parsing target audience:', error)
        return false
      }
    })

    // Format the response
    const formattedAnnouncements = publicAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      author_name: announcement.author?.name || announcement.author?.email || 'Bleepy Team',
      created_at: announcement.created_at,
      expires_at: announcement.expires_at,
      is_feature_announcement: announcement.title.toLowerCase().includes('feature') || 
                              announcement.content.toLowerCase().includes('new feature') ||
                              announcement.title.toLowerCase().includes('update') ||
                              announcement.title.toLowerCase().includes('improvement')
    }))

    // Apply limit if specified
    const limitedAnnouncements = limit ? formattedAnnouncements.slice(0, parseInt(limit)) : formattedAnnouncements;

    return NextResponse.json({ announcements: limitedAnnouncements })
  } catch (error) {
    console.error('Error in GET /api/announcements/public:', error)
    return NextResponse.json({ announcements: [] })
  }
}
