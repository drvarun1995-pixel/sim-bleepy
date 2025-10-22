'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { 
  Settings, 
  Search, 
  Download, 
  Mail, 
  Trash2, 
  Eye, 
  Filter,
  Calendar,
  User,
  Award,
  ArrowLeft,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { downloadCertificate, type CertificateWithDetails } from '@/lib/certificates'
import { toast } from 'sonner'
import { DeleteFileDialog } from '@/components/ui/confirmation-dialog'

export default function ManageCertificatesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'not-sent'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [certificateToDelete, setCertificateToDelete] = useState<CertificateWithDetails | null>(null)

  useEffect(() => {
    loadCertificates()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filterStatus, certificates])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certificates')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load certificates')
      }
      
      const certs = result.certificates || []
      setCertificates(certs)
      setFilteredCertificates(certs)
      console.log('Loaded certificates:', certs.length)
      console.log('Certificate data:', certs)
    } catch (error) {
      console.error('Error loading certificates:', error)
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = certificates

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cert =>
        cert.certificate_data.event_title?.toLowerCase().includes(query) ||
        cert.certificate_data.attendee_name?.toLowerCase().includes(query) ||
        cert.certificate_data.certificate_id?.toLowerCase().includes(query) ||
        cert.users?.name?.toLowerCase().includes(query) ||
        cert.users?.email?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus === 'sent') {
      filtered = filtered.filter(cert => cert.sent_via_email)
    } else if (filterStatus === 'not-sent') {
      filtered = filtered.filter(cert => !cert.sent_via_email)
    }

    setFilteredCertificates(filtered)
  }

  const handleDelete = async () => {
    if (!certificateToDelete) return

    try {
      const response = await fetch(`/api/certificates/${certificateToDelete.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete certificate')
      }
      
      toast.success('Certificate deleted successfully')
      setCertificates(certificates.filter(c => c.id !== certificateToDelete.id))
    } catch (error) {
      console.error('Error deleting certificate:', error)
      toast.error('Failed to delete certificate')
    } finally {
      setDeleteDialogOpen(false)
      setCertificateToDelete(null)
    }
  }

  const handleDownload = async (cert: CertificateWithDetails) => {
    const loadingToast = toast.loading('Preparing certificate download...')
    
    try {
      await downloadCertificate(cert.certificate_url, cert.certificate_filename)
      toast.dismiss(loadingToast)
      toast.success('Certificate downloaded successfully!')
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to download certificate')
    }
  }

  const handleResendEmail = async (cert: CertificateWithDetails) => {
    try {
      // TODO: Implement email resend API
      toast.info('Email resend feature will be available after migrations')
    } catch (error) {
      console.error('Error resending email:', error)
      toast.error('Failed to resend email')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const stats = {
    total: certificates.length,
    sent: certificates.filter(c => c.sent_via_email).length,
    notSent: certificates.filter(c => !c.sent_via_email).length,
    thisMonth: certificates.filter(c => {
      const date = new Date(c.generated_at)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/certificates')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Certificates</span>
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Certificates</h1>
                <p className="text-gray-600">View, download, and manage all generated certificates</p>
              </div>
            </div>
            <Button onClick={loadCertificates} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Not Sent</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.notSent}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by event, name, email, or certificate ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'sent' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('sent')}
                  size="sm"
                >
                  Sent
                </Button>
                <Button
                  variant={filterStatus === 'not-sent' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('not-sent')}
                  size="sm"
                >
                  Not Sent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Table */}
        {filteredCertificates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {certificates.length === 0 ? 'No certificates generated yet' : 'No certificates found'}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                {certificates.length === 0
                  ? 'Start generating certificates for your events to see them here.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {certificates.length === 0 && (
                <Button onClick={() => router.push('/certificates/generate')}>
                  Generate Certificates
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certificate ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {cert.users?.name || cert.certificate_data.attendee_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cert.users?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {cert.certificate_data.event_title || cert.events?.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(cert.certificate_data.event_date || cert.events?.date || cert.generated_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {cert.certificate_data.certificate_id}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(cert.generated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {cert.sent_via_email ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Not Sent
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(cert)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {!cert.sent_via_email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendEmail(cert)}
                                title="Send Email"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCertificateToDelete(cert)
                                setDeleteDialogOpen(true)
                              }}
                              title="Delete"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteFileDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          title="Delete Certificate"
          description={`Are you sure you want to delete the certificate for ${certificateToDelete?.certificate_data.attendee_name || 'this attendee'}? This action cannot be undone.`}
        />
      </div>
    </div>
  )
}



