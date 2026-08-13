import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { isExcludedFromLearnerLists } from '@/lib/year-progression'

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

    const learnerFilter = 'role.eq.student,role_type.eq.medical_student,role_type.eq.foundation_doctor'
    const nonLearnerRoleTypes = new Set([
      'registrar',
      'consultant',
      'clinical_fellow',
      'specialty_doctor',
    ])
    const baseSelect =
      'id, email, name, role, university, study_year, foundation_year, role_type, created_at, email_verified'

    const inferUniversityFromEmail = (email: string | null | undefined): 'ARU' | 'UCL' | null => {
      const lower = (email || '').toLowerCase()
      if (lower.includes('aru.ac.uk') || lower.includes('anglia.ac.uk')) return 'ARU'
      if (lower.includes('ucl.ac.uk')) return 'UCL'
      return null
    }

    const isCohortsLearner = (user: { role?: string | null; role_type?: string | null }) => {
      const roleType = (user.role_type || '').trim()
      if (nonLearnerRoleTypes.has(roleType)) return false
      if (user.role && user.role !== 'student' && roleType !== 'medical_student' && roleType !== 'foundation_doctor') {
        return false
      }
      return true
    }

    // academic_status / academic_cohort exist only after the year-progression SQL.
    // If that select fails, retry without those columns so FY1/FY2 is not dropped.
    let { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`${baseSelect}, academic_status, academic_cohort`)
      .or(learnerFilter)
      .order('name', { ascending: true })

    if (usersError) {
      const fallback = await supabaseAdmin
        .from('users')
        .select(baseSelect)
        .or(learnerFilter)
        .order('name', { ascending: true })
      users = (fallback.data || []).map((row) => ({
        ...row,
        academic_status: null,
        academic_cohort: null,
      }))
      usersError = fallback.error
    }

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Process users into cohorts
    const aruUsers: any[] = []
    const uclUsers: any[] = []
    const fyUsers: any[] = []
    const otherUsers: any[] = []
    const byCohort: Record<string, number> = {}

    const includeOnCohortsPage = (user: { academic_status?: string | null }) => {
      const status = user.academic_status
      if (!status || status === 'active' || status === 'graduated') return true
      return false
    }

    const resolveFoundationYear = (user: {
      foundation_year?: string | null
      study_year?: string | null
    }) => {
      const fy = (user.foundation_year || '').trim()
      if (fy === 'FY1' || fy === 'FY2') return fy
      const studyYear = (user.study_year || '').trim()
      if (studyYear === 'FY1' || studyYear === 'FY2') return studyYear
      return fy || null
    }

    users?.forEach(user => {
      if (isExcludedFromLearnerLists(user)) return
      if (!includeOnCohortsPage(user)) return
      if (!isCohortsLearner(user)) return
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name || 'N/A',
        university: user.university || null,
        study_year: user.study_year || null,
        foundation_year: resolveFoundationYear(user),
        role_type: user.role_type || null,
        created_at: user.created_at,
        email_verified: user.email_verified || false,
        academic_status: user.academic_status || 'active',
        academic_cohort: user.academic_cohort || null,
        inferred: false
      }

      if (!userData.university && user.email) {
        const inferred = inferUniversityFromEmail(user.email)
        if (inferred) {
          userData.university = inferred
          userData.inferred = true
        }
      }

      const isFy =
        userData.role_type === 'foundation_doctor' ||
        userData.foundation_year === 'FY1' ||
        userData.foundation_year === 'FY2'

      if (isFy) {
        fyUsers.push(userData)
      } else if (userData.university === 'ARU') {
        aruUsers.push(userData)
      } else if (userData.university === 'UCL') {
        uclUsers.push(userData)
      } else {
        otherUsers.push(userData)
      }

      const cohortKey = userData.academic_cohort || 'unassigned'
      byCohort[cohortKey] = (byCohort[cohortKey] || 0) + 1
    })

    const aru = aruUsers.length
    const ucl = uclUsers.length
    const fy = fyUsers.length
    const other = otherUsers.length
    const total = aru + ucl + fy + other
    const verified = [...aruUsers, ...uclUsers, ...fyUsers, ...otherUsers].filter(
      (u) => u.email_verified
    ).length

    // Calculate byYear statistics
    const byYear: { aru: Record<string, number>, ucl: Record<string, number>, fy: Record<string, number> } = {
      aru: {},
      ucl: {},
      fy: {}
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

    fyUsers.forEach(user => {
      const year = user.foundation_year || 'unknown'
      byYear.fy[year] = (byYear.fy[year] || 0) + 1
    })

    const { data: cohortRows } = await supabaseAdmin
      .from('academic_cohorts')
      .select('label, is_current, suppress_emails')
      .order('label', { ascending: true })

    return NextResponse.json({
      stats: {
        total,
        aru,
        ucl,
        fy,
        other,
        verified,
        byYear,
        byCohort
      },
      cohorts: cohortRows || Object.keys(byCohort).map((label) => ({
        label,
        is_current: label === '25-26',
        suppress_emails: label === '25-26',
      })),
      aruUsers,
      uclUsers,
      fyUsers,
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
