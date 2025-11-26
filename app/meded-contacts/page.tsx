import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, User, GraduationCap, Stethoscope } from 'lucide-react'
import Image from 'next/image'
import { MedEdContactsTourButton } from './MedEdContactsTourButton'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['student', 'educator', 'admin', 'meded_team', 'ctf'] as const

type DashboardRole = (typeof ALLOWED_ROLES)[number]

const normaliseRole = (role?: string | null): DashboardRole => {
  if (role && ALLOWED_ROLES.includes(role as DashboardRole)) {
    return role as DashboardRole
  }
  return 'student'
}

interface MedEdContact {
  id: string
  name: string
  title: string
  role: string
  email: string
  phone?: string
  image?: string
  bio?: string
}

export default async function MedEdContactsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/meded-contacts')
  }

  const { data: viewer, error } = await supabaseAdmin
    .from('users')
    .select('role, name')
    .eq('email', session.user.email)
    .maybeSingle()

  if (error) {
    console.error('Failed to load viewer role for meded-contacts page:', error)
  }

  const dashboardRole = normaliseRole(viewer?.role ?? session.user.role)
  const dashboardName = viewer?.name ?? session.user.name ?? session.user.email ?? undefined

  // MedEd Team contacts - for now just Varun
  const mededContacts: MedEdContact[] = [
    {
      id: 'varun-tyagi',
      name: 'Varun Tyagi',
      title: 'Clinical Teaching Fellow',
      role: 'ST1',
      email: 'varun.tyagi@nhs.net',
      image: '/varun-tyagi.png',
      bio: 'Clinical Teaching Fellow specializing in medical education and clinical training. Available to support students with their learning journey and platform questions.'
    }
  ]

  return (
    <DashboardLayoutClient role={dashboardRole} userName={dashboardName}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
          <div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            <Stethoscope className="mr-2 h-4 w-4" /> MedEd Team
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">MedEd Team Contacts</h1>
          <p className="max-w-3xl text-sm text-slate-500 sm:text-base">
            Get in touch with Clinical Teaching Fellows and other important contacts. Click on email addresses to send a message directly.
          </p>
            </div>
            <div className="flex-shrink-0">
              <MedEdContactsTourButton />
            </div>
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-tour="meded-contacts-cards">
          {mededContacts.map((contact) => (
            <Card
              key={contact.id}
              className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-purple-300 hover:scale-[1.02]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      {contact.image ? (
                        <Image
                          src={contact.image}
                          alt={contact.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-purple-600" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>

                  {/* Name and Title */}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                      {contact.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium text-purple-700 border-purple-200 bg-purple-50">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {contact.title}
                      </Badge>
                      {contact.role && (
                        <Badge variant="secondary" className="text-xs">
                          {contact.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {contact.bio && (
                  <CardDescription className="text-sm text-slate-600 leading-relaxed">
                    {contact.bio}
                  </CardDescription>
                )}

                {/* Contact Information */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Email */}
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 hover:underline transition-colors group/email"
                    data-tour="meded-contacts-email"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0 group-hover/email:scale-110 transition-transform" />
                    <span className="truncate">{contact.email}</span>
                  </a>

                  {/* Phone (if available) */}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700 hover:underline transition-colors"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (if no contacts) */}
        {mededContacts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Stethoscope className="h-12 w-12 text-slate-400 mb-4" />
              <CardTitle className="text-lg text-slate-600 mb-2">No contacts available</CardTitle>
              <CardDescription className="text-center">
                MedEd Team contacts will appear here once they are added.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutClient>
  )
}

