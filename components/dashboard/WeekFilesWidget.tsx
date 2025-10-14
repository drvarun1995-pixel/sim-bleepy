'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  File,
  FileVideo,
  FileImage,
  BookOpen,
  FolderOpen,
  Sparkles,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ResourceFile {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: 'pdf' | 'video' | 'image' | 'document' | 'other';
  fileSize: string;
  uploadDate: string;
  teachingDate?: string;
  taughtBy?: string;
  downloadUrl: string;
  views: number;
  uploadedBy?: string;
  linkedEvents?: Array<{
    id: string;
    title: string;
    date: string;
    start_time?: string;
    location_name?: string;
  }>;
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  categories?: Array<{ id: string; name: string; color?: string }>
  format?: string
  formatColor?: string
  [key: string]: any
}

interface WeekFilesWidgetProps {
  weekEvents: Event[]
  className?: string
  userProfile?: {
    role_type?: string
    university?: string
    study_year?: string
    foundation_year?: string
    interests?: string[]
  }
}

// Format mapping - maps database format IDs to display info
const formatMapping: Record<string, { name: string; color: string; icon: any }> = {
  'a-e-practice-sessions': { name: 'A-E Practice Sessions', color: '#ef4444', icon: FileText },
  'bedside-teaching': { name: 'Bedside Teaching', color: '#f59e0b', icon: BookOpen },
  'clinical-skills': { name: 'Clinical Skills', color: '#10b981', icon: FileText },
  'core-teachings': { name: 'Core Teachings', color: '#3b82f6', icon: BookOpen },
  'exams-mocks': { name: 'Exams & Mocks', color: '#8b5cf6', icon: FileText },
  'grand-round': { name: 'Grand Round', color: '#f59e0b', icon: Sparkles },
  'hub-days': { name: 'Hub Days', color: '#06b6d4', icon: Calendar },
  'inductions': { name: 'Inductions', color: '#84cc16', icon: BookOpen },
  'obs-gynae-practice-sessions': { name: 'Obs & Gynae Practice', color: '#ec4899', icon: FileText },
  'osce-revision': { name: 'OSCE Revision', color: '#ef4444', icon: FileText },
  'others': { name: 'Others', color: '#6b7280', icon: FolderOpen },
  'paeds-practice-sessions': { name: 'Paeds Practice', color: '#14b8a6', icon: FileText },
  'pharmacy-teaching': { name: 'Pharmacy Teaching', color: '#a855f7', icon: BookOpen },
  'portfolio-drop-ins': { name: 'Portfolio Drop-ins', color: '#3b82f6', icon: FileText },
  'twilight-teaching': { name: 'Twilight Teaching', color: '#8b5cf6', icon: Clock },
  'virtual-reality-sessions': { name: 'Virtual Reality Sessions', color: '#06b6d4', icon: FileVideo }
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'presentation':
      return <FileText className="h-4 w-4" />;
    case 'spreadsheet':
      return <FileText className="h-4 w-4" />;
    case 'video':
      return <FileVideo className="h-4 w-4" />;
    case 'image':
      return <FileImage className="h-4 w-4" />;
    case 'audio':
      return <File className="h-4 w-4" />;
    case 'archive':
      return <FolderOpen className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

export function WeekFilesWidget({ weekEvents, className, userProfile }: WeekFilesWidgetProps) {
  const [files, setFiles] = useState<ResourceFile[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFilesForWeek()
  }, [userProfile])

  const fetchFilesForWeek = async () => {
    try {
      setLoading(true)
      
      // Build query params for user profile
      const params = new URLSearchParams()
      if (userProfile?.role_type) params.append('role_type', userProfile.role_type)
      if (userProfile?.university) params.append('university', userProfile.university)
      if (userProfile?.study_year) params.append('study_year', userProfile.study_year)
      if (userProfile?.foundation_year) params.append('foundation_year', userProfile.foundation_year)
      
      const response = await fetch(`/api/resources/week-files?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching week files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: ResourceFile) => {
    setDownloadingId(file.id)
    
    // Show initial toast
    toast.info('Preparing download...', {
      description: file.title || 'Your file is being prepared',
      duration: 2000,
    })
    
    try {
      // Fetch the file blob directly from our API
      const response = await fetch(`/api/resources/download/${file.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to download file')
      }
      
      // Get the blob data
      const blob = await response.blob()
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = file.title
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
        if (matches != null && matches[1]) {
          filename = decodeURIComponent(matches[1].replace(/['"]/g, ''))
        }
      }
      
      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
      
      // Track the download only if user has consented to analytics
      try {
        const cookiePreferences = localStorage.getItem('cookie-preferences')
        const cookieConsentGiven = localStorage.getItem('cookie-consent-given')
        
        let shouldTrack = true
        
        // Check if user has given consent at all
        if (!cookieConsentGiven) {
          shouldTrack = false
        } else if (cookiePreferences) {
          try {
            const preferences = JSON.parse(cookiePreferences)
            if (preferences.analytics === false) {
              shouldTrack = false
            }
          } catch (e) {
            shouldTrack = false
          }
        } else {
          shouldTrack = false
        }
        
        if (shouldTrack) {
          const trackResponse = await fetch('/api/downloads/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resourceId: file.id,
              resourceName: file.title,
              fileSize: blob.size,
              fileType: blob.type
            })
          })
          
          if (trackResponse.ok) {
            console.log('Download tracking - Successfully tracked download')
          }
        }
      } catch (trackingError) {
        console.error('Failed to track download:', trackingError)
      }

      // Show success message
      toast.success('Download started!', {
        description: `${filename} is now downloading`,
        duration: 3000,
      })
      
      // Reset state
      setTimeout(() => {
        setDownloadingId(null)
      }, 1500)
    } catch (error) {
      console.error('Error downloading file:', error)
      
      // Show error message
      toast.error('Download failed', {
        description: 'There was an error downloading the file. Please try again.',
        duration: 4000,
      })
      
      // Reset state
      setDownloadingId(null)
    }
  }

  // Get unique formats from week events
  const weekFormats = Array.from(new Set(weekEvents.map(event => event.format).filter(Boolean)))

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>This Week's Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Recent Teaching Files</h2>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">Files from your recent teaching events</p>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 border-purple-200 self-start sm:self-center flex-shrink-0">
            {files.length} files
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent files</h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
              Files from your recent teaching events will appear here. Check back after your next teaching session!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const formatInfo = formatMapping[file.category] || { 
                name: file.category, 
                color: '#6b7280', 
                icon: FileText 
              }
              const IconComponent = formatInfo.icon

              return (
                <div
                  key={file.id}
                  className="group p-4 rounded-xl border border-gray-200/60 hover:border-gray-300/80 hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header with category and title */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                            <IconComponent className="h-4 w-4" style={{ color: formatInfo.color }} />
                          </div>
                          <div>
                            <Badge 
                              variant="outline" 
                              className="text-xs font-medium px-2.5 py-1"
                              style={{ 
                                borderColor: formatInfo.color, 
                                color: formatInfo.color,
                                backgroundColor: `${formatInfo.color}15`
                              }}
                            >
                              {formatInfo.name}
                            </Badge>
                            <h3 className="font-semibold text-sm mt-2 text-gray-900 leading-tight break-words">
                              {file.title}
                            </h3>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                          className="h-9 w-9 p-0 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {file.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 break-words leading-relaxed">
                          {file.description}
                        </p>
                      )}

                      {/* File details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <div className="p-0.5 rounded bg-gray-100">
                              {getFileIcon(file.fileType)}
                            </div>
                            <span className="font-medium capitalize">{file.fileType}</span>
                          </div>
                          
                          {file.taughtBy && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                              <span className="font-medium">Taught by {file.taughtBy}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="font-medium">File Size:</span>
                          <span className="font-semibold">{file.fileSize}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Show teaching details from linked events */}
                  {file.linkedEvents && file.linkedEvents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100/80">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        {file.linkedEvents.slice(0, 1).map((event) => {
                          // Convert time to 12-hour format (e.g., "15:30:00" -> "3:30PM")
                          const formatTime = (timeString: string) => {
                            if (!timeString) return '';
                            const [hours, minutes] = timeString.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            return `${displayHour}:${minutes}${ampm}`;
                          };

                          return (
                            <>
                              <div key={`${event.id}-date`} className="flex items-center gap-1.5 text-gray-600 min-w-0 flex-shrink-0">
                                <div className="p-1 rounded bg-blue-50 flex-shrink-0">
                                  <Calendar className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="font-medium whitespace-nowrap">{format(new Date(event.date), 'MMM d')}</span>
                              </div>
                              <div key={`${event.id}-time`} className="flex items-center gap-1.5 text-gray-600 min-w-0 flex-shrink-0">
                                <div className="p-1 rounded bg-green-50 flex-shrink-0">
                                  <Clock className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="font-medium whitespace-nowrap">{formatTime(event.start_time)}</span>
                              </div>
                              {event.location_name && (
                                <div key={`${event.id}-location`} className="flex items-center gap-1.5 text-gray-600 min-w-0">
                                  <div className="p-1 rounded bg-orange-50 flex-shrink-0">
                                    <MapPin className="h-3 w-3 text-orange-600" />
                                  </div>
                                  <span className="font-medium break-words min-w-0">{event.location_name}</span>
                                </div>
                              )}
                            </>
                          );
                        })}
                        {file.linkedEvents.length > 1 && (
                          <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            <span className="font-medium whitespace-nowrap">+{file.linkedEvents.length - 1} more event(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
