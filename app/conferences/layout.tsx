import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NOINDEX_ROBOTS } from '@/lib/seo'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Conferences',
  description: 'Search UK poster and oral presentation opportunities.',
  robots: NOINDEX_ROBOTS,
}

async function getUserRole(userEmail: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single()
    if (error || !user) return 'student'
    return (user.role || 'student') as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'
  } catch {
    return 'student'
  }
}

export default async function ConferencesLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/conferences')
  }

  const role = await getUserRole(session.user.email || '')
  return (
    <DashboardLayoutClient role={role} userName={session.user.name ?? session.user.email ?? undefined}>
      {children}
    </DashboardLayoutClient>
  )
}
