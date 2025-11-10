import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'> {
  try {
    const { supabaseAdmin } = await import('@/utils/supabase')
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()

    if (error || !user) {
      console.error('Could not fetch user role from database:', error)
      return 'student'
    }

    return user.role as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch (error) {
    console.error('Could not fetch user role from database:', error)
    return 'student'
  }
}

export default async function FeedbackLayout({
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
    full_name: session.user.name ?? session.user.email ?? undefined,
  }

  return (
    <DashboardLayoutClient role={profile.role} userName={profile.full_name}>
      {children}
    </DashboardLayoutClient>
  )
}
