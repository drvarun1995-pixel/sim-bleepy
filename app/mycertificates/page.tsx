'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { 
  Award, 
  Download, 
  Search, 
  Calendar,
  FileText,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import { downloadCertificate, type CertificateWithDetails } from '@/lib/certificates'
import { toast } from 'sonner'

export default function MyCertificatesPage() {
  const { data: session } = useSession()
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user) {
      loadCertificates()
    }
  }, [session])

  useEffect(() => {
    // Filter certificates based on search query
    if (searchQuery.trim() === '') {
      setFilteredCertificates(certificates)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = certificates.filter(cert => 
        cert.certificate_data.event_title?.toLowerCase().includes(query) ||
        cert.certificate_data.attendee_name?.toLowerCase().includes(query) ||
        cert.certificate_data.certificate_id?.toLowerCase().includes(query)
      )
      setFilteredCertificates(filtered)
    }
  }, [searchQuery, certificates])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certificates/my')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load certificates')
      }
      
      const certs = result.certificates || []
      setCertificates(certs)
      setFilteredCertificates(certs)
      console.log('Loaded my certificates:', certs.length)
      console.log('Certificate URLs:', certs.map((c: any) => ({ id: c.id, url: c.certificate_url })))
    } catch (error) {
      console.error('Error loading certificates:', error)
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCertificateImageUrl = (cert: CertificateWithDetails) => {
    console.log('🔍 Certificate data for', cert.id, ':', {
      certificate_url: cert.certificate_url,
      certificate_filename: cert.certificate_filename,
      id: cert.id
    })
    
    // Use direct signed URL if available (from certificate_url)
    // But avoid public URLs on private buckets - they will fail
    if (cert.certificate_url && cert.certificate_url.startsWith('http') && !cert.certificate_url.includes('/storage/v1/object/public/')) {
      console.log('✅ Using direct certificate URL for cert', cert.id, ':', cert.certificate_url)
      return cert.certificate_url
    }
    
    // For private bucket, use the view API endpoint to get signed URLs
    let filePath = cert.certificate_url || cert.certificate_filename || ''
    
    // If it's a public URL, extract the storage path
    if (filePath.includes('/storage/v1/object/public/certificates/')) {
      filePath = filePath.split('/storage/v1/object/public/certificates/')[1]
      console.log('🔍 Extracted storage path from public URL:', filePath)
    }
    
    if (filePath) {
      const viewUrl = `/api/certificates/view?path=${encodeURIComponent(filePath)}`
      console.log('🔗 Using view API for cert', cert.id, ':', viewUrl)
      return viewUrl
    }
    
    // Last resort: use thumbnail API
    const thumbnailUrl = `/api/certificates/thumbnail?path=${encodeURIComponent(filePath)}&width=300&height=225`
    console.log('🖼️ Using thumbnail API for cert', cert.id, ':', thumbnailUrl)
    return thumbnailUrl
  }

  const handleImageError = (certId: string) => {
    setImageErrors(prev => new Set(prev).add(certId))
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
              <p className="text-gray-600">View and download your event certificates</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">This Year</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {certificates.filter(c => 
                      new Date(c.generated_at).getFullYear() === new Date().getFullYear()
                    ).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {certificates.filter(c => {
                      const date = new Date(c.generated_at)
                      const now = new Date()
                      return date.getMonth() === now.getMonth() && 
                             date.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by event name, certificate ID, or your name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {certificates.length === 0 ? 'No certificates yet' : 'No certificates found'}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                {certificates.length === 0 
                  ? 'Your certificates will appear here once you attend events and they are issued by the organizers.'
                  : 'Try a different search term.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {cert.certificate_data.event_title || cert.events?.title || 'Certificate'}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(cert.certificate_data.event_date || cert.events?.date || cert.generated_at)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Certificate Preview */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden border">
                    {!imageErrors.has(cert.id) ? (
                      <img
                        src={getCertificateImageUrl(cert)}
                        alt={`Certificate for ${cert.certificate_data.event_title || cert.events?.title || 'Event'}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(cert.id)}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Image unavailable</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                      <p className="text-white text-xs font-mono truncate">
                        ID: {cert.certificate_data.certificate_id}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Issued: {formatDate(cert.generated_at)}</span>
                    </div>
                    {cert.events?.locations?.name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                        <span className="truncate">{cert.events.locations.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleDownload(cert)}
                      className="flex-1"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        {certificates.length > 0 && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Keep for Your Records</h3>
                  <p className="text-sm text-blue-700">
                    These certificates are proof of your attendance and can be used for CPD (Continuing Professional Development) 
                    portfolios, job applications, and professional records. Download and save them securely.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
