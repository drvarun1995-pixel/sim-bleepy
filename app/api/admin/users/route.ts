import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendRoleChangeEmail } from '@/lib/email'
import { getRoleDisplayName } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin or meded_team
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user || (user.role !== 'admin' && user.role !== 'meded_team')) {
      return NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 });
    }

    console.log('Admin/MedEd Team check - allowing access for:', session.user.email)

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // Default to 1000 users for analytics
    const offset = (page - 1) * limit
    const skipStats =
      searchParams.get('lite') === '1' || searchParams.get('skipStats') === '1'
    const includeWalkIn =
      searchParams.get('includeWalkIn') === '1' || searchParams.get('includeWalkIn') === 'true'
    const userColumns =
      'id, email, name, role, role_type, university, study_year, foundation_year, academic_cohort, academic_status, created_at, email_verified, last_login, login_count, account_origin'

    let users
    let usersError = null

    // PostgREST caps a single response at 1000 rows unless we page explicitly.
    if (skipStats && limit >= 1000) {
      const pageSize = 1000
      const maxUsers = Math.min(limit, 5000)
      const collected: any[] = []
      for (let from = 0; from < maxUsers; from += pageSize) {
        const to = Math.min(from + pageSize - 1, maxUsers - 1)
        const { data, error } = await supabase
          .from('users')
          .select(userColumns)
          .order('created_at', { ascending: false })
          .range(from, to)
        if (error) {
          usersError = error
          break
        }
        collected.push(...(data || []))
        if (!data || data.length < pageSize) break
      }
      users = collected
    } else {
      let query = supabase
        .from('users')
        .select(userColumns)
        .order('created_at', { ascending: false })

      if (limit < 1000) {
        query = query.range(offset, offset + limit - 1)
      }

      const result = await query
      users = result.data
      usersError = result.error
    }

    if (usersError && String(usersError.message || '').includes('account_origin')) {
      const fallbackColumns =
        'id, email, name, role, role_type, university, study_year, foundation_year, academic_cohort, academic_status, created_at, email_verified, last_login, login_count'
      const fallback = await supabase
        .from('users')
        .select(fallbackColumns)
        .order('created_at', { ascending: false })
      users = fallback.data
      usersError = fallback.error
    }

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    console.log('Found users:', users?.length || 0)
    console.log('Limit requested:', limit)
    console.log('Lite fetch:', skipStats)

    const userStatsMap = new Map()
    if (!skipStats) {
      const { data: attemptStats, error: statsError } = await supabase
        .from('attempts')
        .select(`
          user_id,
          overall_band,
          scores
        `)

      if (statsError) {
        console.error('Error fetching attempt statistics:', statsError)
      }

      if (attemptStats) {
        attemptStats.forEach(attempt => {
          const userId = attempt.user_id
          if (!userStatsMap.has(userId)) {
            userStatsMap.set(userId, {
              totalAttempts: 0,
              completedAttempts: 0,
              totalScore: 0
            })
          }

          const stats = userStatsMap.get(userId)
          stats.totalAttempts++

          if (attempt.overall_band) {
            stats.completedAttempts++
            const scores = attempt.scores as any
            stats.totalScore += scores?.overall_pct || 0
          }
        })
      }
    }

    const walkInHiddenCount = (users || []).filter((user) => user.account_origin === 'walk_in_guest').length
    const visibleUsers = includeWalkIn
      ? users || []
      : (users || []).filter((user) => user.account_origin !== 'walk_in_guest')

    const usersWithStats = visibleUsers.map(user => {
      const stats = userStatsMap.get(user.id) || { totalAttempts: 0, completedAttempts: 0, totalScore: 0 }
      const averageScore = stats.completedAttempts > 0 
        ? stats.totalScore / stats.completedAttempts 
        : 0

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        role_type: user.role_type || null,
        university: user.university || null,
        study_year: user.study_year || null,
        foundation_year: user.foundation_year || null,
        academic_cohort: user.academic_cohort || null,
        academic_status: user.academic_status || null,
        createdAt: user.created_at,
        lastLogin: user.last_login || null,
        loginCount: user.login_count || 0,
        totalAttempts: stats.totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
        email_verified: user.email_verified || false,
        account_origin: user.account_origin || null,
      }
    })

    return NextResponse.json({
      users: usersWithStats,
      walkInHiddenCount: includeWalkIn ? 0 : walkInHiddenCount,
    })

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/admin/users - Role update request received')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('PUT /api/admin/users - Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('PUT /api/admin/users - Session found for:', session.user.email)

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin or meded_team
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user || (user.role !== 'admin' && user.role !== 'meded_team')) {
      return NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 });
    }

    const { userId, role } = await request.json()
    console.log('PUT /api/admin/users - Request body:', { userId, role })

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    if (!['admin', 'educator', 'student', 'meded_team', 'ctf'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    console.log('Role update requested:', { userId, role })

    // Get current user data before update (for email notification)
    const { data: currentUser, error: getCurrentError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (getCurrentError || !currentUser) {
      console.error('PUT /api/admin/users - Error fetching current user:', getCurrentError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const oldRole = currentUser.role || 'student'

    // Update the role in the users table
    console.log('PUT /api/admin/users - Attempting to update user role in database')
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, role')

    if (updateError) {
      console.error('PUT /api/admin/users - Error updating user role:', updateError)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('PUT /api/admin/users - User not found with ID:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('PUT /api/admin/users - Role updated successfully:', updateResult[0])

    // Send role change email notification
    try {
      await sendRoleChangeEmail({
        email: currentUser.email,
        name: currentUser.name,
        oldRole: getRoleDisplayName(oldRole),
        newRole: getRoleDisplayName(role)
      })
      console.log('PUT /api/admin/users - Role change email sent to:', currentUser.email)
    } catch (emailError) {
      console.error('PUT /api/admin/users - Error sending role change email:', emailError)
      // Don't fail the request if email fails - just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User role updated successfully. Notification email sent.',
      user: updateResult[0]
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
