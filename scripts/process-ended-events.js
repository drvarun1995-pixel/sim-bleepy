// Script to process ended events and generate certificates
// This should be run as a cron job every hour or daily

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function processEndedEvents() {
  try {
    console.log('🕐 Processing ended events for certificate generation...')
    
    // Get current time
    const now = new Date()
    const currentTime = now.toISOString()
    
    // Find events that have ended and have auto-generate certificates enabled but don't require feedback
    const { data: endedEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id, title, date, end_time, auto_generate_certificate, 
        feedback_required_for_certificate, certificate_template_id, 
        certificate_auto_send_email
      `)
      .eq('auto_generate_certificate', true)
      .eq('feedback_required_for_certificate', false)
      .not('certificate_template_id', 'is', null)
      .lte('date', now.toISOString().split('T')[0]) // Events that ended today or before
    
    if (eventsError) {
      console.error('Error fetching ended events:', eventsError)
      return
    }

    if (!endedEvents || endedEvents.length === 0) {
      console.log('✅ No ended events found for certificate generation')
      return
    }

    console.log(`🔍 Found ${endedEvents.length} ended events to process`)

    let processedCount = 0
    const results = []

    for (const event of endedEvents) {
      try {
        // Check if event has actually ended (considering end_time)
        const eventEndTime = new Date(`${event.date}T${event.end_time}`)
        if (eventEndTime > now) {
          console.log(`⏰ Event ${event.title} hasn't ended yet (ends at ${eventEndTime.toISOString()})`)
          continue
        }

        // Check if certificates have already been generated for this event
        const { data: existingCertificates, error: certCheckError } = await supabase
          .from('certificates')
          .select('id')
          .eq('event_id', event.id)
          .limit(1)

        if (certCheckError) {
          console.error(`Error checking existing certificates for event ${event.id}:`, certCheckError)
          continue
        }

        if (existingCertificates && existingCertificates.length > 0) {
          console.log(`✅ Certificates already generated for event ${event.title}`)
          continue
        }

        // Get all attendees for this event
        const { data: attendees, error: attendeesError } = await supabase
          .from('event_bookings')
          .select(`
            id, user_id, status, checked_in,
            users (id, name, email)
          `)
          .eq('event_id', event.id)
          .eq('checked_in', true)
          .in('status', ['attended', 'confirmed'])

        if (attendeesError) {
          console.error(`Error fetching attendees for event ${event.id}:`, attendeesError)
          continue
        }

        if (!attendees || attendees.length === 0) {
          console.log(`⚠️ No attendees found for event ${event.title}`)
          continue
        }

        console.log(`📋 Processing ${attendees.length} attendees for event ${event.title}`)

        // Generate certificates for each attendee
        let certificatesGenerated = 0
        for (const attendee of attendees) {
          try {
            const certificateResponse = await fetch(`${nextAuthUrl}/api/certificates/auto-generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                eventId: event.id,
                userId: attendee.user_id,
                bookingId: attendee.id,
                templateId: event.certificate_template_id,
                sendEmail: event.certificate_auto_send_email
              })
            })

            if (certificateResponse.ok) {
              certificatesGenerated++
              console.log(`✅ Certificate generated for ${attendee.users?.name || 'Unknown'}`)
            } else {
              const errorData = await certificateResponse.json()
              console.error(`❌ Failed to generate certificate for ${attendee.users?.name}:`, errorData.error)
            }
          } catch (certError) {
            console.error(`❌ Error generating certificate for ${attendee.users?.name}:`, certError)
          }
        }

        results.push({
          eventId: event.id,
          eventTitle: event.title,
          attendeesCount: attendees.length,
          certificatesGenerated
        })

        processedCount++
        console.log(`✅ Processed event ${event.title}: ${certificatesGenerated}/${attendees.length} certificates generated`)

      } catch (eventError) {
        console.error(`❌ Error processing event ${event.id}:`, eventError)
        results.push({
          eventId: event.id,
          eventTitle: event.title,
          error: eventError.message
        })
      }
    }

    console.log(`🎉 Processed ${processedCount} events for certificate generation`)
    console.log('Results:', results)

  } catch (error) {
    console.error('Error in process-ended-events:', error)
  }
}

// Run the script
processEndedEvents()
