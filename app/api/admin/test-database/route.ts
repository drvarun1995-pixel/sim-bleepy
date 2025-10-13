import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Test database connections and data
    const results: any = {
      adminCheck: {
        email: session.user.email,
        isAdmin,
        adminEmails
      },
      database: {}
    }

    // Test users table - get actual count, not just limited sample
    try {
      // Get total count of users
      const { count: totalUsers, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      // Get sample of users for display
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, auth_provider, created_at')
        .limit(10)
      
      results.database.users = {
        count: totalUsers || 0, // Use actual count, not sample length
        error: usersError?.message || countError?.message || null,
        sample: users?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.users = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test attempts table - get actual count, not just limited sample
    try {
      // Get total count of attempts
      const { count: totalAttempts, error: countError } = await supabaseAdmin
        .from('attempts')
        .select('*', { count: 'exact', head: true })
      
      // Get sample of attempts for display
      const { data: attempts, error: attemptsError } = await supabaseAdmin
        .from('attempts')
        .select('id, user_id, station_slug, start_time')
        .limit(10)
      
      results.database.attempts = {
        count: totalAttempts || 0, // Use actual count, not sample length
        error: attemptsError?.message || countError?.message || null,
        sample: attempts?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.attempts = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test stations table - use configured stations count like user stats
    try {
      const { data: stations, error: stationsError } = await supabaseAdmin
        .from('stations')
        .select('slug, title')
        .limit(10)
      
      // Import stationConfigs to get the actual configured count
      const { stationConfigs } = await import('@/utils/stationConfigs')
      const configuredStationsCount = Object.keys(stationConfigs).length
      
      results.database.stations = {
        count: configuredStationsCount, // Use configured count instead of database count
        error: stationsError?.message || null,
        sample: stations?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.stations = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test newsletter_signups table
    try {
      const { data: newsletter, error: newsletterError } = await supabaseAdmin
        .from('newsletter_signups')
        .select('email, source, created_at')
        .limit(10)
      
      results.database.newsletter = {
        count: newsletter?.length || 0,
        error: newsletterError?.message || null,
        sample: newsletter?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.newsletter = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Return simplified format for admin dashboard
    return NextResponse.json({
      users: results.database.users?.count || 0,
      stations: results.database.stations?.count || 0,
      attempts: results.database.attempts?.count || 0,
      profiles: results.database.users?.count || 0, // Using users count as proxy for profiles
      success: !results.database.users?.error && !results.database.stations?.error && !results.database.attempts?.error,
      error: results.database.users?.error || results.database.stations?.error || results.database.attempts?.error || null
    })
  } catch (error) {
    console.error('Error in test database API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
