import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { NOINDEX_ROBOTS } from '@/lib/seo'
import '../content-styles.css'

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
}

// Helper function to determine user role
async function getUserProfile(userEmail: string): Promise<{
  role: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  roleType: string | null
  foundationYear: string | null
}> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role, role_type, foundation_year')
      .eq('email', userEmail)
      .single()

    if (error || !user) {
      return { role: 'student', roleType: null, foundationYear: null }
    }

    return {
      role: (user.role || 'student') as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf',
      roleType: user.role_type || null,
      foundationYear: user.foundation_year || null,
    }
  } catch (error) {
    console.error('Dashboard layout - error fetching role:', error)
    return { role: 'student', roleType: null, foundationYear: null }
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

  const profile = await getUserProfile(session.user.email || '')

  return (
    <DashboardLayoutClient
      role={profile.role}
      roleType={profile.roleType}
      foundationYear={profile.foundationYear}
      userName={session.user.name ?? session.user.email ?? undefined}
    >
      {children}
    </DashboardLayoutClient>
  )
}
