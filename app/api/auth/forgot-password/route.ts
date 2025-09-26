import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      // Still return success to user for security
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email using Microsoft Entra ID
    try {
      await sendPasswordResetEmail({
        email: email,
        name: user.name,
        resetUrl: resetUrl
      })
      console.log('Password reset email sent successfully to:', email)
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Still return success to user for security
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Include reset URL in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    })

  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}