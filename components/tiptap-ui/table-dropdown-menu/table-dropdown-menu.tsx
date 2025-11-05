import { forwardRef, useCallback, useState } from "react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"
import { TableIcon } from "@/components/tiptap-icons/table-icon"
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import type { Editor } from "@tiptap/react"

export interface TableDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  portal?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

const TABLE_SIZES = [
  { rows: 2, cols: 2, label: "2 x 2" },
  { rows: 3, cols: 3, label: "3 x 3" },
  { rows: 4, cols: 4, label: "4 x 4" },
  { rows: 5, cols: 5, label: "5 x 5" },
  { rows: 3, cols: 4, label: "3 x 4" },
  { rows: 4, cols: 3, label: "4 x 3" },
]

export const TableDropdownMenu = forwardRef<
  HTMLButtonElement,
  TableDropdownMenuProps
>(({ editor: providedEditor, portal = false, onOpenChange, ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  const isInTable = editor?.isActive("table") || false
  const canInsertTable = editor?.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }) || false

  const handleInsertTable = useCallback(
    (rows: number, cols: number, withHeaderRow: boolean = false) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow })
        .run()
      setIsOpen(false)
    },
    [editor]
  )

  const handleAddColumnBefore = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnBefore().run()
    setIsOpen(false)
  }, [editor])

  const handleAddColumnAfter = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
    setIsOpen(false)
  }, [editor])

  const handleDeleteColumn = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteColumn().run()
    setIsOpen(false)
  }, [editor])

  const handleAddRowBefore = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowBefore().run()
    setIsOpen(false)
  }, [editor])

  const handleAddRowAfter = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
    setIsOpen(false)
  }, [editor])

  const handleDeleteRow = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteRow().run()
    setIsOpen(false)
  }, [editor])

  const handleDeleteTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteTable().run()
    setIsOpen(false)
  }, [editor])

  const handleMergeCells = useCallback(() => {
    if (!editor) return
    editor.chain().focus().mergeCells().run()
    setIsOpen(false)
  }, [editor])

  const handleSplitCell = useCallback(() => {
    if (!editor) return
    editor.chain().focus().splitCell().run()
    setIsOpen(false)
  }, [editor])

  const canAddColumn = editor?.can().addColumnBefore() || false
  const canDeleteColumn = editor?.can().deleteColumn() || false
  const canAddRow = editor?.can().addRowBefore() || false
  const canDeleteRow = editor?.can().deleteRow() || false
  const canDeleteTable = editor?.can().deleteTable() || false
  const canMergeCells = editor?.can().mergeCells() || false
  const canSplitCell = editor?.can().splitCell() || false

  return (
    <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={isInTable ? "on" : "off"}
          role="button"
          tabIndex={-1}
          aria-label="Table"
          aria-pressed={isInTable}
          tooltip="Table"
          disabled={!canInsertTable && !isInTable}
          data-disabled={!canInsertTable && !isInTable}
          {...buttonProps}
          ref={ref}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            {/* Insert Table Section */}
            {!isInTable && (
              <>
                <DropdownMenuItem
                  onClick={() => handleInsertTable(3, 3, true)}
                  disabled={!canInsertTable}
                >
                  Insert table (3x3 with header)
                </DropdownMenuItem>
                <Separator orientation="horizontal" />
                {TABLE_SIZES.map((size) => (
                  <DropdownMenuItem
                    key={size.label}
                    onClick={() => handleInsertTable(size.rows, size.cols, false)}
                    disabled={!canInsertTable}
                  >
                    Insert {size.label} table
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Table Operations Section */}
            {isInTable && (
              <>
                <DropdownMenuItem
                  onClick={handleAddColumnBefore}
                  disabled={!canAddColumn}
                >
                  Add column before
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAddColumnAfter}
                  disabled={!canAddColumn}
                >
                  Add column after
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteColumn}
                  disabled={!canDeleteColumn}
                >
                  Delete column
                </DropdownMenuItem>
                <Separator orientation="horizontal" />
                <DropdownMenuItem onClick={handleAddRowBefore} disabled={!canAddRow}>
                  Add row above
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddRowAfter} disabled={!canAddRow}>
                  Add row below
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteRow} disabled={!canDeleteRow}>
                  Delete row
                </DropdownMenuItem>
                <Separator orientation="horizontal" />
                <DropdownMenuItem
                  onClick={handleMergeCells}
                  disabled={!canMergeCells}
                >
                  Merge cells
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSplitCell} disabled={!canSplitCell}>
                  Split cell
                </DropdownMenuItem>
                <Separator orientation="horizontal" />
                <DropdownMenuItem
                  onClick={handleDeleteTable}
                  disabled={!canDeleteTable}
                >
                  Delete table
                </DropdownMenuItem>
              </>
            )}
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

TableDropdownMenu.displayName = "TableDropdownMenu"

