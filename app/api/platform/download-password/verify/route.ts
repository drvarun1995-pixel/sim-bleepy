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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Get the stored password hash from platform_settings
    const { data: setting, error: settingError } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'download_password_hash')
      .single()

    if (settingError || !setting) {
      console.error('Error fetching download password:', settingError)
      return NextResponse.json(
        { error: 'Download password not configured' },
        { status: 500 }
      )
    }

    // Verify the password
    const isValid = await bcrypt.compare(password, setting.setting_value)

    return NextResponse.json({
      valid: isValid,
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

