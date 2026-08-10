'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Download, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function GuestCertificatePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const certificateId = params.certificateId as string
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    if (!certificateId || !token) return null
    return `/api/certificates/guest/${certificateId}?token=${encodeURIComponent(token)}`
  }, [certificateId, token])

  const downloadUrl = useMemo(() => {
    if (!apiUrl) return null
    return `${apiUrl}&download=1`
  }, [apiUrl])

  useEffect(() => {
    if (!apiUrl) {
      setError('This certificate link is invalid or incomplete.')
      setLoading(false)
      return
    }

    let objectUrl: string | null = null
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(apiUrl)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Unable to open certificate')
        }
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to open certificate')
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiUrl])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingScreen message="Loading your certificate..." fullScreen={false} />
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center bg-slate-50 px-4">
        <Card className="w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h1 className="text-lg font-semibold text-slate-900">Certificate unavailable</h1>
            <p className="mt-2 text-sm text-slate-600">
              {error || 'This certificate link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your certificate</h1>
            <p className="mt-1 text-sm text-slate-600">
              No login required. You can download a copy for your records.
            </p>
          </div>
          {downloadUrl && (
            <Button asChild>
              <a href={downloadUrl}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-3 sm:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt="Certificate of attendance"
              className="mx-auto h-auto w-full max-w-3xl rounded border border-slate-200 bg-white shadow-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
