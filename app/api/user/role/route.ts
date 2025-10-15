import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { USER_ROLES } from '@/lib/roles'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/role
 * Returns the current user's role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        role: USER_ROLES.STUDENT,
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Fetch user role from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !user) {
      console.error('Error fetching user role:', error)
      // Default to student role if user not found or error
      return NextResponse.json({ 
        role: USER_ROLES.STUDENT,
        email: session.user.email
      }, { status: 200 })
    }

    return NextResponse.json({ 
      role: user.role || USER_ROLES.STUDENT,
      email: session.user.email
    }, { status: 200 })

  } catch (error) {
    console.error('User role API error:', error)
    return NextResponse.json({ 
      role: USER_ROLES.STUDENT,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}










