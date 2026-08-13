'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle, Send, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  FEEDBACK_PATHWAYS,
  FEEDBACK_RECOMMEND,
  FEEDBACK_USEFUL,
  type FeedbackPathway,
  type FeedbackRecommend,
  type FeedbackUseful,
} from '@/lib/site-feedback'

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-800'
      }`}
    >
      {children}
    </button>
  )
}

function SiteFeedbackInner() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source') || 'website'
  const fromGraduate = source === 'graduate-email'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pathway, setPathway] = useState<FeedbackPathway | ''>('')
  const [rating, setRating] = useState<number | null>(null)
  const [recommend, setRecommend] = useState<FeedbackRecommend | ''>('')
  const [mostUseful, setMostUseful] = useState<FeedbackUseful[]>([])
  const [message, setMessage] = useState('')
  const [quoteConsent, setQuoteConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!siteKey) return
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => setRecaptchaReady(true))
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.onload = () => {
      window.grecaptcha?.ready(() => setRecaptchaReady(true))
    }
    document.head.appendChild(script)
  }, [])

  const toggleUseful = (value: FeedbackUseful) => {
    setMostUseful((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!pathway) {
      toast.error('Please tell us your role on Bleepy')
      return
    }
    if (rating == null) {
      toast.error('Please give an overall rating')
      return
    }
    if (!recommend) {
      toast.error('Please say whether you would recommend Bleepy')
      return
    }
    setSubmitting(true)
    try {
      let recaptchaToken: string | undefined
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      if (siteKey && recaptchaReady && window.grecaptcha) {
        try {
          recaptchaToken = await window.grecaptcha.execute(siteKey, {
            action: 'site_feedback',
          })
        } catch {
          // Optional in rare load failures
        }
      }

      const res = await fetch('/api/site-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          pathway,
          rating,
          recommend,
          mostUseful,
          quoteConsent,
          message,
          source,
          recaptchaToken,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send feedback')
      setDone(true)
      toast.success('Thanks for your feedback')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Image src="/Bleepy-Logo-1-1.webp" alt="Bleepy" width={32} height={32} />
          <div>
            <p className="text-sm font-semibold text-white">Bleepy</p>
            <p className="text-xs text-slate-400">Medical Education</p>
          </div>
        </div>
        <div className="bg-teal-700">
          <div className="mx-auto max-w-lg px-4 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-100">
              {fromGraduate ? 'Graduate / alumni' : 'Platform feedback'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {fromGraduate ? 'How was Bleepy for you?' : 'Share your feedback'}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
        {done ? (
          <div className="rounded-2xl border border-teal-100 bg-white p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto h-12 w-12 text-teal-700" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Thank you</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {fromGraduate
                ? 'Your response helps us improve Bleepy for the next cohort of students and foundation doctors.'
                : 'Your feedback helps us improve Bleepy for learners and educators.'}
            </p>
            {quoteConsent ? (
              <p className="mt-3 text-xs text-slate-500">
                If we use a comment in a summary, it will be anonymous unless we contact you first.
              </p>
            ) : null}
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-teal-700 hover:underline">
              Return to Bleepy
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-600">
              {fromGraduate
                ? 'Three short questions, then a comment if you have one. No login required. Responses are used to improve the platform and, with your permission, in anonymised summaries.'
                : 'A few short questions so we can improve Bleepy. No login required.'}
            </p>

            <form
              onSubmit={submit}
              className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-900">
                  Your role on Bleepy <span className="text-red-600">*</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_PATHWAYS.map((item) => (
                    <Chip
                      key={item.value}
                      selected={pathway === item.value}
                      onClick={() => setPathway(item.value)}
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-900">
                  Overall, how useful was Bleepy? <span className="text-red-600">*</span>
                </legend>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="rounded-md p-1.5 transition hover:bg-amber-50"
                      aria-label={`${n} out of 5`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          rating != null && n <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating != null ? (
                    <span className="ml-2 text-sm text-slate-600">{rating}/5</span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">1 = not useful · 5 = very useful</p>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-900">
                  Would you recommend Bleepy to a colleague or junior?{' '}
                  <span className="text-red-600">*</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_RECOMMEND.map((item) => (
                    <Chip
                      key={item.value}
                      selected={recommend === item.value}
                      onClick={() => setRecommend(item.value)}
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-900">
                  What helped most? <span className="font-normal text-slate-500">(optional)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_USEFUL.map((item) => (
                    <Chip
                      key={item.value}
                      selected={mostUseful.includes(item.value)}
                      onClick={() => toggleUseful(item.value)}
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="message">
                  What should we keep or change? <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  rows={5}
                  placeholder={
                    fromGraduate
                      ? 'One thing that helped, and one thing we should improve for the next cohort.'
                      : 'What worked well, and what should we improve?'
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <Checkbox
                  checked={quoteConsent}
                  onCheckedChange={(checked) => setQuoteConsent(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  You may use this feedback in anonymised teaching or research summaries. Do not
                  publish my name without asking me.
                </span>
              </label>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-700 hover:bg-teal-800"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending…' : 'Send feedback'}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Stored in the Bleepy feedback inbox. We do not use this to send marketing.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function SiteFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
      }
    >
      <SiteFeedbackInner />
    </Suspense>
  )
}
