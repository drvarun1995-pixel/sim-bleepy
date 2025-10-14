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
            location_name,
            categories:events_categories (
              category:categories (
                id,
                name,
                target_audience
              )
            )
          )
        )
      `)
      .gte('teaching_date', twoWeeksAgo.toISOString().split('T')[0])
      .lte('teaching_date', today.toISOString().split('T')[0])
      .order('teaching_date', { ascending: false })

    if (error) {
      console.error('Error fetching week files:', error)
      return NextResponse.json({ files: [] }, { status: 200 })
    }

    // Filter resources based on user profile
    // Only show files that are linked to events matching the user's profile
    const filteredResources = resources?.filter(resource => {
      // Must have at least one linked event
      if (!resource.linked_events || resource.linked_events.length === 0) {
        return false
      }

      // Check if any linked event matches the user's profile
      const hasMatchingEvent = resource.linked_events.some(link => {
        const event = link.events
        if (!event || !event.categories) return false

        // Check each category of the event
        return event.categories.some(catLink => {
          const category = catLink.category
          if (!category || !category.target_audience) return true // Include if no target audience specified

          const targetAudience = category.target_audience

          // Match medical students
          if (roleType === 'medical_student' && university && studyYear) {
            // Check if target audience matches university and year
            // Format: "ARU Year 5", "UEA Year 4", etc.
            const universityMatch = targetAudience.toLowerCase().includes(university.toLowerCase())
            const yearMatch = targetAudience.toLowerCase().includes(`year ${studyYear}`)
            return universityMatch && yearMatch
          }

          // Match foundation doctors
          if (roleType === 'foundation_doctor' && foundationYear) {
            // Check if target audience includes foundation year
            // Format: "FY1", "FY2", "Foundation Year 1", etc.
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

      return hasMatchingEvent
    }) || []

    // Transform the data to match the expected interface
    const transformedFiles = filteredResources.map(resource => ({
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
    }))

    return NextResponse.json({ files: transformedFiles })
  } catch (error) {
    console.error('Error in week-files API:', error)
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}
