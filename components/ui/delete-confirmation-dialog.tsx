'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName?: string
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {itemName && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">Item to delete:</p>
            <p className="text-sm text-gray-700 mt-1">{itemName}</p>
          </div>
        )}
        
        <DialogFooter className="flex gap-4 sm:gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Deleting...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
