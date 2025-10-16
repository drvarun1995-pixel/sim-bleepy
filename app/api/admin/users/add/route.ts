import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendAccountCreatedEmail } from '@/lib/email'
import { generateTemporaryPassword } from '@/lib/password-generator'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { email, name, role } = await request.json()

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({ 
        error: 'Email and role are required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'educator', 'student', 'meded_team', 'ctf']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: admin, educator, student, meded_team, ctf' 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Generate a temporary password
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    // Create user in database
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name: name || null,
        role,
        email_verified: true, // Admin-created users are pre-verified
        password: hashedPassword,
        created_at: new Date().toISOString(),
        admin_created: true, // Flag to indicate this user was created by admin
        must_change_password: true // Flag to force password change on first login
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: createError.message 
      }, { status: 500 })
    }

    // Send email notification to the new user
    try {
      await sendAccountCreatedEmail({
        name: name || 'User',
        email,
        role,
        password: temporaryPassword,
        loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the user creation if email fails
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        email_verified: newUser.email_verified
      }
    })

  } catch (error) {
    console.error('Error in add user API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
