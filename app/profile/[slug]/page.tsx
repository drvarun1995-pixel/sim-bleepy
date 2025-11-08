import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { buildPublicProfilePayload, canViewProfile, formatRoleLabel } from '@/lib/profiles'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink, Lock, ShieldCheck, MessageCircle, Calendar as CalendarIcon, GraduationCap, Building2, Heart, User as UserIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

const dashboardProfileRoutes: Record<string, string> = {
  student: '/dashboard/student/profile',
  educator: '/dashboard/educator/profile',
  admin: '/dashboard/admin/profile',
  meded_team: '/dashboard/meded_team/profile',
  meded: '/dashboard/meded/profile',
  ctf: '/dashboard/ctf/profile',
}

const fallbackAvatar = '/avatars/avatar-01.svg'

const ALLOWED_DASHBOARD_ROLES = ['student', 'educator', 'admin', 'meded_team', 'ctf'] as const
type DashboardRole = (typeof ALLOWED_DASHBOARD_ROLES)[number]

async function resolveDashboardRole(email?: string | null): Promise<DashboardRole | null> {
  if (!email) return null

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user role for profile layout:', error)
      return null
    }

    if (!data?.role) return 'student'

    const normalized = data.role as string
    if (ALLOWED_DASHBOARD_ROLES.includes(normalized as DashboardRole)) {
      return normalized as DashboardRole
    }

    return 'student'
  } catch (error) {
    console.error('Unexpected error resolving user role:', error)
    return null
  }
}

