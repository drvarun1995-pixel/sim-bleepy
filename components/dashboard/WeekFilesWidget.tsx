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
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'

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
    try {
      // Track download
      await fetch('/api/downloads/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: file.id,
          resourceName: file.title,
          fileSize: file.fileSize,
          fileType: file.fileType,
        }),
      })

      // Download file using the API endpoint
      const response = await fetch(`/api/resources/download/${file.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Recent Teaching Files</span>
          <Badge variant="secondary" className="ml-auto">
            {files.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No recent files</h3>
            <p className="text-xs text-gray-600">
              Files from your recent teaching events will appear here
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
                  className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <IconComponent className="h-3 w-3" style={{ color: formatInfo.color }} />
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: formatInfo.color, color: formatInfo.color }}
                        >
                          {formatInfo.name}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-xs mb-1 text-gray-900">
                        {file.title}
                      </h3>
                      
                      {file.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {file.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          {getFileIcon(file.fileType)}
                          <span className="capitalize">{file.fileType}</span>
                        </div>
                        {file.taughtBy && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Taught by {file.taughtBy}</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span>{file.fileSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        className="h-8 w-8 p-0 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Show teaching details from linked events */}
                  {file.linkedEvents && file.linkedEvents.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        {file.linkedEvents.slice(0, 1).map((event) => (
                          <div key={event.id} className="flex items-center space-x-3 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(event.date), 'MMM d')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{event.start_time}</span>
                            </div>
                            {event.location_name && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location_name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {file.linkedEvents.length > 1 && (
                          <p className="text-xs text-gray-500">
                            +{file.linkedEvents.length - 1} more event(s)
                          </p>
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
