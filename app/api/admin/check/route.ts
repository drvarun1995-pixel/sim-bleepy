import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
    const isAdmin = adminEmails.includes(session.user.email)

    return NextResponse.json({ 
      isAdmin,
      email: session.user.email,
      adminEmails: adminEmails // For debugging
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 })
  }
}
