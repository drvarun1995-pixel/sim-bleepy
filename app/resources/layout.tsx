import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student'> {
  try {
    const supabase = createClient()
    
    // Check the users table first (primary source of truth)
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (!error && user && user.role) {
      return user.role as 'admin' | 'educator' | 'student'
    }

    // Fallback to profiles table for legacy compatibility
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (!profileError && profile && profile.role) {
      return profile.role as 'admin' | 'educator' | 'student'
    }

    return 'student'
  } catch (error) {
    console.warn('Could not fetch user role from database:', error)
    return 'student'
  }
}

export default async function ResourcesLayout({
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









