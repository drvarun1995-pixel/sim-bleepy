import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'New password is required' 
      }, { status: 400 })
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 })
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one uppercase letter' 
      }, { status: 400 })
    }

    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one lowercase letter' 
      }, { status: 400 })
    }

    if (!/\d/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one number' 
      }, { status: 400 })
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one special character' 
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password and remove the must_change_password flag
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        must_change_password: false
      })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update password',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Error in change password API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
