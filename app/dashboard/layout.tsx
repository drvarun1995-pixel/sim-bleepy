import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student'> {
  try {
    const supabase = createClient()
    
    // Check the users table (where admin panel updates roles)
    const { data: user, error } = await supabase
      .from('users')
      .select('role, email, name')
      .eq('email', userEmail)
      .single()

    if (error || !user) {
      // Fallback to profiles table for legacy compatibility
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', userEmail)
        .single()
      
      if (profileError || !profile) {
        return 'student'
      }
      
      return profile.role as 'admin' | 'educator' | 'student'
    }

    return user.role as 'admin' | 'educator' | 'student'
  } catch (error) {
    // Default to student if database is not available
    return 'student'
  }
}

export default async function DashboardLayout({
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
