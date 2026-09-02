'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { X } from 'lucide-react'

export default function FeedbackQrDisplayPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('Event feedback')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/feedback/forms/${formId}`)
        const data = await res.json()
        const form = data.form || data.feedbackForm
        setImageUrl(form?.qr_code_image_url || null)
        setTitle(form?.events?.title || form?.form_name || 'Event feedback')
      } finally {
        setLoading(false)
      }
    })()
  }, [formId, session, status, router])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') router.back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] w-full items-center justify-center bg-black">
        <LoadingScreen message="Loading feedback QR…" fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4.25rem)] w-full flex-col bg-black text-white">
      <div className="flex justify-end p-4">
        <Button
          variant="outline"
          className="bg-white text-gray-900 hover:bg-gray-100"
          onClick={() => router.back()}
        >
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 text-center">
        <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Scan to give feedback</p>
        <h1 className="mb-6 max-w-3xl text-2xl font-semibold sm:text-3xl">{title}</h1>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Feedback QR code"
            className="max-h-[min(72vh,72vw)] max-w-[min(72vh,72vw)] rounded-xl bg-white p-4"
          />
        ) : (
          <p className="text-sm text-white/70">
            No QR is stored for this form yet. Run the SQL migration, then reopen this page.
          </p>
        )}
        <p className="mt-6 text-sm text-white/60">Press Escape to close</p>
      </div>
    </div>
  )
}
