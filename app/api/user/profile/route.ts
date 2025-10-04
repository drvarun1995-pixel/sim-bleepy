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

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id, email, name, role, university, year, created_at,
        role_type, study_year, foundation_year, hospital_trust, specialty,
        profile_completed, interests, onboarding_completed_at,
        profile_skipped_at, last_profile_prompt, show_all_events
      `)
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
        createdAt: user.created_at,
        // New onboarding fields
        role_type: user.role_type,
        study_year: user.study_year,
        foundation_year: user.foundation_year,
        hospital_trust: user.hospital_trust,
        specialty: user.specialty,
        profile_completed: user.profile_completed || false,
        interests: user.interests || [],
        onboarding_completed_at: user.onboarding_completed_at,
        profile_skipped_at: user.profile_skipped_at,
        last_profile_prompt: user.last_profile_prompt,
        show_all_events: user.show_all_events || false
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

    const body = await request.json()
    const {
      name,
      university,
      year,
      role_type,
      study_year,
      foundation_year,
      hospital_trust,
      specialty,
      interests,
      profile_completed,
      onboarding_completed_at,
      show_all_events
    } = body

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name?.trim() || null
    if (university !== undefined) updateData.university = university?.trim() || null
    if (year !== undefined) updateData.year = year || null
    if (role_type !== undefined) updateData.role_type = role_type || null
    if (study_year !== undefined) updateData.study_year = study_year || null
    if (foundation_year !== undefined) updateData.foundation_year = foundation_year || null
    if (hospital_trust !== undefined) updateData.hospital_trust = hospital_trust?.trim() || null
    if (specialty !== undefined) updateData.specialty = specialty?.trim() || null
    if (interests !== undefined) updateData.interests = interests || null
    if (profile_completed !== undefined) updateData.profile_completed = profile_completed
    if (onboarding_completed_at !== undefined) updateData.onboarding_completed_at = onboarding_completed_at
    if (show_all_events !== undefined) updateData.show_all_events = show_all_events

    // Update user profile (role is not updated to prevent privilege escalation)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', session.user.email)
      .select(`
        id, email, name, role, university, year, created_at,
        role_type, study_year, foundation_year, hospital_trust, specialty,
        profile_completed, interests, onboarding_completed_at,
        show_all_events
      `)
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
