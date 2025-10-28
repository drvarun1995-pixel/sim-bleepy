import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Updating event statuses...')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user permissions
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const now = new Date()
    const currentTime = now.toISOString()
    const today = now.toISOString().split('T')[0]

    // Update events that should be in-progress (started but not ended)
    const { data: inProgressEvents, error: inProgressError } = await supabaseAdmin
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
    const { data: completedEvents, error: completedError } = await supabaseAdmin
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
        const certResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/events/process-ended-events`, {
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

    return NextResponse.json({
      success: true,
      message: 'Event statuses updated successfully',
      inProgressCount: inProgressEvents?.length || 0,
      completedCount: completedEvents?.length || 0
    })

  } catch (error) {
    console.error('Error updating event statuses:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
