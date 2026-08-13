'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STORAGE_KEY = 'ctf-event-tools-warning'

export function CtfEventToolsWarning({
  role,
  area,
}: {
  role: string
  area: 'event-data' | 'bulk-upload'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (role !== 'ctf') return
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      // Ignore blocked storage and still show the warning.
    }
    setOpen(true)
  }, [role])

  if (role !== 'ctf') return null

  const goBack = () => {
    setOpen(false)
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/dashboard')
  }

  const continueOn = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // If storage is blocked, they will see the warning again next visit.
    }
    setOpen(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Please check before you continue</DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-slate-600">
            {area === 'bulk-upload'
              ? 'Smart Bulk Upload can create or change many events at once. Please continue only if you know what you are doing. If you are unsure, go back or ask an admin or an experienced colleague.'
              : 'Event Data lets you create, edit, and manage teaching events. Please continue only if you know what you are doing. If you are unsure, go back or ask an admin or an experienced colleague.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={goBack}>
            Go back
          </Button>
          <Button type="button" className="bg-teal-700 hover:bg-teal-800" onClick={continueOn}>
            I understand, continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
