import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'> {
  try {
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

export default async function GamesOrganiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get user role from database
  const role = await getUserRole(session.user.email || '')
  
  // Check if user is admin (games organiser is admin-only)
  if (role !== 'admin') {
    redirect('/dashboard')
  }
  
  const profile = {
    role,
    org: 'default',
    full_name: session.user.name ?? session.user.email ?? undefined,
  }

  return (
    <DashboardLayoutClient role={profile.role} userName={profile.full_name}>
      {children}
    </DashboardLayoutClient>
  )
}


