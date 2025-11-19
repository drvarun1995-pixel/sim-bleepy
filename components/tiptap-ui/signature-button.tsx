"use client"

import { forwardRef, useCallback, useState } from "react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { PenSquare } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button as UIButton } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface SignatureButtonProps {
  editor?: any
  onInserted?: () => void
}

export const SignatureButton = forwardRef<HTMLButtonElement, SignatureButtonProps>(
  ({ editor: providedEditor, onInserted }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = useState(false)
    const [signature, setSignature] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchSignature = useCallback(async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/emails/signatures')
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('No signature found. Please create one first.')
            setIsOpen(false)
            return
          }
          throw new Error('Failed to load signature')
        }
        const data = await response.json()
        if (data.signature?.content_html) {
          setSignature(data.signature.content_html)
        } else {
          toast.error('No signature found. Please create one first.')
          setIsOpen(false)
        }
      } catch (error) {
        console.error('Failed to fetch signature:', error)
        toast.error('Unable to load signature')
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, [])

    const handleClick = useCallback(() => {
      if (!editor) return
      setIsOpen(true)
      fetchSignature()
    }, [editor, fetchSignature])

    const handleInsert = useCallback(() => {
      if (!editor || !signature) return

      // Insert signature at cursor position
      editor.chain().focus().insertContent(signature).run()
      onInserted?.()
      setIsOpen(false)
      setSignature(null)
      toast.success('Signature inserted')
    }, [editor, signature, onInserted])

    if (!editor) {
      return null
    }

    return (
      <>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          aria-label="Insert signature"
          tooltip="Insert signature"
          onClick={handleClick}
          ref={ref}
        >
          <PenSquare className="tiptap-button-icon" />
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Signature</DialogTitle>
              <DialogDescription>
                {isLoading
                  ? 'Loading your signature...'
                  : signature
                  ? 'Click "Insert" to add your signature to the email.'
                  : 'No signature found. Please create one first.'}
              </DialogDescription>
            </DialogHeader>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : signature ? (
              <div className="space-y-4">
                <div
                  className="border rounded-lg p-4 bg-slate-50 max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: signature }}
                />
                <div className="flex justify-end gap-2">
                  <UIButton variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </UIButton>
                  <UIButton onClick={handleInsert}>Insert Signature</UIButton>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <UIButton onClick={() => setIsOpen(false)}>Close</UIButton>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }
)

SignatureButton.displayName = "SignatureButton"

