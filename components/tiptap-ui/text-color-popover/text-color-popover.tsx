import { forwardRef, useMemo, useRef, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useMenuNavigation } from "@/hooks/use-menu-navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { BanIcon } from "@/components/tiptap-icons/ban-icon"
import { PaletteIcon } from "@/components/tiptap-icons/palette-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tiptap-ui-primitive/popover"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/components/tiptap-ui-primitive/card"

export interface TextColorPopoverContentProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional colors to use in the text color popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: string[]
}

export interface TextColorPopoverProps
  extends Omit<ButtonProps, "type"> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Optional colors to use in the text color popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: string[]
  /**
   * Whether the button should hide when the color extension is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Called when a color is applied.
   */
  onApplied?: ({ color }: { color: string }) => void
}

const DEFAULT_TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
  '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff', '#980000', '#ff0000',
  '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
  '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc',
  '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

export const TextColorPopoverButton = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, ...props }, ref) => (
  <Button
    type="button"
    className={className}
    data-style="ghost"
    data-appearance="default"
    role="button"
    tabIndex={-1}
    aria-label="Text color"
    tooltip="Text color"
    ref={ref}
    {...props}
  >
    {children ?? <PaletteIcon className="tiptap-button-icon" />}
  </Button>
))

TextColorPopoverButton.displayName = "TextColorPopoverButton"

export function TextColorPopoverContent({
  editor,
  colors = DEFAULT_TEXT_COLORS,
}: TextColorPopoverContentProps) {
  const { editor: actualEditor } = useTiptapEditor(editor)
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)

  const menuItems = useMemo(
    () => [...colors.map(c => ({ label: c, value: c })), { label: "Remove color", value: "none" }],
    [colors]
  )

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: "both",
    onSelect: (item) => {
      if (!containerRef.current) return false
      const colorElement = containerRef.current.querySelector(
        '[data-color-selected="true"]'
      ) as HTMLElement
      if (colorElement) colorElement.click()
      if (item.value === "none") {
        if (actualEditor) {
          actualEditor.chain().focus().unsetColor().run()
        }
      }
      return true
    },
    autoSelectFirstItem: false,
  })

  const handleColorSelect = (color: string) => {
    if (!actualEditor) return
    
    if (color === "none") {
      actualEditor.chain().focus().unsetColor().run()
    } else {
      actualEditor.chain().focus().setColor(color).run()
    }
  }

  const getCurrentColor = () => {
    if (!actualEditor) return null
    const { color } = actualEditor.getAttributes('textStyle')
    return color || null
  }

  const currentColor = getCurrentColor()

  return (
    <Card
      ref={containerRef}
      tabIndex={0}
      style={isMobile ? { boxShadow: "none", border: 0 } : {}}
    >
      <CardBody style={isMobile ? { padding: 0 } : {}}>
        <CardItemGroup orientation="horizontal">
          <ButtonGroup orientation="horizontal">
            {colors.map((color, index) => {
              const isSelected = currentColor === color
              return (
                <Button
                  key={color}
                  type="button"
                  data-style="ghost"
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Text color ${color}`}
                  tooltip={color}
                  tabIndex={index === selectedIndex ? 0 : -1}
                  data-color-selected={isSelected}
                  style={{
                    position: 'relative',
                    width: '1.75rem',
                    height: '1.75rem',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: '0.25rem',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    }}
                  />
                </Button>
              )
            })}
          </ButtonGroup>
          <Separator />
          <ButtonGroup orientation="horizontal">
            <Button
              onClick={() => handleColorSelect("none")}
              aria-label="Remove text color"
              tooltip="Remove text color"
              tabIndex={selectedIndex === colors.length ? 0 : -1}
              type="button"
              role="menuitem"
              data-style="ghost"
              data-color-selected={selectedIndex === colors.length}
            >
              <BanIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  )
}

export function TextColorPopover({
  editor: providedEditor,
  colors = DEFAULT_TEXT_COLORS,
  hideWhenUnavailable = false,
  onApplied,
  ...props
}: TextColorPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)

  const isVisible = editor ? true : !hideWhenUnavailable
  const canSetColor = editor?.can().setColor('') || false
  const currentColor = editor?.getAttributes('textStyle')?.color || null
  const isActive = !!currentColor

  if (!isVisible) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <TextColorPopoverButton
          disabled={!canSetColor}
          data-active-state={isActive ? "on" : "off"}
          data-disabled={!canSetColor}
          aria-pressed={isActive}
          aria-label="Text color"
          tooltip="Text color"
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent aria-label="Text colors">
        <TextColorPopoverContent editor={editor} colors={colors} />
      </PopoverContent>
    </Popover>
  )
}

export default TextColorPopover

