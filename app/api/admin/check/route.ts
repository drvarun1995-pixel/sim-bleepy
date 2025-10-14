import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check database role first (primary method)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    // If user exists in database, use their role
    if (user && !error) {
      const isAdmin = user.role === 'admin'
      const isEducator = user.role === 'educator'
      const isMedEdTeam = user.role === 'meded_team'
      const isCTF = user.role === 'ctf'
      
      // MedEd Team and CTF should have admin-like permissions for event management
      const hasAdminPermissions = isAdmin || isMedEdTeam || isCTF
      
      return NextResponse.json({ 
        isAdmin: hasAdminPermissions,
        isEducator: isEducator || isMedEdTeam || isCTF,
        isMedEdTeam,
        isCTF,
        role: user.role,
        email: session.user.email
      })
    }

    // Fallback to environment variable check for admin emails (for initial setup)
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    const isAdmin = adminEmails.includes(session.user.email.trim())

    return NextResponse.json({ 
      isAdmin,
      isEducator: false,
      role: isAdmin ? 'admin' : 'student',
      email: session.user.email
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 })
  }
}
