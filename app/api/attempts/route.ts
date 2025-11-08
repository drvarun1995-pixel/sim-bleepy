import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { awardScenarioXP, updateDailyStreak, checkAchievements } from '@/lib/gamification'

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
    const { attemptId, endTime, duration, scores, overallBand, transcript } = body

    console.log('Attempts PUT request body:', {
      attemptId,
      endTime,
      duration,
      scores,
      overallBand,
      transcript: transcript ? `${transcript.length} messages` : 'no transcript'
    })

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
        overall_band: overallBand,
        transcript: transcript
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating attempt:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update attempt', 
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 })
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

    // Award gamification rewards if scenario was completed successfully
    if (scores && overallBand) {
      console.log('🎮 Starting gamification rewards process...')
      console.log('Scores:', scores)
      console.log('Overall Band:', overallBand)
      
      try {
        // Get user ID and attempt details for gamification
        const { data: attemptData, error: attemptError } = await supabaseAdmin
          .from('attempts')
          .select('user_id, station_slug, start_time')
          .eq('id', attemptId)
          .single()

        console.log('Attempt data:', attemptData)
        console.log('Attempt error:', attemptError)

        if (!attemptError && attemptData) {
          // Calculate score percentage from the scores object
          const scoresData = scores as any
          const totalScore = scoresData?.totalScore || 0
          const maxScore = scoresData?.maxScore || 12
          const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
          const scenarioDuration = duration || 0

          console.log('🎯 Gamification data:', {
            userId: attemptData.user_id,
            stationSlug: attemptData.station_slug,
            totalScore: totalScore,
            maxScore: maxScore,
            scorePercentage: score,
            duration: scenarioDuration
          })

          // Award scenario XP using application logic (with RPC fallback)
          console.log('🏆 Awarding scenario XP via application logic')
          await awardScenarioXP(
            attemptData.user_id,
            attemptData.station_slug,
            score,
            scenarioDuration
          )

          // Update daily streaks and achievements
          console.log('📅 Updating daily streak')
          await updateDailyStreak(attemptData.user_id)

          console.log('🎖️ Running post-attempt achievement checks')
          await checkAchievements({ userId: attemptData.user_id })

          console.log('✅ Gamification rewards completed successfully!')
        } else {
          console.error('❌ Failed to get attempt data:', attemptError)
        }
      } catch (gamificationError) {
        console.error('❌ Error in gamification rewards:', gamificationError)
        // Don't fail the attempt update if gamification fails
      }
    } else {
      console.log('⚠️ Skipping gamification - no scores or overall band')
      console.log('Scores:', scores)
      console.log('Overall Band:', overallBand)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in attempts update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
