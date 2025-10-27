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

    console.log('Export layout - fetching role for:', userEmail, { role: user?.role, error: error?.message })

    if (error || !user) {
      console.log('Export layout - defaulting to student role')
      return 'student'
    }

    const userRole = user.role || 'student'
    console.log('Export layout - resolved role:', userRole)
    return userRole as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch (error) {
    console.error('Export layout - error fetching role:', error)
    return 'student'
  }
}

// Helper function to get user name
async function getUserName(userEmail: string): Promise<string> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('email', userEmail)
      .single()

    if (error || !user) {
      return ''
    }

    return user.full_name || ''
  } catch (error) {
    console.error('Export layout - error fetching user name:', error)
    return ''
  }
}

export default async function ExportEventDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  // Get user role and name from database
  const [role, userName] = await Promise.all([
    getUserRole(session.user.email),
    getUserName(session.user.email)
  ])
  
  const displayName = userName || session.user.name || ''
  
  return (
    <DashboardLayoutClient role={role} userName={displayName}>
      {children}
    </DashboardLayoutClient>
  )
}
