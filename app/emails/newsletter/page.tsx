'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { useRole } from '@/lib/useRole'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  buildWeeklyNewsletterEmail,
  defaultWeeklyNewsletter,
  type WeeklyNewsletterData,
} from '@/lib/email-templates/newsletter'
import {
  NEWSLETTER_CATEGORIES,
  NEWSLETTER_CATEGORY_GROUPS,
  canReceiveNewsletter,
  isNewsletterStaffUser,
  newsletterCategoryById,
  newsletterCategoryLabels,
  userInNewsletterCohort,
  usersForNewsletterCategories,
  usersForNewsletterCategory,
  type NewsletterUser,
} from '@/lib/email-templates/newsletter-categories'
import { isExcludedFromLearnerLists } from '@/lib/learner-targeting'
import { calendarCohortLabel, compareCohortLabels, isTestAccountEmail, previousCohortLabel, workingCohortLabel } from '@/lib/year-progression'
import { Mail, Newspaper, ChevronLeft, Loader2, Users, Check } from 'lucide-react'
import { cn } from '@/utils'

type Step = 'categories' | 'preview' | 'recipients'

function EmailNewsletterPage() {
  const { data: session, status } = useSession()
  const { role, loading: roleLoading, canSendAdminEmails } = useRole()
  const router = useRouter()

  const [step, setStep] = useState<Step>('categories')
  const [data, setData] = useState<WeeklyNewsletterData>(() => defaultWeeklyNewsletter())
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [previewPersona, setPreviewPersona] = useState('all')
  const [selectedCohort, setSelectedCohort] = useState(() => calendarCohortLabel())
  const [cohortOptions, setCohortOptions] = useState(['25-26', '26-27'])
  const cohortTouchedRef = useRef(false)
  const [users, setUsers] = useState<NewsletterUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const currentCohort = calendarCohortLabel()
  const fallbackMail = useMemo(() => buildWeeklyNewsletterEmail(data), [data])

  const selectedCategories = useMemo(
    () =>
      categoryIds
        .map((id) => newsletterCategoryById(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [categoryIds]
  )
  const categoryLabel = newsletterCategoryLabels(categoryIds) || 'your selection'
  const includesStaff = categoryIds.some(
    (id) => id === 'users' || newsletterCategoryById(id)?.group === 'Staff'
  )

  const matchingUsers = useMemo(
    () => usersForNewsletterCategories(users, categoryIds, selectedCohort, currentCohort),
    [users, categoryIds, selectedCohort, currentCohort]
  )

  const learnerCountForCohort = useMemo(
    () =>
      users.filter((user) => {
        if (isNewsletterStaffUser(user)) return false
        return userInNewsletterCohort(user, selectedCohort, currentCohort)
      }).length,
    [users, selectedCohort, currentCohort]
  )

  const visibleRecipients = useMemo(() => {
    const query = userSearch.toLowerCase().trim()
    const extras = users.filter(
      (user) => selectedUserIds.includes(user.id) && !matchingUsers.some((item) => item.id === user.id)
    )
    const inGroup = query
      ? matchingUsers.filter(
          (user) =>
            (user.name || '').toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query)
        )
      : matchingUsers
    const extraVisible = query
      ? extras.filter(
          (user) =>
            (user.name || '').toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query)
        )
      : extras
    const searchHits = query
      ? users.filter(
          (user) =>
            !matchingUsers.some((item) => item.id === user.id) &&
            !extras.some((item) => item.id === user.id) &&
            ((user.name || '').toLowerCase().includes(query) ||
              (user.email || '').toLowerCase().includes(query))
        )
      : []
    const seen = new Set<string>()
    return [...inGroup, ...extraVisible, ...searchHits].filter((user) => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
      return true
    })
  }, [matchingUsers, users, selectedUserIds, userSearch])

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
    const load = async () => {
      setUsersLoading(true)
      try {
        const usersRes = await fetch('/api/admin/users?limit=5000&lite=1')
        if (!usersRes.ok) throw new Error('Failed to load users')
        const json = await usersRes.json()
        const nextUsers = (json.users || []).filter(
          (user: NewsletterUser) =>
            canReceiveNewsletter(user) &&
            (isTestAccountEmail(user.email) || !isExcludedFromLearnerLists(user))
        )
        setUsers(nextUsers)

        const calendar = calendarCohortLabel()
        const previous = previousCohortLabel(calendar)
        const labels = Array.from(
          new Set(
            [calendar, previous, '25-26', '26-27']
              .filter((label): label is string => Boolean(label))
              .concat(
                nextUsers
                  .map((user: NewsletterUser) => String(user.academic_cohort || '').trim())
                  .filter((label: string) => /^\d{2}-\d{2}$/.test(label))
              )
          )
        ).sort(compareCohortLabels)
        setCohortOptions(labels)
        if (!cohortTouchedRef.current) {
          setSelectedCohort(workingCohortLabel(labels))
        }
      } catch (error) {
        console.error(error)
        toast.error('Unable to load users and cohorts')
      } finally {
        setUsersLoading(false)
      }
    }
    load()
  }, [session, canSendAdminEmails])

  useEffect(() => {
    setSelectedUserIds(matchingUsers.map((user) => user.id))
  }, [matchingUsers])

  useEffect(() => {
    if (!canSendAdminEmails || step === 'categories') return
    let active = true
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const response = await fetch('/api/admin/emails/newsletter-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, persona: previewPersona }),
        })
        if (!response.ok) throw new Error('Preview failed')
        const json = await response.json()
        if (!active) return
        setPreviewHtml(json.html || '')
        setPreviewSubject(json.subject || '')
      } catch (error) {
        console.error(error)
        if (!active) return
        setPreviewHtml(fallbackMail.html)
        setPreviewSubject(fallbackMail.subject)
      } finally {
        if (active) setPreviewLoading(false)
      }
    }, 350)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [data, previewPersona, canSendAdminEmails, step, fallbackMail.html, fallbackMail.subject])

  if (status === 'loading' || roleLoading || !role) {
    return <LoadingScreen message="Loading newsletter..." />
  }

  if (!canSendAdminEmails) return null

  const update = (patch: Partial<WeeklyNewsletterData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleGroup = (group: (typeof NEWSLETTER_CATEGORY_GROUPS)[number]) => {
    const ids = NEWSLETTER_CATEGORIES.filter((item) => item.group === group).map((item) => item.id)
    const allOn = ids.every((id) => categoryIds.includes(id))
    setCategoryIds((prev) =>
      allOn ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))
    )
  }

  const continueFromCategories = () => {
    if (categoryIds.length === 0) {
      toast.error('Select at least one category')
      return
    }
    const first = newsletterCategoryById(categoryIds[0])
    setPreviewPersona(first?.persona || 'all')
    setUserSearch('')
    setStep('preview')
  }

  const confirmRecipients = () => {
    setStep('recipients')
  }

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const sendNewsletter = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Select at least one recipient')
      return
    }
    const mail = buildWeeklyNewsletterEmail(data)
    setIsSending(true)
    try {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: mail.subject,
          html: mail.html,
          recipientScope: 'individual',
          recipientIds: selectedUserIds,
          recipientCohort: selectedCohort === '__all__' ? null : selectedCohort,
          isNewsletter: true,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Failed to send')
      toast.success(`Newsletter sent to ${json.sent} recipients`)
      setStep('categories')
      setCategoryIds([])
      setSelectedUserIds([])
      setUserSearch('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send newsletter')
    } finally {
      setIsSending(false)
    }
  }

  const countFor = (id: string) =>
    usersForNewsletterCategory(users, id, selectedCohort, currentCohort).length

  return (
    <DashboardLayoutClient
      role={role as any}
      userName={session?.user?.name || session?.user?.email || undefined}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 px-1 sm:px-0">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <Newspaper className="h-6 w-6 text-teal-700" />
            Weekly newsletter
          </h1>
          <p className="mt-1 text-slate-600">
            Choose one or more categories, check the email, then confirm who it goes to.
          </p>
        </div>

        <ol className="flex flex-wrap gap-2 text-sm font-medium">
          {[
            { id: 'categories', label: '1. Categories' },
            { id: 'preview', label: '2. Preview & edit' },
            { id: 'recipients', label: '3. Recipients' },
          ].map((item) => (
            <li
              key={item.id}
              className={cn(
                'rounded-full px-3 py-1',
                step === item.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {item.label}
            </li>
          ))}
        </ol>

        <div className="flex max-w-sm flex-col gap-1">
          <Label>Cohort</Label>
          <Select
            value={selectedCohort}
            onValueChange={(value) => {
              cohortTouchedRef.current = true
              setSelectedCohort(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All cohorts</SelectItem>
              {cohortOptions.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                  {label === currentCohort ? ' (latest)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            {usersLoading
              ? 'Loading people…'
              : selectedCohort === '__all__'
                ? `${learnerCountForCohort} students and FY doctors across all cohorts`
                : `${learnerCountForCohort} students and FY doctors in ${selectedCohort}`}
          </p>
        </div>

        {step === 'categories' && (
          <Card>
            <CardHeader>
              <CardTitle>Who is this week’s newsletter for?</CardTitle>
              <CardDescription>
                Tick any mix of groups — all ARU years, ARU with UCL, Year 1 with FY2 and CTFs, and so
                on. People in more than one group are only counted once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usersLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading people in this cohort…
                </p>
              ) : null}

              {NEWSLETTER_CATEGORY_GROUPS.map((group) => {
                const groupIds = NEWSLETTER_CATEGORIES.filter((item) => item.group === group).map(
                  (item) => item.id
                )
                const allOn = groupIds.length > 0 && groupIds.every((id) => categoryIds.includes(id))
                return (
                <div key={group}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {group}
                    </h2>
                    {group !== 'Everyone' ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-teal-700 hover:underline"
                        onClick={() => toggleGroup(group)}
                      >
                        {allOn ? `Clear ${group}` : `Select all ${group}`}
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {NEWSLETTER_CATEGORIES.filter((item) => item.group === group).map((item) => {
                      const count = countFor(item.id)
                      const selected = categoryIds.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleCategory(item.id)}
                          aria-pressed={selected}
                          className={cn(
                            'relative rounded-xl border-2 p-4 text-left transition',
                            selected
                              ? 'border-teal-700 bg-teal-700 text-white shadow-md ring-4 ring-teal-200'
                              : 'border-slate-200 bg-white text-slate-900 hover:border-teal-500 hover:bg-teal-50/60 hover:shadow-sm'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full',
                              selected ? 'bg-white text-teal-700' : 'border border-slate-300 bg-white text-transparent'
                            )}
                            aria-hidden
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </span>
                          <p className={cn('pr-8 text-base font-semibold', selected ? 'text-white' : 'text-slate-900')}>
                            {item.label}
                          </p>
                          <p className={cn('mt-1 text-sm', selected ? 'text-teal-50' : 'text-slate-500')}>
                            {item.description}
                          </p>
                          <p className={cn('mt-3 text-sm font-semibold', selected ? 'text-white' : 'text-teal-700')}>
                            {usersLoading ? '—' : `${count} ${count === 1 ? 'person' : 'people'}`}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                )
              })}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-slate-600">
                  {categoryIds.length === 0
                    ? 'Select one or more categories to continue.'
                    : `${categoryIds.length} ${categoryIds.length === 1 ? 'category' : 'categories'} · ${matchingUsers.length} ${matchingUsers.length === 1 ? 'person' : 'people'} in total`}
                </p>
                <Button onClick={continueFromCategories} disabled={categoryIds.length === 0}>
                  Continue to preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setStep('categories')}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Categories
              </Button>
              <p className="text-sm text-slate-600">
                Preview for <strong>{categoryLabel}</strong>
                {selectedCohort !== '__all__' ? ` · cohort ${selectedCohort}` : ' · all cohorts'}
                . Each person still gets teaching and guides matched to their own profile.
              </p>
              <Button onClick={confirmRecipients} className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Confirm and select recipients
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Edit template</CardTitle>
                  <CardDescription>
                    Change the shared copy. Teaching and FY/student blocks still fill automatically
                    for each recipient.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 text-sm text-slate-700 space-y-2">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={data.includeThisWeekEvents !== false}
                        onChange={(e) => update({ includeThisWeekEvents: e.target.checked })}
                      />
                      <span>
                        <strong>Your teaching this week</strong> — events for the next 7 days,
                        matched to the recipient.
                      </span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={data.includePersonaSection !== false}
                        onChange={(e) => update({ includePersonaSection: e.target.checked })}
                      />
                      <span>
                        <strong>By profile</strong> — FY doctors see Foundation Year guides; students
                        see the AI simulator and SBA games.
                      </span>
                    </label>
                  </div>
                  <div>
                    <Label>Week label</Label>
                    <Input
                      className="mt-1"
                      value={data.weekLabel}
                      onChange={(e) => update({ weekLabel: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Headline</Label>
                    <Input
                      className="mt-1"
                      value={data.headline}
                      onChange={(e) => update({ headline: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Intro</Label>
                    <Textarea
                      className="mt-1 min-h-[96px]"
                      value={data.intro}
                      onChange={(e) => update({ intro: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Closing note</Label>
                    <Textarea
                      className="mt-1"
                      value={data.closingNote || ''}
                      onChange={(e) => update({ closingNote: e.target.value })}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setData(defaultWeeklyNewsletter())}>
                    Reset copy
                  </Button>
                </CardContent>
              </Card>

              <Card className="h-fit lg:sticky lg:top-4">
                <CardHeader>
                  <CardTitle>What they will receive</CardTitle>
                  <CardDescription className="truncate">
                    {previewLoading
                      ? 'Updating preview…'
                      : `Subject: ${previewSubject || fallbackMail.subject}`}
                  </CardDescription>
                  {selectedCategories.length > 1 ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedCategories.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPreviewPersona(item.persona)}
                            className={cn(
                              'rounded-lg px-3 py-1.5 text-sm font-semibold',
                              previewPersona === item.persona
                                ? 'bg-teal-700 text-white'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            {item.label}
                          </button>
                      ))}
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <iframe
                      title="Newsletter preview"
                      srcDoc={previewHtml || fallbackMail.html}
                      className="h-[1100px] w-full border-0 bg-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'recipients' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setStep('preview')}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Edit template
              </Button>
              <Button
                onClick={sendNewsletter}
                disabled={isSending || selectedUserIds.length === 0}
                className="inline-flex items-center gap-2"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isSending
                  ? 'Sending…'
                  : `Send to ${selectedUserIds.length} ${selectedUserIds.length === 1 ? 'person' : 'people'}`}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>
                  {categoryLabel} is selected
                  {includesStaff
                    ? '. Staff such as CTFs and MedEd Team are included even if they are not in this academic cohort.'
                    : selectedCohort !== '__all__'
                      ? ` in cohort ${selectedCohort}.`
                      : '.'}{' '}
                  Everyone in that group is ticked. Uncheck anyone who should not get this send, or
                  search to add someone else.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    Selected {selectedUserIds.length} of {matchingUsers.length}
                  </p>
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="font-semibold text-teal-700"
                      onClick={() => setSelectedUserIds(matchingUsers.map((user) => user.id))}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-slate-600"
                      onClick={() => setSelectedUserIds([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search this group, or type a name to add someone else"
                />
                <div className="max-h-96 divide-y overflow-y-auto rounded-lg border">
                  {visibleRecipients.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">
                      {userSearch.trim()
                        ? `No one matching “${userSearch.trim()}” in this send, or among other users.`
                        : 'No people in this category for the selected cohort.'}
                    </p>
                  ) : (
                    visibleRecipients.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{user.name || 'Unnamed user'}</div>
                          <div className="text-slate-500">{user.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayoutClient>
  )
}

export default EmailNewsletterPage
