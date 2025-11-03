import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role - only admin, meded_team, and ctf can access
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all users with their university and study year information
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, university, study_year, role_type, created_at, email_verified')
      .eq('role', 'student') // Only get students
      .order('name', { ascending: true })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Process users into cohorts
    const aruUsers: any[] = []
    const uclUsers: any[] = []
    const otherUsers: any[] = []

    // Group users by university and infer missing data where possible
    users?.forEach(user => {
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name || 'N/A',
        university: user.university || null,
        study_year: user.study_year || null,
        role_type: user.role_type || null,
        created_at: user.created_at,
        email_verified: user.email_verified || false,
        inferred: false
      }

      // Infer university from email domain if missing
      if (!userData.university && user.email) {
        const emailDomain = user.email.toLowerCase()
        if (emailDomain.includes('@anglia.ac.uk') || emailDomain.includes('@aru.ac.uk')) {
          userData.university = 'ARU'
          userData.inferred = true
        } else if (emailDomain.includes('@ucl.ac.uk')) {
          userData.university = 'UCL'
          userData.inferred = true
        }
      }

      // Group users
      if (userData.university === 'ARU') {
        aruUsers.push(userData)
      } else if (userData.university === 'UCL') {
        uclUsers.push(userData)
      } else {
        otherUsers.push(userData)
      }
    })

    // Calculate statistics
    const total = users?.length || 0
    const aru = aruUsers.length
    const ucl = uclUsers.length
    const other = otherUsers.length
    const verified = users?.filter(u => u.email_verified).length || 0

    // Calculate byYear statistics
    const byYear: { aru: Record<string, number>, ucl: Record<string, number> } = {
      aru: {},
      ucl: {}
    }

    // Count ARU users by year
    aruUsers.forEach(user => {
      const year = user.study_year || 'unknown'
      byYear.aru[year] = (byYear.aru[year] || 0) + 1
    })

    // Count UCL users by year
    uclUsers.forEach(user => {
      const year = user.study_year || 'unknown'
      byYear.ucl[year] = (byYear.ucl[year] || 0) + 1
    })

    // Return the formatted data
    return NextResponse.json({
      stats: {
        total,
        aru,
        ucl,
        other,
        verified,
        byYear
      },
      aruUsers,
      uclUsers,
      otherUsers
    })

  } catch (error) {
    console.error('Error in GET /api/cohorts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
