import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'> {
  try {
    // Use supabaseAdmin (service role) to bypass RLS
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    console.log('Attendance tracking layout - fetching role for:', userEmail, { role: user?.role, error: error?.message })

    if (error || !user) {
      console.log('Attendance tracking layout - defaulting to student role')
      return 'student'
    }

    const userRole = user.role || 'student'
    console.log('Attendance tracking layout - resolved role:', userRole)
    return userRole as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch (error) {
    console.error('Attendance tracking layout - error fetching role:', error)
    return 'student'
  }
}

export default async function AttendanceTrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get user role from database or default to student
  const role = await getUserRole(session.user.email || '')
  
  // Check if user has permission to access attendance tracking
  if (!['admin', 'meded_team', 'ctf'].includes(role)) {
    redirect('/dashboard')
  }
  
  const profile = {
    role,
    org: 'default',
    full_name: session.user.name || session.user.email
  }

  return (
    <DashboardLayoutClient role={profile.role} userName={profile.full_name}>
      {children}
    </DashboardLayoutClient>
  )
}
