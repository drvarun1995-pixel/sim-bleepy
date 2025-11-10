import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import ConnectionsDashboard from '@/components/network/ConnectionsDashboard'
import { ProfileVisibilityCallout } from '@/components/network/ProfileVisibilityCallout'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['student', 'educator', 'admin', 'meded_team', 'ctf'] as const

type DashboardRole = (typeof ALLOWED_ROLES)[number]

const normaliseRole = (role?: string | null): DashboardRole => {
  if (role && ALLOWED_ROLES.includes(role as DashboardRole)) {
    return role as DashboardRole
  }
  return 'student'
}

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/connections')
  }

  const { data: viewer, error } = await supabaseAdmin
    .from('users')
    .select('role, name, is_public')
    .eq('email', session.user.email)
    .maybeSingle()

  if (error) {
    console.error('Failed to load viewer role for connections page:', error)
  }

  const dashboardRole = normaliseRole(viewer?.role ?? session.user.role)
  const dashboardName = viewer?.name ?? session.user.name ?? session.user.email ?? undefined
  const isPublic = viewer?.is_public ?? false

  return (
    <DashboardLayoutClient role={dashboardRole} userName={dashboardName}>
      <div className="space-y-6">
        <ProfileVisibilityCallout initialIsPublic={isPublic} />
        <ConnectionsDashboard visibleTabs={['suggestions', 'pending', 'blocked']} defaultTab="suggestions" />
      </div>
    </DashboardLayoutClient>
  )
}
