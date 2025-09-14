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

    // Test users table
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, auth_provider, created_at')
        .limit(10)
      
      results.database.users = {
        count: users?.length || 0,
        error: usersError?.message || null,
        sample: users?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.users = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test attempts table
    try {
      const { data: attempts, error: attemptsError } = await supabaseAdmin
        .from('attempts')
        .select('id, user_id, station_slug, start_time')
        .limit(10)
      
      results.database.attempts = {
        count: attempts?.length || 0,
        error: attemptsError?.message || null,
        sample: attempts?.slice(0, 3) || []
      }
    } catch (error) {
      results.database.attempts = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test stations table
    try {
      const { data: stations, error: stationsError } = await supabaseAdmin
        .from('stations')
        .select('slug, title')
        .limit(10)
      
      results.database.stations = {
        count: stations?.length || 0,
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

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in test database API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
