import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, university, year, created_at')
      .eq('email', session.user.email)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'student',
        university: user.university || '',
        year: user.year || '',
        createdAt: user.created_at
      }
    })

  } catch (error) {
    console.error('Error in GET /api/user/profile:', error)
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

    const { name, role, university, year } = await request.json()

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (role && !['student', 'educator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        role: role || 'student',
        university: university?.trim() || null,
        year: year || null,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select('id, email, name, role, university, year, created_at')
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        university: updatedUser.university || '',
        year: updatedUser.year || '',
        createdAt: updatedUser.created_at
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
