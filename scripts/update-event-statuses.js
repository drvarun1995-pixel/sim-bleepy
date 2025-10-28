// Script to update event statuses (scheduled → in-progress → completed)
// This should be run as a cron job every 15-30 minutes

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateEventStatuses() {
  try {
    console.log('🔄 Updating event statuses...')
    
    const now = new Date()
    const currentTime = now.toISOString()
    const today = now.toISOString().split('T')[0]

    // Update events that should be in-progress (started but not ended)
    const { data: inProgressEvents, error: inProgressError } = await supabase
      .from('events')
      .update({ 
        event_status: 'in-progress',
        updated_at: currentTime
      })
      .eq('event_status', 'scheduled')
      .eq('date', today)
      .lte('start_time', now.toTimeString().slice(0, 8)) // Current time >= start time
      .gt('end_time', now.toTimeString().slice(0, 8)) // Current time < end time
      .select('id, title')

    if (inProgressError) {
      console.error('Error updating in-progress events:', inProgressError)
    } else {
      console.log(`✅ Updated ${inProgressEvents?.length || 0} events to in-progress status`)
    }

    // Update events that should be completed (ended)
    const { data: completedEvents, error: completedError } = await supabase
      .from('events')
      .update({ 
        event_status: 'completed',
        updated_at: currentTime
      })
      .in('event_status', ['scheduled', 'in-progress'])
      .or(`date.lt.${today},and(date.eq.${today},end_time.lte.${now.toTimeString().slice(0, 8)})`)
      .select('id, title')

    if (completedError) {
      console.error('Error updating completed events:', completedError)
    } else {
      console.log(`✅ Updated ${completedEvents?.length || 0} events to completed status`)
    }

    // Trigger certificate generation for completed events with auto-generate enabled
    if (completedEvents && completedEvents.length > 0) {
      console.log('🔄 Triggering certificate generation for completed events...')
      
      try {
        const certResponse = await fetch(`${nextAuthUrl}/api/events/process-ended-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (certResponse.ok) {
          const certData = await certResponse.json()
          console.log('✅ Certificate generation triggered:', certData.message)
        } else {
          console.error('❌ Failed to trigger certificate generation:', await certResponse.text())
        }
      } catch (certError) {
        console.error('❌ Error triggering certificate generation:', certError)
      }
    }

    console.log('🎉 Event status update completed')

  } catch (error) {
    console.error('Error updating event statuses:', error)
  }
}

// Run the script
updateEventStatuses()
