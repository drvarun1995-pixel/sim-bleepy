import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import ConnectionsDashboard from '@/components/network/ConnectionsDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, BookOpen, ShieldCheck } from 'lucide-react'
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

export default async function MentorsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/mentors')
  }

  const { data: viewer, error } = await supabaseAdmin
    .from('users')
    .select('role, name, is_public')
    .eq('email', session.user.email)
    .maybeSingle()

  if (error) {
    console.error('Failed to load viewer role for mentors page:', error)
  }

  const dashboardRole = normaliseRole(viewer?.role ?? session.user.role)
  const dashboardName = viewer?.name ?? session.user.name ?? session.user.email ?? undefined
  const isPublic = viewer?.is_public ?? false

  return (
    <DashboardLayoutClient role={dashboardRole} userName={dashboardName}>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <GraduationCap className="mr-2 h-4 w-4" /> Mentorship hub
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Your mentor relationships</h1>
          <p className="max-w-3xl text-sm text-slate-500 sm:text-base">
            Build and nurture mentor/mentee links that accelerate your growth. Review active relationships, track requests, and manage ongoing mentorship conversations in one place.
          </p>
        </div>

        <ProfileVisibilityCallout initialIsPublic={isPublic} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-emerald-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-emerald-900">
              <ShieldCheck className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Active mentors</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-3xl font-bold text-emerald-900">
              —
              <p className="mt-1 text-xs text-emerald-700">Count of mentors currently connected to you.</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-purple-900">
              <BookOpen className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Open mentorship requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-3xl font-bold text-purple-900">
              —
              <p className="mt-1 text-xs text-purple-700">Mentorship invitations still awaiting a response.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="flex items-center gap-2 pb-2 text-slate-900">
              <GraduationCap className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">Mentorship insights</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-slate-600">
              Detailed mentorship analytics will appear here soon.
            </CardContent>
          </Card>
        </div>

        <ConnectionsDashboard visibleTabs={['mentors']} defaultTab="mentors" />
      </div>
    </DashboardLayoutClient>
  )
}
