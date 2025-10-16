import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { sendAccountCreatedEmail } from '@/lib/email'
import { generateTemporaryPassword } from '@/lib/password-generator'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Add user API called')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.email)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    console.log('Checking admin role for:', session.user.email)
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    console.log('User query result:', { currentUser, userError })

    if (userError || !currentUser || currentUser.role !== 'admin') {
      console.error('Admin check failed:', { userError, currentUser })
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
    console.log('Creating user with data:', { email, name, role })
    
    // Try with new columns first, fallback to basic columns if they don't exist
    const { data: userWithColumns, error: errorWithColumns } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name: name || null,
        role,
        email_verified: false, // FIXED: Set to false initially
        password_hash: hashedPassword,
        auth_provider: 'email', // FIXED: Add auth_provider
        created_at: new Date().toISOString(),
        admin_created: true,
        must_change_password: true
      })
      .select()
      .single()

    console.log('User creation result (with new columns):', { userWithColumns, errorWithColumns })

    let newUser;

    if (errorWithColumns) {
      // If new columns don't exist, try without them
      console.log('New columns don\'t exist, trying without them')
      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          name: name || null,
          role,
          email_verified: false, // FIXED: Set to false initially
          password_hash: hashedPassword,
          auth_provider: 'email', // FIXED: Add auth_provider
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      console.log('User creation result (fallback):', { fallbackUser, fallbackError })

      if (fallbackError) {
        console.error('Error creating user (fallback):', fallbackError)
        return NextResponse.json({ 
          error: 'Failed to create user',
          details: fallbackError.message 
        }, { status: 500 })
      }

      newUser = fallbackUser;
    } else {
      newUser = userWithColumns;
    }

    if (!newUser) {
      console.error('No user created')
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: 'User creation returned no data'
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
