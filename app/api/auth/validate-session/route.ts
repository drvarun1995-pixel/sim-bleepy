import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'No session found' 
      }, { status: 401 })
    }

    // Check if user still exists in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', session.user.email)
      .single()

    if (error || !user) {
      // User doesn't exist in database anymore
      return NextResponse.json({ 
        valid: false, 
        reason: 'User not found in database',
        shouldSignOut: true
      }, { status: 200 })
    }

    // User exists, session is valid
    return NextResponse.json({ 
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error validating session:', error)
    return NextResponse.json({ 
      valid: false, 
      reason: 'Internal server error' 
    }, { status: 500 })
  }
}

