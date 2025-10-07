import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

// Helper function to determine user role
async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student'> {
  try {
    console.log('🔍 Getting role for email:', userEmail)
    const supabase = createClient()
    
    // Check the users table (where admin panel updates roles)
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    console.log('📊 Users table query result:', { user, error })

    if (error || !user) {
      console.log('⚠️ No user found in users table, checking profiles table...')
      // Fallback to profiles table for legacy compatibility
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', userEmail)
        .single()
      
      console.log('📊 Profiles table query result:', { profile, profileError })
      
      if (profileError || !profile) {
        console.log('❌ No user or profile found for email:', userEmail)
        return 'student'
      }
      
      console.log('✅ User role loaded from profiles:', profile.role, 'for email:', userEmail)
      return profile.role as 'admin' | 'educator' | 'student'
    }

    console.log('✅ User role loaded from users table:', user.role, 'for email:', userEmail)
    return user.role as 'admin' | 'educator' | 'student'
  } catch (error) {
    // Default to student if database is not available
    console.error('❌ Could not fetch user role from database:', error)
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
