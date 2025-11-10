import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import ConnectionsDashboard from '@/components/network/ConnectionsDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, RefreshCw, Handshake } from 'lucide-react'
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

export default async function FriendsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/friends')
  }

  const { data: viewer, error } = await supabaseAdmin
    .from('users')
    .select('role, name, is_public')
    .eq('email', session.user.email)
    .maybeSingle()

  if (error) {
    console.error('Failed to load viewer role for friends page:', error)
  }

  const dashboardRole = normaliseRole(viewer?.role ?? session.user.role)
  const dashboardName = viewer?.name ?? session.user.name ?? session.user.email ?? undefined
  const isPublic = viewer?.is_public ?? false

  return (
    <DashboardLayoutClient role={dashboardRole} userName={dashboardName}>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Users className="mr-2 h-4 w-4" /> Friends network
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Your friend connections</h1>
          <p className="max-w-3xl text-sm text-slate-500 sm:text-base">
            Manage the peers you collaborate with most often. Use this page to accept invitations, review shared history, and keep track of your go-to study partners.
          </p>
        </div>

        <ProfileVisibilityCallout initialIsPublic={isPublic} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-blue-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-blue-900">
              <Users className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Active friends</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-3xl font-bold text-blue-900">
              —
              <p className="mt-1 text-xs text-blue-700">Track how many peers you are currently connected with.</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-purple-900">
              <Handshake className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Invites pending</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-3xl font-bold text-purple-900">
              —
              <p className="mt-1 text-xs text-purple-700">Keep an eye on outstanding friendship invitations.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-slate-900">
              <RefreshCw className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-slate-600">
              Friend activity analytics will appear here soon.
            </CardContent>
          </Card>
        </div>

        <ConnectionsDashboard visibleTabs={['friends']} defaultTab="friends" />
      </div>
    </DashboardLayoutClient>
  )
}
