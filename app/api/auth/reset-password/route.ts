import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Check if token has already been used
    if (resetToken.used) {
      return NextResponse.json({ error: 'Reset token has already been used' }, { status: 400 })
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user's password and verify email (for admin-created accounts)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        email_verified: true,
        must_change_password: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetToken.user_id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Get user profile information to return
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, profile_completed, admin_created')
      .eq('id', resetToken.user_id)
      .single()

    console.log('[Reset Password API] User data:', {
      id: user?.id,
      email: user?.email,
      profile_completed: user?.profile_completed,
      admin_created: user?.admin_created
    })

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError)
      // Don't fail the request if we can't mark the token as used
    }

    const responseData = { 
      message: 'Password reset successfully. You can now sign in with your new password.',
      user: user || undefined
    }
    
    console.log('[Reset Password API] Returning response:', responseData)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}