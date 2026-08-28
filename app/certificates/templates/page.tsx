'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Trash2, Eye, Edit, Copy, Search, FileImage, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { generateCertificateImageUrl } from '@/lib/supabase-client'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'

const extractStoragePath = (path?: string | null): string | null => {
  if (!path || path.startsWith('data:')) {
    return null
  }

  if (path.includes('/storage/v1/object/sign/certificates/')) {
    const urlParts = path.split('/storage/v1/object/sign/certificates/')[1]
    return urlParts.split('?')[0]
  }

  if (path.includes('/storage/v1/object/public/certificates/')) {
    return path.split('/storage/v1/object/public/certificates/')[1]
  }

  if (path.startsWith('users/') || path.startsWith('template-images/')) {
    return path
  }

  if (path.startsWith('certificates/')) {
    return path.replace(/^certificates\//, '')
  }

  return null
}

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
  imagePath?: string | null
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

function TemplatePreview({ template }: { template: Template }) {
  const imageUrl = template.backgroundImage
  return (
    <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={template.name}
          className="h-full w-full object-contain bg-white"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400">
          <FileImage className="h-8 w-8" />
        </div>
      )}
    </div>
  )
}

export default function TemplatesPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false)
  const [activeTab, setActiveTab] = useState('yours')

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  useEffect(() => {
    if (session?.user?.id) {
      loadTemplates()
    }
  }, [session])

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
        const convertedTemplates = await Promise.all(result.templates.map(async (t: any) => {
          let imageUrl = t.background_image

          if (t.image_path) {
            if (t.image_path.startsWith('http')) {
              const urlParts = t.image_path.split('/storage/v1/object/sign/certificates/')
              if (urlParts.length > 1) {
                const storagePath = urlParts[1].split('?')[0]
                const freshSignedUrl = await generateCertificateImageUrl(storagePath)
                if (freshSignedUrl) {
                  imageUrl = freshSignedUrl
                }
              } else {
                imageUrl = t.image_path
              }
            } else {
              const signedUrl = await generateCertificateImageUrl(t.image_path)
              if (signedUrl) {
                imageUrl = signedUrl
              }
            }
          }

          return {
            id: t.id,
            name: t.name,
            backgroundImage: imageUrl,
            imagePath: extractStoragePath(t.image_path) ?? extractStoragePath(imageUrl),
            fields: t.fields || [],
            createdAt: t.created_at,
            canvasSize: t.canvas_size || { width: 800, height: 600 },
            isShared: t.is_shared || false,
            sharedAt: t.shared_at,
            createdBy: t.created_by,
            currentUserRole: result.currentUserRole,
            isOwnTemplate: t.created_by === session?.user?.id
          }
        }))
        setTemplates(convertedTemplates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    }
  }

  const handleDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return

    setIsDeletingTemplate(true)
    try {
      const response = await fetch('/api/certificates/templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: templateToDelete.id,
          imagePath: templateToDelete.imagePath || extractStoragePath(templateToDelete.backgroundImage)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template')
      }

      const updated = templates.filter(t => t.id !== templateToDelete.id)
      setTemplates(updated)

      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null)
      }

      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    } finally {
      setIsDeletingTemplate(false)
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
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

      const response = await fetch('/api/certificates/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: duplicate.id,
          name: duplicate.name,
          background_image: duplicate.backgroundImage,
          image_path: template.imagePath || extractStoragePath(template.backgroundImage) || duplicate.backgroundImage,
          fields: duplicate.fields,
          canvas_size: duplicate.canvasSize
        })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate template')
      }

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

  const userTemplates = filteredTemplates.filter(template => template.isOwnTemplate)
  const sharedTemplates = filteredTemplates.filter(
    template => template.isShared && !template.isOwnTemplate
  )

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-100 hover:text-blue-700">
            <Link href="/certificates">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Certificates</span>
            </Link>
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Saved Templates</h1>
          <p className="text-slate-600">
            Your designs stay in one place. Templates shared by other people sit in a separate tab.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button asChild>
              <Link href="/certificates/image-builder">
                <FileImage className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-[420px]">
              <TabsTrigger
                value="yours"
                className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Yours ({userTemplates.length})
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-lg py-2 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Shared with you ({sharedTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="yours" className="mt-0">
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Templates you created. Sharing one keeps it here — it does not move into Shared with you.
              </div>
              {userTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileImage className="mb-4 h-16 w-16 text-slate-300" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">
                      {searchQuery ? 'No matching templates' : 'No templates yet'}
                    </h3>
                    <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Create your first template in the Image Builder'}
                    </p>
                    {!searchQuery && (
                      <Button asChild>
                        <Link href="/certificates/image-builder">Create Template</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {userTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer border-slate-200 transition-all hover:shadow-lg ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="line-clamp-1 text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(template.createdAt).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TemplatePreview template={template} />
                        <div className="mb-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between">
                            <span>{template.fields.length} text fields</span>
                            {template.canvasSize && (
                              <span className="text-xs text-slate-400">
                                {template.canvasSize.width}x{template.canvasSize.height}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                              Your template
                            </span>
                            {template.isShared && (
                              <span className="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700">
                                Shared with others
                              </span>
                            )}
                          </div>
                        </div>
                        <label className="mb-3 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={template.isShared || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSharing(template.id, template.isShared || false)
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700">Share with others</span>
                        </label>
                        <div className="flex gap-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/certificates/image-builder?template=${template.id}`}>
                              <Edit className="mr-1 h-3 w-3" />
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
                              handleDeleteTemplate(template)
                            }}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-0">
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                Designs other people have shared. Use or copy one — it will then appear under Yours.
              </div>
              {sharedTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="mb-4 h-16 w-16 text-slate-300" />
                    <h3 className="mb-2 text-lg font-semibold text-slate-700">No shared templates</h3>
                    <p className="max-w-sm text-center text-sm text-slate-500">
                      Templates shared by other users will appear here. Yours stay in the Yours tab even if you share them.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sharedTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer border-slate-200 transition-all hover:shadow-lg ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-teal-500' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="line-clamp-1 text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(template.createdAt).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TemplatePreview template={template} />
                        <div className="mb-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between">
                            <span>{template.fields.length} text fields</span>
                            {template.canvasSize && (
                              <span className="text-xs text-slate-400">
                                {template.canvasSize.width}x{template.canvasSize.height}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-700">
                              Shared with you
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                            <Link href={`/certificates/image-builder?use=${template.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              Use
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        description="This action will permanently remove the template and its associated image."
        itemName={templateToDelete?.name}
        isLoading={isDeletingTemplate}
        confirmText="Delete Template"
      />
    </div>
  )
}
