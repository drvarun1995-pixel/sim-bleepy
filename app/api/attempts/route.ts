import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stationSlug, startTime } = body

    if (!stationSlug || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, ensure the user exists in our database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    let userId: string

    if (userError || !existingUser) {
      // Create user if they don't exist
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email
        })
        .select('id')
        .single()

      if (createUserError || !newUser) {
        console.error('Error creating user:', createUserError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    // Create the attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .insert({
        user_id: userId,
        station_slug: stationSlug,
        start_time: startTime
      })
      .select('id')
      .single()

    if (attemptError || !attempt) {
      console.error('Error creating attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 })
    }

    // Create a start event
    await supabaseAdmin
      .from('attempt_events')
      .insert({
        attempt_id: attempt.id,
        type: 'session_start',
        timestamp: startTime,
        meta: { station_slug: stationSlug }
      })

    return NextResponse.json({ 
      success: true, 
      attemptId: attempt.id 
    })
  } catch (error) {
    console.error('Error in attempts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attemptId, endTime, duration, scores, overallBand } = body

    if (!attemptId || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update the attempt
    const { error: updateError } = await supabaseAdmin
      .from('attempts')
      .update({
        end_time: endTime,
        duration: duration,
        scores: scores,
        overall_band: overallBand
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating attempt:', updateError)
      return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 })
    }

    // Create an end event
    await supabaseAdmin
      .from('attempt_events')
      .insert({
        attempt_id: attemptId,
        type: 'session_end',
        timestamp: endTime,
        meta: { 
          duration: duration,
          scores: scores,
          overall_band: overallBand
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in attempts update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
