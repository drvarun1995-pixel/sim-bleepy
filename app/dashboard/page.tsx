import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

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
    redirect('/auth/signin')
  }

  // Get user role from database or default to student
  const role = await getUserRole(session.user.email || '')
  
  // Redirect based on role
  if (role === 'admin') {
    redirect('/dashboard/admin')
  } else if (role === 'educator') {
    redirect('/dashboard/educator')
  } else {
    // Default to stations page for students and unknown roles
    redirect('/dashboard/stations')
  }
}