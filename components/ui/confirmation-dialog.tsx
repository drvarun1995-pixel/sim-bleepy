'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, FileX, CalendarX, UserX, MessageSquareX, Stethoscope, FileText } from 'lucide-react'
import { cn } from '@/utils'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  icon?: React.ReactNode
  isLoading?: boolean
  className?: string
  showCancelButton?: boolean
}

const variantStyles = {
  default: {
    icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    iconBg: 'bg-blue-100'
  },
  destructive: {
    icon: <Trash2 className="h-6 w-6 text-red-500" />,
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    iconBg: 'bg-red-100'
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
    confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
    iconBg: 'bg-orange-100'
  }
}

const defaultIcons = {
  event: <CalendarX className="h-6 w-6 text-red-500" />,
  file: <FileX className="h-6 w-6 text-red-500" />,
  user: <UserX className="h-6 w-6 text-red-500" />,
  message: <MessageSquareX className="h-6 w-6 text-red-500" />,
  specialty: <Stethoscope className="h-6 w-6 text-red-500" />,
  default: <Trash2 className="h-6 w-6 text-red-500" />
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'destructive',
  icon,
  isLoading = false,
  className,
  showCancelButton = true,
}: ConfirmationDialogProps) {
  const styles = variantStyles[variant]
  const displayIcon = icon || styles.icon
  const shouldShowCancelButton = showCancelButton && typeof cancelText === 'string' && cancelText.trim().length > 0

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)} showCloseButton={!isLoading}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={cn("p-3 rounded-full", styles.iconBg)}>
              {displayIcon}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
          {shouldShowCancelButton && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn("w-full sm:w-auto transition-all duration-200", styles.confirmButton)}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Convenience components for common deletion scenarios
export function DeleteEventDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={defaultIcons.event}
      variant="destructive"
      confirmText="Delete Event"
      title="Delete Event"
      description="Are you sure you want to delete this event? This action cannot be undone and will remove all associated data."
    />
  )
}

export function DeleteFileDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={defaultIcons.file}
      variant="destructive"
      confirmText="Delete File"
      title="Delete File"
      description="Are you sure you want to delete this file? This action cannot be undone and the file will be permanently removed."
    />
  )
}

export function DeletePageDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={<FileText className="h-6 w-6 text-red-500" />}
      variant="destructive"
      confirmText="Delete Page"
      title="Delete Page"
      description="Are you sure you want to delete this page? This action cannot be undone and will permanently remove the page and all associated content."
    />
  )
}

export function DeleteUserDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={defaultIcons.user}
      variant="destructive"
      confirmText="Delete User"
      title="Delete User"
      description="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data."
    />
  )
}

export function DeleteMessageDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={defaultIcons.message}
      variant="destructive"
      confirmText="Delete Message"
      title="Delete Message"
      description="Are you sure you want to delete this message? This action cannot be undone."
    />
  )
}

export function DeleteSpecialtyDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant'>) {
  return (
    <ConfirmationDialog
      {...props}
      icon={defaultIcons.specialty}
      variant="destructive"
      confirmText="Delete Specialty"
      title="Delete Specialty"
      description="Are you sure you want to delete this specialty? This action cannot be undone and will remove all associated pages and documents."
    />
  )
}

export function BulkDeleteDialog(props: Omit<ConfirmationDialogProps, 'icon' | 'variant' | 'title' | 'description'> & { count: number }) {
  const { count, ...restProps } = props
  return (
    <ConfirmationDialog
      {...restProps}
      icon={defaultIcons.default}
      variant="destructive"
      confirmText={`Delete ${count} Items`}
      title={`Delete ${count} Items`}
      description={`Are you sure you want to delete ${count} items? This action cannot be undone and will permanently remove all selected items.`}
    />
  )
}
