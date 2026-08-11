'use client'

import { useCallback, useRef, useState } from 'react'
import { useNavigationGuard } from 'next-navigation-guard'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { AlertTriangle } from 'lucide-react'

type UseUnsavedChangesProtectionOptions = {
  enabled: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Called when the user confirms leaving (before navigation proceeds). */
  onDiscard?: () => void
}

/**
 * Blocks in-app navigation with the site ConfirmationDialog when `enabled`.
 * Tab close / refresh still uses the browser's native leave prompt (browser limitation).
 * Use `confirmLeave` for same-page actions (tab switches, cancel buttons).
 * Call `allowNextNavigation` before intentional navigations after a successful save.
 */
export function useUnsavedChangesProtection({
  enabled,
  title = 'Leave without saving?',
  description = 'You have unsaved changes. If you leave now, your progress will be lost.',
  confirmText = 'Leave',
  cancelText = 'Stay',
  onDiscard,
}: UseUnsavedChangesProtectionOptions) {
  const [localOpen, setLocalOpen] = useState(false)
  const [bypass, setBypass] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const onDiscardRef = useRef(onDiscard)
  onDiscardRef.current = onDiscard

  const guardEnabled = enabled && !bypass
  const navGuard = useNavigationGuard({ enabled: guardEnabled })

  const allowNextNavigation = useCallback(() => {
    setBypass(true)
  }, [])

  const confirmLeave = useCallback(
    (action: () => void) => {
      if (!guardEnabled) {
        action()
        return
      }
      pendingActionRef.current = action
      setLocalOpen(true)
    },
    [guardEnabled]
  )

  const handleCancel = useCallback(() => {
    if (navGuard.active) {
      navGuard.reject()
      return
    }
    pendingActionRef.current = null
    setLocalOpen(false)
  }, [navGuard])

  const handleConfirm = useCallback(() => {
    onDiscardRef.current?.()
    if (navGuard.active) {
      navGuard.accept()
      return
    }
    const action = pendingActionRef.current
    pendingActionRef.current = null
    setLocalOpen(false)
    setBypass(true)
    action?.()
    // Re-arm the guard after the intentional leave action finishes.
    queueMicrotask(() => setBypass(false))
  }, [navGuard])

  const dialog = (
    <ConfirmationDialog
      open={navGuard.active || localOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      variant="warning"
      icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
    />
  )

  return {
    confirmLeave,
    allowNextNavigation,
    dialog,
    isPromptOpen: navGuard.active || localOpen,
  }
}
