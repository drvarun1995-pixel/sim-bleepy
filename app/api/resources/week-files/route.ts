import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {

    // Get the current week's date range
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999)

    // Fetch resources that are linked to events happening this week
    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        category,
        file_type,
        file_size,
        upload_date,
        teaching_date,
        taught_by,
        download_url,
        views,
        uploaded_by,
        linked_events:resources_events (
          event_id,
          events (
            id,
            title,
            date,
            start_time,
            location_name
          )
        )
      `)
      .gte('teaching_date', startOfWeek.toISOString().split('T')[0])
      .lte('teaching_date', endOfWeek.toISOString().split('T')[0])
      .order('teaching_date', { ascending: true })

    if (error) {
      console.error('Error fetching week files:', error)
      return NextResponse.json({ files: [] }, { status: 200 })
    }

    // Transform the data to match the expected interface
    const transformedFiles = resources?.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      fileType: resource.file_type,
      fileSize: resource.file_size,
      uploadDate: resource.upload_date,
      teachingDate: resource.teaching_date,
      taughtBy: resource.taught_by,
      downloadUrl: resource.download_url,
      views: resource.views || 0,
      uploadedBy: resource.uploaded_by,
      linkedEvents: resource.linked_events?.map(link => ({
        id: link.events.id,
        title: link.events.title,
        date: link.events.date,
        start_time: link.events.start_time,
        location_name: link.events.location_name
      })) || []
    })) || []

    return NextResponse.json({ files: transformedFiles })
  } catch (error) {
    console.error('Error in week-files API:', error)
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}
