'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Trash2, Eye, Edit, Copy, Search, FileImage } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface TextField {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: string
  textAlign: string
  width: number
  height: number
  dataSource: string
  customValue?: string
}

interface Template {
  id: string
  name: string
  backgroundImage: string
  fields: TextField[]
  createdAt: string
  canvasSize?: {
    width: number
    height: number
  }
  isShared?: boolean
  sharedAt?: string
  createdBy?: string
  currentUserRole?: string
  isOwnTemplate?: boolean
}

export default function TemplatesPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/certificates/templates')
      const result = await response.json()

      if (!response.ok) {
        console.error('Error loading templates:', result.error)
        toast.error('Failed to load templates')
        return
      }

      if (result.templates) {
        // Convert database format to frontend format
        const convertedTemplates = result.templates.map((t: any) => {
          // Use image_path if available (should be signed URL), otherwise fall back to background_image (base64)
          let imageUrl = t.background_image
          if (t.image_path) {
            imageUrl = t.image_path // This should now be a signed URL
          }
          
          return {
            id: t.id,
            name: t.name,
            backgroundImage: imageUrl,
            fields: t.fields || [],
            createdAt: t.created_at,
            canvasSize: t.canvas_size || { width: 800, height: 600 },
            isShared: t.is_shared || false,
            sharedAt: t.shared_at,
            createdBy: t.created_by,
            currentUserRole: result.currentUserRole,
            isOwnTemplate: t.created_by === session?.user?.id
          }
        })
        setTemplates(convertedTemplates)
        console.log('Loaded templates:', convertedTemplates.length)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    const confirmed = confirm('Are you sure you want to delete this template?')
    if (!confirmed) return

    try {
      // Call the DELETE API endpoint
      const response = await fetch('/api/certificates/templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template')
      }

      // Remove from local state
      const updated = templates.filter(t => t.id !== templateId)
      setTemplates(updated)
      
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
      }
      
      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    }
  }

  const toggleSharing = async (templateId: string, currentSharedStatus: boolean) => {
    try {
      const response = await fetch(`/api/certificates/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isShared: !currentSharedStatus
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error updating template sharing:', result.error)
        toast.error('Failed to update template sharing')
        return
      }

      toast.success(`Template ${!currentSharedStatus ? 'shared' : 'unshared'} successfully`)
      loadTemplates()
    } catch (error) {
      console.error('Error updating template sharing:', error)
      toast.error('Failed to update template sharing')
    }
  }

  const duplicateTemplate = async (template: Template) => {
    try {
      const duplicate: Template = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString()
      }

      // Save the duplicate to the database via API
      const response = await fetch('/api/certificates/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: duplicate.id,
          name: duplicate.name,
          background_image: duplicate.backgroundImage,
          image_path: duplicate.backgroundImage, // Pass the image URL for duplication
          fields: duplicate.fields,
          canvas_size: duplicate.canvasSize
        })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate template')
      }

      // Refresh the templates list
      await loadTemplates()
      toast.success('Template duplicated successfully')
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Failed to duplicate template')
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit">
            <Link href="/certificates">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Certificates</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Templates</h1>
          <p className="text-gray-600">Manage your certificate templates</p>
        </div>

        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileImage className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchQuery ? 'No templates found' : 'No templates yet'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
                    {searchQuery 
                      ? 'Try a different search term'
                      : 'Create your first template in the Image Builder'}
                  </p>
                  {!searchQuery && (
                    <Button asChild>
                      <Link href="/certificates/image-builder">
                        Create Template
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(template.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Preview thumbnail */}
                      <div className="relative w-full bg-gray-50 rounded-lg overflow-hidden mb-3 border-2 border-gray-300" style={{ height: '160px' }}>
                        {template.backgroundImage ? (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <img
                              src={template.backgroundImage}
                              alt={template.name}
                              className="block"
                              style={{ 
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                              }}
                              onLoad={(e) => {
                                console.log('✅ Image loaded successfully for template:', template.name)
                                console.log('🔍 Image element:', e.currentTarget)
                              }}
                              onError={(e) => {
                                console.error('❌ Failed to load template image for:', template.name)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <span>No image</span>
                          </div>
                        )}
                      </div>

                      {/* Template info */}
                      <div className="text-sm text-gray-600 mb-3">
                        <div className="flex items-center justify-between">
                          <span>{template.fields.length} text fields</span>
                          {template.canvasSize && (
                            <span className="text-xs text-gray-400">
                              {template.canvasSize.width}x{template.canvasSize.height}
                            </span>
                          )}
                        </div>
                        
                        {/* Template ownership and sharing status */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {template.isOwnTemplate ? (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Your Template
                              </span>
                            ) : (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                Shared by Others
                              </span>
                            )}
                            {template.isShared && (
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                Publicly Shared
                              </span>
                            )}
                          </div>
                          {template.sharedAt && (
                            <span className="text-xs text-gray-400">
                              Shared {new Date(template.sharedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sharing toggle - only show for template owners or admins */}
                      {(template.currentUserRole === 'admin' || template.isOwnTemplate) && (
                        <div className="mb-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={template.isShared || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleSharing(template.id, template.isShared || false)
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Share with others</span>
                          </label>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="flex-1"
                        >
                          <Link href={`/certificates/image-builder?template=${template.id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateTemplate(template)
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}


