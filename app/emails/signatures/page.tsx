'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TiptapSimpleEditor } from '@/components/ui/tiptap-simple-editor'
import { Mail, Loader2, Save, Trash2 } from 'lucide-react'

interface EmailSignature {
  id: string
  content_html: string
  created_at: string
  updated_at: string
}

function EmailSignaturesPageInner() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()
  const [signature, setSignature] = useState<EmailSignature | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])

  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (!canSendAdminEmails) {
      toast.error('Access denied. Admin or MedEd Team role required.')
      router.push('/dashboard')
    }
  }, [session, status, canSendAdminEmails, roleLoading, router])

  useEffect(() => {
    if (!session || !canSendAdminEmails) return

    const fetchSignature = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/emails/signatures')
        if (!response.ok) {
          if (response.status === 404) {
            // No signature exists yet, that's fine
            setSignature(null)
            setContent('')
            return
          }
          throw new Error('Failed to load signature')
        }
        const data = await response.json()
        if (data.signature) {
          setSignature(data.signature)
          setContent(data.signature.content_html || '')
        } else {
          setSignature(null)
          setContent('')
        }
      } catch (error) {
        console.error('Failed to fetch signature:', error)
        toast.error('Unable to load signature')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSignature()
  }, [session, canSendAdminEmails])

  const handleImageUploaded = useCallback((path: string) => {
    setUploadedPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
  }, [])

  const handleSave = async () => {
    if (!canSendAdminEmails) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/emails/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_html: content,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save signature')
      }

      toast.success('Signature saved successfully')
      setSignature(data.signature)
    } catch (error: any) {
      console.error('Failed to save signature:', error)
      toast.error(error?.message || 'Failed to save signature')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canSendAdminEmails || !signature) return

    if (!confirm('Are you sure you want to delete your signature? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/emails/signatures', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete signature')
      }

      toast.success('Signature deleted successfully')
      setSignature(null)
      setContent('')
      setUploadedPaths([])
    } catch (error: any) {
      console.error('Failed to delete signature:', error)
      toast.error(error?.message || 'Failed to delete signature')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  if (!canSendAdminEmails) {
    return null
  }

  return (
    <DashboardLayoutClient role={role as any} userName={session?.user?.name || session?.user?.email || undefined}>
      <div className="w-full max-w-7xl mx-auto space-y-6 px-1 sm:px-0">
        <div className="px-1 sm:px-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Email Signatures
            </h1>
          </div>
          <p className="text-slate-600 mt-1">
            Create and manage your email signature. You can use rich text formatting and upload images.
          </p>
        </div>

        {isLoading ? (
          <Card className="sm:rounded-xl rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="sm:rounded-xl rounded-lg">
            <CardHeader className="p-2 sm:p-6 pb-0">
              <CardTitle>Your Signature</CardTitle>
              <CardDescription>
                {signature
                  ? `Last updated: ${new Date(signature.updated_at).toLocaleString()}`
                  : 'Create your email signature below'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-2 sm:p-6 pt-4">
              <div>
                <TiptapSimpleEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Enter your email signature here... You can include your name, title, contact information, and images."
                  uploadContext="signature"
                  onImageUploaded={handleImageUploaded}
                />
              </div>
              <div className="flex justify-between items-center">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || !signature || isSaving}
                  className="inline-flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Signature
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isDeleting}
                  className="inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Signature'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutClient>
  )
}

export default function EmailSignaturesPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading email signatures..." />}>
      <EmailSignaturesPageInner />
    </Suspense>
  )
}