async function fetchProfileRecord(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      public_slug,
      role,
      name,
      public_display_name,
      is_public,
      allow_messages,
      profile_picture_url,
      avatar_type,
      avatar_asset,
      created_at,
      role_type,
      university,
      study_year,
      foundation_year,
      hospital_trust,
      specialty,
      tagline,
      about_me,
      interests
    `)
    .eq('public_slug', slug.toLowerCase())
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const record = await fetchProfileRecord(params.slug)

    if (!record) {
      return {
        title: 'Profile not found • Bleepy',
      }
    }

    const displayName =
      record.public_display_name?.trim() ||
      record.name?.trim() ||
      'Bleepy User'

    const roleLabel = formatRoleLabel(record.role_type)

    return {
      title: `${displayName} • Bleepy Profile`,
      description: record.tagline
        ? record.tagline
        : roleLabel
        ? `${displayName} · ${roleLabel}`
        : `View ${displayName}'s profile on Bleepy.`,
    }
  } catch {
    return {
      title: 'Bleepy Profile',
    }
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function PublicProfilePage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const record = await fetchProfileRecord(params.slug)

  if (!record) {
    notFound()
  }

  const viewer = {
    id: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
  }

  const dashboardRole = await resolveDashboardRole(session?.user?.email ?? null)
  const dashboardUserName = session?.user?.name ?? session?.user?.email ?? undefined

  const viewerDashboardRoute = viewer.role ? dashboardProfileRoutes[viewer.role] : null

  const isVisible = record ? canViewProfile(record, viewer) : false

  const content = (() => {
    if (!isVisible) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200/40 bg-white/70 p-10 text-center shadow-xl shadow-slate-200/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-slate-900">This profile is private</h1>
              <p className="text-sm leading-relaxed text-slate-600">
                The owner of this profile has chosen to keep it private. Ask them to update their visibility settings if you need access.
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild variant="secondary">
                <Link href="/dashboard">
                  Return to dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    const payload = buildPublicProfilePayload(record, viewer)
    const profile = payload.profile

    const avatarUrl = profile.avatarUrl || fallbackAvatar
    const joinedDate = formatDate(profile.createdAt)
  const interests = profile.interests ?? []
    const canMessage = profile.allowMessages && profile.isPublic

  const overviewItems = [
    { label: 'Platform Role', value: profile.platformRole },
    { label: 'Professional Role', value: profile.roleType },
    { label: 'Specialty', value: profile.specialty },
    { label: 'Hospital / Trust', value: profile.hospitalTrust },
    { label: 'University', value: profile.university },
    { label: 'Year of Study', value: profile.studyYear },
    { label: 'Foundation Year', value: profile.foundationYear },
  ].filter((item) => item.value && String(item.value).trim().length > 0)

    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/40 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-50 shadow-xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.35),transparent)]" />
          <div className="relative flex flex-col gap-8 px-6 py-12 sm:px-10">
            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:text-left">
              <div className="relative flex-shrink-0">
                <div className="h-32 w-32 rounded-full border-4 border-white/20 bg-slate-900 p-1 shadow-lg ring-4 ring-purple-500/40">
                  <img
                    src={avatarUrl}
                    alt={`${profile.displayName}'s avatar`}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <Badge
                  variant={profile.isPublic ? 'default' : 'secondary'}
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 border border-white/20 px-3 py-1 text-xs ${
                    profile.isPublic ? 'bg-emerald-500/20 text-emerald-100' : 'bg-slate-700/70 text-slate-200'
                  }`}
                >
                  {profile.isPublic ? 'Public Profile' : 'Private Profile'}
                </Badge>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    {profile.displayName}
                  </h1>
                  {profile.tagline && (
                    <p className="text-lg font-medium text-slate-200">
                      {profile.tagline}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {profile.platformRole && (
                    <Badge className="bg-white/15 text-white border border-white/20">
                      <UserIcon className="mr-1.5 h-3.5 w-3.5" />
                      {profile.platformRole}
                    </Badge>
                  )}
                  {profile.roleType && (
                    <Badge className="bg-purple-500/20 text-purple-100 border border-purple-500/40">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {profile.roleType}
                    </Badge>
                  )}
                  {profile.university && (
                    <Badge className="bg-sky-500/20 text-sky-100 border border-sky-500/40">
                      <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                      {profile.university}
                    </Badge>
                  )}
                  {profile.specialty && (
                    <Badge className="bg-rose-500/20 text-rose-100 border border-rose-500/40">
                      <Heart className="mr-1.5 h-3.5 w-3.5" />
                      {profile.specialty}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {joinedDate && (
                    <div className="inline-flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                      <span>Member since {joinedDate}</span>
                    </div>
                  )}
                  {profile.hospitalTrust && (
                    <div className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4 opacity-70" />
                      <span>{profile.hospitalTrust}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {viewerDashboardRoute && payload.viewer.isOwner && (
                    <Button
                      asChild
                      variant="secondary"
                      className="bg-white/10 text-slate-100 hover:bg-white/20 border border-white/20"
                    >
                      <Link href={viewerDashboardRoute}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage profile
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={!canMessage}
                    className={`inline-flex items-center gap-2 border border-white/20 ${
                      canMessage
                        ? 'bg-white/10 text-slate-100 hover:bg-white/20'
                        : 'bg-white/5 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {canMessage ? 'Send message' : 'Messages disabled'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-lg shadow-slate-200/60">
          <h2 className="text-lg font-semibold text-slate-900">About {profile.displayName}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {profile.about
              ? profile.about
              : 'This user has not added an about section yet.'}
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">Professional Overview</h3>
            {overviewItems.length > 0 ? (
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                {overviewItems.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-800">{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No additional professional details provided.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h3 className="text-base font-semibold text-slate-900">Interests & Focus Areas</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {interests.length > 0 ? (
                interests.map(interest => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="bg-slate-900/10 text-slate-900 border border-slate-900/10 px-3 py-1 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  >
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-600">No interests added yet.</p>
              )}
            </div>
          </div>
        </section>

        {!profile.isPublic && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-100 px-5 py-4 text-sm text-yellow-900">
            This profile is currently private. Only you and authorized staff can view it. Toggle your visibility in profile settings to share it with the community.
          </div>
        )}
      </div>
    )
  })()

  if (dashboardRole) {
    return (
      <DashboardLayoutClient role={dashboardRole} userName={dashboardUserName}>
        {content}
      </DashboardLayoutClient>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-12">
      {content}
    </div>
  )
}


