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

    if (error || !user) {
      return 'student'
    }

    return (user.role || 'student') as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch (error) {
    console.warn('Could not fetch user role from database:', error)
    return 'student'
  }
}

export default async function EventDataLayout({
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
