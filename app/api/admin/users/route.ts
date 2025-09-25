import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Check if user is admin - for now, we'll allow any authenticated user to access this
    // In production, you might want to add a role system
    console.log('Admin check - allowing access for:', session.user.email)

    // Fetch all users from users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    console.log('Found users:', users?.length || 0)

    // Get attempt statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get user's attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('attempts')
          .select('overall_band, scores')
          .eq('user_id', user.id)

        if (attemptsError) {
          console.error('Error fetching attempts for user:', user.id, attemptsError)
        }

        // Calculate statistics
        const totalAttempts = attempts?.length || 0
        const completedAttempts = attempts?.filter(a => a.overall_band) || []
        const averageScore = completedAttempts.length > 0 
          ? completedAttempts.reduce((sum, attempt) => {
              const scores = attempt.scores as any
              return sum + (scores?.overall_pct || 0)
            }, 0) / completedAttempts.length
          : 0

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'student', // Default role since we don't have roles in the users table yet
          createdAt: user.created_at,
          lastLogin: null, // We can add this field later
          totalAttempts,
          averageScore: Math.round(averageScore * 10) / 10
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // For now, allow any authenticated user to update roles
    // In production, you might want to add proper admin checks

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    if (!['admin', 'educator', 'student'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Since we don't have a role field in the users table yet,
    // we'll create a simple profiles table or add a role field
    // For now, let's just return success
    console.log('Role update requested:', { userId, role })

    // TODO: Add role field to users table or create profiles table
    // const { error: updateError } = await supabase
    //   .from('users')
    //   .update({ role })
    //   .eq('id', userId)

    return NextResponse.json({ success: true, message: 'User role update requested (not implemented yet)' })

  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
