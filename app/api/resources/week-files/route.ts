import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user profile from query params
    const { searchParams } = new URL(request.url)
    const roleType = searchParams.get('role_type')
    const university = searchParams.get('university')
    const studyYear = searchParams.get('study_year')
    const foundationYear = searchParams.get('foundation_year')

    // Get the last two weeks date range
    const now = new Date()
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(now.getDate() - 14) // Last 14 days
    twoWeeksAgo.setHours(0, 0, 0, 0)
    
    const today = new Date(now)
    today.setHours(23, 59, 59, 999)

    // Fetch resources that are linked to events from the last two weeks
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .gte('teaching_date', twoWeeksAgo.toISOString().split('T')[0])
      .lte('teaching_date', today.toISOString().split('T')[0])
      .order('teaching_date', { ascending: false })

    if (error) {
      console.error('Error fetching week files:', error)
      return NextResponse.json({ files: [] }, { status: 200 })
    }

    // Fetch linked events for each resource and filter based on user profile
    const resourcesWithEvents = await Promise.all(
      (resources || []).map(async (resource: any) => {
        // Get linked events for this resource
        const { data: linkedEvents } = await supabase
          .from('resource_events')
          .select('event_id')
          .eq('resource_id', resource.id)

        if (!linkedEvents || linkedEvents.length === 0) {
          return null // Exclude resources without linked events
        }

        // Fetch event details with categories
        const eventIds = linkedEvents.map(le => le.event_id)
        const { data: eventDetails } = await supabase
          .from('events_with_details')
          .select('id, title, date, start_time, location_name')
          .in('id', eventIds)

        if (!eventDetails || eventDetails.length === 0) {
          return null
        }

        // For each event, fetch its categories
        const eventsWithCategories = await Promise.all(
          eventDetails.map(async (event: any) => {
            const { data: eventCategories } = await supabase
              .from('events_categories')
              .select(`
                category_id,
                categories (
                  id,
                  name,
                  target_audience
                )
              `)
              .eq('event_id', event.id)

            return {
              ...event,
              categories: eventCategories || []
            }
          })
        )

        // Filter events based on user profile
        const matchingEvents = eventsWithCategories.filter((event: any) => {
          if (!event.categories || event.categories.length === 0) {
            return true // Include events without categories
          }

          return event.categories.some((catLink: any) => {
            const category = catLink.categories
            if (!category || !category.target_audience) {
              return true // Include if no target audience specified
            }

            const targetAudience = category.target_audience

            // Match medical students
            if (roleType === 'medical_student' && university && studyYear) {
              const universityMatch = targetAudience.toLowerCase().includes(university.toLowerCase())
              const yearMatch = targetAudience.toLowerCase().includes(`year ${studyYear}`)
              return universityMatch && yearMatch
            }

            // Match foundation doctors
            if (roleType === 'foundation_doctor' && foundationYear) {
              const fyMatch = targetAudience.toLowerCase().includes(foundationYear.toLowerCase())
              return fyMatch
            }

            // For other roles, show all events
            if (roleType && roleType !== 'medical_student' && roleType !== 'foundation_doctor') {
              return true
            }

            return false
          })
        })

        // Only include resource if it has at least one matching event
        if (matchingEvents.length === 0) {
          return null
        }

        return {
          ...resource,
          linked_events: matchingEvents.map((event: any) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            start_time: event.start_time,
            location_name: event.location_name
          }))
        }
      })
    )

    // Helper function to convert MIME type to user-friendly file type
    const getFileTypeFromMime = (mimeType: string) => {
      if (!mimeType) return 'file'
      
      const type = mimeType.toLowerCase()
      if (type.includes('pdf')) return 'pdf'
      if (type.includes('powerpoint') || type.includes('presentation')) return 'presentation'
      if (type.includes('word') || type.includes('document')) return 'document'
      if (type.includes('excel') || type.includes('spreadsheet')) return 'spreadsheet'
      if (type.includes('image')) return 'image'
      if (type.includes('video')) return 'video'
      if (type.includes('audio')) return 'audio'
      if (type.includes('zip') || type.includes('archive')) return 'archive'
      return 'file'
    }

    // Helper function to format file size (same as downloads page)
    const formatFileSizeBytes = (bytes: number | string): string => {
      if (!bytes) return '0 Bytes'
      
      let numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
      if (isNaN(numBytes) || numBytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(numBytes) / Math.log(k))
      return Math.round(numBytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }


    // Filter out null values and transform
    const transformedFiles = resourcesWithEvents
      .filter(resource => resource !== null)
      .map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        fileType: getFileTypeFromMime(resource.file_type),
        fileSize: formatFileSizeBytes(resource.file_size),
        uploadDate: resource.upload_date,
        teachingDate: resource.teaching_date,
        taughtBy: resource.taught_by,
        downloadUrl: resource.download_url,
        views: resource.views || 0,
        uploadedBy: resource.uploaded_by,
        linkedEvents: resource.linked_events || []
      }))

    return NextResponse.json({ files: transformedFiles })
  } catch (error) {
    console.error('Error in week-files API:', error)
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}
