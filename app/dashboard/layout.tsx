import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row">
        <DashboardSidebar role={profile.role} />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
