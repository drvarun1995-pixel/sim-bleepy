import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Debug: Check what data we can access
    const debugInfo: any = {}

    // 1. Check users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .limit(10)

    debugInfo.users = {
      count: users?.length || 0,
      error: usersError,
      sample: users?.slice(0, 3)
    }

    // 2. Check user_levels table
    const { data: userLevels, error: levelsError } = await supabaseAdmin
      .from('user_levels')
      .select('*')
      .limit(10)

    debugInfo.userLevels = {
      count: userLevels?.length || 0,
      error: levelsError,
      sample: userLevels?.slice(0, 3)
    }

    // 3. Check joined query
    const { data: joinedData, error: joinedError } = await supabaseAdmin
      .from('user_levels')
      .select(`
        *,
        users!inner (
          id,
          email,
          name
        )
      `)
      .limit(10)

    debugInfo.joinedData = {
      count: joinedData?.length || 0,
      error: joinedError,
      sample: joinedData?.slice(0, 3)
    }

    // 4. Check if user_levels table exists
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_levels', 'users', 'achievements'])

    debugInfo.tables = {
      exists: tableInfo,
      error: tableError
    }

    return NextResponse.json({
      message: 'Leaderboard debug info',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug leaderboard error:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}



