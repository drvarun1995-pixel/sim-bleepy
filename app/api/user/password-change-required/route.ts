import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ required: false }, { status: 200 })
    }

    // Check if user needs to change password
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('must_change_password, admin_created')
      .eq('email', session.user.email)
      .single()

    if (error || !user) {
      return NextResponse.json({ required: false }, { status: 200 })
    }

    return NextResponse.json({ 
      required: user.must_change_password === true 
    })

  } catch (error) {
    console.error('Error checking password change requirement:', error)
    return NextResponse.json({ required: false }, { status: 200 })
  }
}
