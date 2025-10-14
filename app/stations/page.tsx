import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { StationsContent } from '@/components/dashboard/StationsContent'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'> {
  try {
    // Use supabaseAdmin (service role) to bypass RLS
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      return 'student'
    }

    return (user.role || 'student') as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch (error) {
    // Default to student if database is not available
    console.warn('Could not fetch user role from database:', error)
    return 'student'
  }
}

export default async function StationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Please sign in to access the stations.</div>
  }

  // Get user role from database or default to student
  const role = await getUserRole(session.user.email || '')
  
  // Show stations content
  return <StationsContent />
}


