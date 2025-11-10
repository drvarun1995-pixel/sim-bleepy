import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, UserCheck } from 'lucide-react'
import Link from 'next/link'

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
    .select('role, name')
    .eq('email', session.user.email)
    .maybeSingle()

  if (error) {
    console.error('Failed to load viewer role for friends page:', error)
  }

  const dashboardRole = normaliseRole(viewer?.role ?? session.user.role)
  const dashboardName = viewer?.name ?? session.user.name ?? session.user.email ?? undefined

  return (
    <DashboardLayoutClient role={dashboardRole} userName={dashboardName}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Social Features Temporarily Disabled</CardTitle>
            <CardDescription className="mt-2">
              Friend connection features are currently unavailable due to information governance review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-slate-600">
              We're working through information governance requirements for social features. 
              These features will be re-enabled once clearance is obtained.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button asChild variant="default">
                <Link href="/dashboard">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutClient>
  )
}
