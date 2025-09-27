import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { StationsContent } from '@/components/dashboard/StationsContent'

// Helper function to determine user role
async function getUserRole(userId: string): Promise<'admin' | 'educator' | 'student'> {
  try {
    const supabase = createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Default to student if no profile found
      return 'student'
    }

    return profile.role as 'admin' | 'educator' | 'student'
  } catch (error) {
    // Default to student if database is not available
    console.warn('Could not fetch user role from database:', error)
    return 'student'
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Please sign in to access the dashboard.</div>
  }

  // Get user role from database or default to student
  const role = await getUserRole(session.user.email || '')
  
  // Show stations content by default for all users
  return <StationsContent />
}
