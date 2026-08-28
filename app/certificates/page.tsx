import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Sparkles, Settings, Plus, Award, Calendar, Star, TrendingUp } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { CertificatesTourButton } from './CertificatesTourButton'
import { FyFaqAccordion } from '@/components/FyFaqAccordion'
import { CertificatesTemplateGallery } from '@/components/certificates/CertificatesTemplateGallery'

async function getCertificateStats() {
  try {
    const { count: totalCertificates } = await supabaseAdmin
      .from('certificates')
      .select('*', { count: 'exact', head: true })

    const { count: totalTemplates } = await supabaseAdmin
      .from('certificate_templates')
      .select('*', { count: 'exact', head: true })

    const { count: eventsWithCertificates } = await supabaseAdmin
      .from('certificates')
      .select('event_id', { count: 'exact', head: true })

    return {
      totalCertificates: totalCertificates || 0,
      totalTemplates: totalTemplates || 0,
      eventsWithCertificates: eventsWithCertificates || 0
    }
  } catch (error) {
    console.error('Error fetching certificate stats:', error)
    return {
      totalCertificates: 0,
      totalTemplates: 0,
      eventsWithCertificates: 0
    }
  }
}

async function getRecentActivity(userId: string) {
  try {
    const { data: recentCertificates } = await supabaseAdmin
      .from('certificates')
      .select(`
        id,
        generated_at,
        event_id,
        events!inner(title)
      `)
      .eq('generated_by', userId)
      .order('generated_at', { ascending: false })
      .limit(3)

    const { data: recentTemplates } = await supabaseAdmin
      .from('certificate_templates')
      .select('id, name, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      recentCertificates: recentCertificates || [],
      recentTemplates: recentTemplates || []
    }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return {
      recentCertificates: [],
      recentTemplates: []
    }
  }
}

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  const stats = await getCertificateStats()
  const activity = await getRecentActivity(session?.user?.id || '')
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Certificates</h1>
          <p className="mt-1 text-slate-600">Create, generate, and manage certificates for event attendees</p>
        </div>
        <CertificatesTourButton />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/certificates/select-event" className="block" data-tour="certificates-create-new">
          <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md" data-tour="certificates-create-new-detailed">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">Create new</h3>
                <p className="text-sm text-slate-600">Design from scratch</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/certificates/generate" className="block" data-tour="certificates-generate-now">
          <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md" data-tour="certificates-use-template-detailed">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">Generate now</h3>
                <p className="text-sm text-slate-600">Use an existing template</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/certificates/templates" className="block" data-tour="certificates-template-library">
          <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">Your library</h3>
                <p className="text-sm text-slate-600">Edit, share, or delete</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/certificates/manage" className="block" data-tour="certificates-manager">
          <Card className="h-full border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">Manager</h3>
                <p className="text-sm text-slate-600">View generated certificates</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" data-tour="certificates-recent-activity">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.recentCertificates.length > 0 ? (
              activity.recentCertificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      Certificates generated for &quot;{cert.events?.title || cert.events?.[0]?.title || 'Event'}&quot;
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(cert.generated_at).toLocaleDateString()} • {new Date(cert.generated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-500">
                <Award className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm">No recent certificate activity</p>
              </div>
            )}

            {activity.recentTemplates.length > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    Template &quot;{activity.recentTemplates[0].name}&quot; created
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.recentTemplates[0].created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-tour="certificates-statistics">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-amber-500" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Total generated</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{stats.totalCertificates}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Active templates</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{stats.totalTemplates}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium">Events with certificates</span>
              </div>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700">{stats.eventsWithCertificates}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div data-tour="certificates-template-gallery">
        <CertificatesTemplateGallery />
      </div>

      <div data-tour="certificates-management-tools">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Management</h2>
          <p className="text-sm text-slate-600">Open the library, generated certificates, or certificates you have received.</p>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          <Card className="flex h-full flex-col border-slate-200 p-0">
            <CardContent className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-slate-900">Template library</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">Edit, share, and delete your designs separately from templates shared with you.</p>
              <Button asChild variant="outline" className="mt-auto w-full">
                <Link href="/certificates/templates">Manage templates</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="flex h-full flex-col border-slate-200 p-0">
            <CardContent className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-slate-900">Certificate manager</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">View, download, and resend certificates you have generated.</p>
              <Button asChild variant="outline" className="mt-auto w-full">
                <Link href="/certificates/manage">Manage certificates</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="flex h-full flex-col border-slate-200 p-0">
            <CardContent className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-slate-900">My certificates</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">Download certificates issued to you as an attendee.</p>
              <Button asChild variant="outline" className="mt-auto w-full">
                <Link href="/mycertificates">View my certificates</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-6 text-center">
          <h2 id="certificates-faq-heading" className="text-2xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Everything you need to know about creating and managing certificates.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <FyFaqAccordion
            items={[
              {
                question: 'How do I create a new certificate template?',
                answer: (
                  <>
                    <p>Follow these simple steps to create your certificate template:</p>
                    <ol>
                      <li>Click &quot;Create new&quot; in the Quick Actions section</li>
                      <li>Select an event with enabled booking configuration</li>
                      <li>Upload your certificate background image</li>
                      <li>Add text fields and position them on your template</li>
                      <li>Save your template with a descriptive name</li>
                      <li>Optionally share it with others by checking the &quot;Share with others&quot; box</li>
                    </ol>
                  </>
                ),
              },
              {
                question: 'How do I generate certificates for attendees?',
                answer: (
                  <>
                    <p>Generate certificates for your event attendees:</p>
                    <ol>
                      <li>Click &quot;Generate now&quot; in the Quick Actions section</li>
                      <li>Select the event you want to generate certificates for</li>
                      <li>Choose a template from your Template Library</li>
                      <li>Review the attendee list and select who should receive certificates</li>
                      <li>Click &quot;Generate Certificates&quot; to create and save them</li>
                      <li>Certificates will be automatically saved to Supabase Storage</li>
                    </ol>
                  </>
                ),
              },
              {
                question: 'How does the sharing system work?',
                answer: (
                  <>
                    <p>Our template sharing system works with role-based access:</p>
                    <ul>
                      <li>
                        <strong>Admins:</strong> Can see all certificates and templates
                      </li>
                      <li>
                        <strong>CTF, MedEd Team, Educators:</strong> Can see their own templates
                        and shared templates from others
                      </li>
                      <li>
                        <strong>Students:</strong> Can only see shared templates
                      </li>
                      <li>
                        When you check &quot;Share with others&quot;, your template becomes visible
                        to users with appropriate roles
                      </li>
                      <li>Shared templates appear in the template gallery, separately from yours</li>
                    </ul>
                  </>
                ),
              },
              {
                question: 'How do I manage my templates and certificates?',
                answer: (
                  <>
                    <p>You can manage your content through these sections:</p>
                    <ul>
                      <li>
                        <strong>Template Library:</strong> View, edit, delete, and share your
                        certificate templates
                      </li>
                      <li>
                        <strong>Certificate Manager:</strong> View and manage all generated
                        certificates
                      </li>
                      <li>
                        <strong>My Certificates:</strong> View certificates you&apos;ve received as
                        an attendee
                      </li>
                      <li>
                        Templates are organized by user in Supabase Storage under &quot;User &gt;
                        template-images&quot;
                      </li>
                      <li>
                        Certificates are stored as &quot;User &gt; Attendee name &gt; Certificate
                        file&quot;
                      </li>
                    </ul>
                  </>
                ),
              },
              {
                question: 'What file formats are supported for certificate images?',
                answer: (
                  <>
                    <p>Supported image formats for certificate templates:</p>
                    <ul>
                      <li>
                        <strong>PNG:</strong> Recommended for certificates with transparency
                      </li>
                      <li>
                        <strong>JPG/JPEG:</strong> Good for photographs and complex images
                      </li>
                      <li>
                        <strong>WebP:</strong> Modern format with good compression
                      </li>
                      <li>Images are stored in Supabase Storage for optimal performance</li>
                      <li>Maximum recommended size: 1920x1080 pixels for best quality</li>
                    </ul>
                  </>
                ),
              },
              {
                question: 'How do I edit an existing template?',
                answer: (
                  <>
                    <p>To edit an existing template:</p>
                    <ol>
                      <li>Go to &quot;Your library&quot; in the Quick Actions</li>
                      <li>Find the template you want to edit</li>
                      <li>Click &quot;Edit this template&quot; button</li>
                      <li>Make your changes to text fields, positions, or background</li>
                      <li>Click &quot;Save Changes&quot; to update the template</li>
                      <li>
                        The template will be updated and any shared versions will reflect your
                        changes
                      </li>
                    </ol>
                  </>
                ),
              },
              {
                question: 'What are the coordinate matching and scaling features?',
                answer: (
                  <>
                    <p>Our certificate system includes advanced coordinate matching:</p>
                    <ul>
                      <li>
                        <strong>Preview Accuracy:</strong> Text fields in the preview match exactly
                        with the generated certificate
                      </li>
                      <li>
                        <strong>Smart Scaling:</strong> Automatic scaling from template dimensions
                        to final image size
                      </li>
                      <li>
                        <strong>Precise Positioning:</strong> Text appears exactly where you place
                        it in the template builder
                      </li>
                      <li>
                        <strong>Font Scaling:</strong> Font sizes are automatically adjusted to
                        maintain readability
                      </li>
                      <li>
                        <strong>Alignment Support:</strong> Left, center, and right text alignment
                        with proper positioning
                      </li>
                      <li>
                        <strong>High-Quality Output:</strong> Generated certificates maintain crisp
                        text at any resolution
                      </li>
                    </ul>
                  </>
                ),
              },
              {
                question: 'How do I use featured templates from other users?',
                answer: (
                  <>
                    <p>Using shared templates is easy:</p>
                    <ol>
                      <li>
                        Browse the template gallery on the main certificates page, or open Shared with you
                      </li>
                      <li>Click &quot;Use&quot; on any template you like</li>
                      <li>
                        The template will load in the image builder with all text fields and
                        styling
                      </li>
                      <li>
                        You can customize the text fields, positions, and styling as needed
                      </li>
                      <li>
                        Click &quot;Generate Certificate&quot; to proceed to certificate generation
                      </li>
                      <li>Select your event and generate certificates for attendees</li>
                      <li>
                        The template will be saved to your personal template library for future use
                      </li>
                    </ol>
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
