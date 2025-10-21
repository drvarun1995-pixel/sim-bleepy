import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image, FolderOpen, Sparkles, Settings, Users, Award, Mail, Download } from 'lucide-react'

export default function CertificatesPage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate System</h1>
              <p className="text-gray-600">Create professional certificates for your event attendees</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/certificates/templates">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Templates
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/certificates/manage">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Action */}
        <div className="mb-12">
          <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Create Event Certificates</h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl text-lg">
                Design beautiful, professional certificates for your events. Upload any image as background, 
                add dynamic text fields with real event data, and generate certificates for all attendees.
              </p>
              <div className="flex gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Link href="/certificates/select-event">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Creating Certificates
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/certificates/templates">
                    <FolderOpen className="h-5 w-5 mr-2" />
                    Browse Templates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Select Event</h3>
              <p className="text-sm text-gray-600">
                Choose from your events that have registered attendees. See attendee counts and details at a glance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Design Certificate</h3>
              <p className="text-sm text-gray-600">
                Upload any image as background and add text fields. Dynamic data from your event automatically populates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Generate & Send</h3>
              <p className="text-sm text-gray-600">
                Bulk generate certificates for all attendees and automatically send them via email.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Image className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Perfect Alignment</h3>
              <p className="text-sm text-gray-600">
                No coordinate mismatch. Preview matches output exactly.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dynamic Data</h3>
              <p className="text-sm text-gray-600">
                Real event data automatically populates certificate fields.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto Email</h3>
              <p className="text-sm text-gray-600">
                Automatically send certificates to attendees via email.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
              <p className="text-sm text-gray-600">
                Export as high-quality PNG images ready for printing.
              </p>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                Manage Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Save and reuse certificate designs. Create templates for different types of events.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/certificates/templates">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Templates
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Manage Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View all generated certificates, resend emails, and manage certificate records.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/certificates/manage">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage All
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                My Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View and download your own certificates from events you've attended.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/mycertificates">
                  <Award className="h-4 w-4 mr-2" />
                  View Mine
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Ready to Get Started?</h3>
                <p className="text-sm text-blue-700">
                  Creating professional certificates is easy! Just click "Start Creating Certificates" above, 
                  select your event, upload a background image, and start designing. Your attendees will love 
                  receiving beautiful, personalized certificates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}