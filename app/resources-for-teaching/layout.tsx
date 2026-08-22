import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessTeachingResources } from '@/lib/roles'
import { NOINDEX_ROBOTS } from '@/lib/seo'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Resources for Teaching',
  description: 'Staff teaching media library for CTFs, MedEd, educators, and admins.',
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

export default async function ResourcesForTeachingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/resources-for-teaching')
  }

  const role = await getUserRole(session.user.email || '')
  if (!canAccessTeachingResources(role)) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayoutClient
      role={role}
      userName={session.user.name ?? session.user.email ?? undefined}
    >
      {children}
    </DashboardLayoutClient>
  )
}
