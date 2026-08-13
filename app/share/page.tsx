'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Check,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const DEFAULT_SHARE_URL = 'https://sim.bleepy.co.uk'
const SHARE_TEXT =
  'I’ve been using Bleepy for medical education — worth a look for students and foundation doctors:'

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.717-8.739L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function SharePageInner() {
  const searchParams = useSearchParams()
  const shareUrl = useMemo(() => {
    const u = searchParams.get('url') || DEFAULT_SHARE_URL
    try {
      const parsed = new URL(u, DEFAULT_SHARE_URL)
      if (!/^https?:$/i.test(parsed.protocol)) return DEFAULT_SHARE_URL
      return parsed.toString()
    } catch {
      return DEFAULT_SHARE_URL
    }
  }, [searchParams])

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${shareUrl}`)
  const encodedSubject = encodeURIComponent('Check out Bleepy')
  const [copied, setCopied] = useState(false)

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied', { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the link manually')
    }
  }, [shareUrl])

  const nativeShare = useCallback(async () => {
    if (!navigator.share) {
      await copyLink()
      return
    }
    try {
      await navigator.share({
        title: 'Bleepy',
        text: SHARE_TEXT,
        url: shareUrl,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      await copyLink()
    }
  }, [copyLink, shareUrl])

  const openShare = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const channels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      description: 'Send via WhatsApp',
      className: 'bg-[#25D366] hover:bg-[#1ebe57] text-white',
      icon: <MessageCircle className="h-5 w-5" />,
      onClick: () => openShare(`https://wa.me/?text=${encodedText}`),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      description: 'Share on Facebook',
      className: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      icon: <Facebook className="h-5 w-5" />,
      onClick: () =>
        openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      description: 'Share on LinkedIn',
      className: 'bg-[#0A66C2] hover:bg-[#0958a8] text-white',
      icon: <Linkedin className="h-5 w-5" />,
      onClick: () =>
        openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`),
    },
    {
      id: 'x',
      label: 'X',
      description: 'Share on X',
      className: 'bg-black hover:bg-neutral-800 text-white',
      icon: <XIcon className="h-5 w-5" />,
      onClick: () =>
        openShare(`https://twitter.com/intent/tweet?text=${encodedText}`),
    },
    {
      id: 'email',
      label: 'Email',
      description: 'Share by email',
      className: 'bg-teal-700 hover:bg-teal-800 text-white',
      icon: <Mail className="h-5 w-5" />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedText}`
      },
    },
    {
      id: 'sms',
      label: 'Message',
      description: 'Share via SMS / iMessage',
      className: 'bg-slate-700 hover:bg-slate-800 text-white',
      icon: <MessageCircle className="h-5 w-5" />,
      onClick: () => {
        // iOS uses sms:&body= ; Android often sms:?body=
        window.location.href = `sms:?&body=${encodedText}`
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/Bleepy-Logo-1-1.webp" alt="Bleepy" width={40} height={40} />
          <div>
            <p className="text-lg font-semibold text-slate-900">Share Bleepy</p>
            <p className="text-sm text-slate-500">Medical Education</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Recommend Bleepy
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Choose how you want to share. Instagram does not support direct web sharing of links —
          copy the link, then paste it in a story or DM.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Link</p>
          <p className="mt-1 break-all text-sm text-slate-800">{shareUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button type="button" size="sm" className="bg-teal-700 hover:bg-teal-800" onClick={nativeShare}>
              <Share2 className="mr-1.5 h-4 w-4" />
              Device share
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={ch.onClick}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left shadow-sm transition ${ch.className}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                {ch.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold">{ch.label}</span>
                <span className="block text-xs opacity-90">{ch.description}</span>
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={async () => {
              await copyLink()
              window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
            }}
            className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-4 py-3 text-left text-white shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <Instagram className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Instagram</span>
              <span className="block text-xs opacity-90">Copy link, then open Instagram to paste</span>
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-teal-700 hover:underline">
            Back to Bleepy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
      }
    >
      <SharePageInner />
    </Suspense>
  )
}
