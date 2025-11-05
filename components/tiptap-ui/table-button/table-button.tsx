import { forwardRef, useCallback } from "react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { TableIcon } from "@/components/tiptap-icons/table-icon"
import type { Editor } from "@tiptap/react"

export interface TableButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const TableButton = forwardRef<HTMLButtonElement, TableButtonProps>(
  ({ editor: providedEditor, ...buttonProps }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)

    const handleInsertTable = useCallback(() => {
      if (!editor) return

      // Insert a 3x3 table by default
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    }, [editor])

    const canInsertTable = editor?.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true })

    return (
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Insert table"
        tooltip="Insert table"
        onClick={handleInsertTable}
        disabled={!canInsertTable}
        data-disabled={!canInsertTable}
        {...buttonProps}
        ref={ref}
      >
        <TableIcon className="tiptap-button-icon" />
      </Button>
    )
  }
)

TableButton.displayName = "TableButton"

