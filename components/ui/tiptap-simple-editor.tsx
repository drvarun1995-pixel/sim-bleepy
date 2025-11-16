"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { ImageResizeNode } from "@/components/tiptap-node/image-resize-node/image-resize-node-extension"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  TextColorPopover,
  TextColorPopoverContent,
  TextColorPopoverButton,
} from "@/components/tiptap-ui/text-color-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { PaletteIcon } from "@/components/tiptap-icons/palette-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"

// Custom scoped ThemeToggle that only affects the editor
const ScopedThemeToggle = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    // Always start with light mode (not dark)
    setIsDarkMode(false)
    if (containerRef.current) {
      containerRef.current.classList.remove("dark")
    }
  }, [containerRef])

  useEffect(() => {
    // Only toggle dark class on the editor container, not the document
    if (containerRef.current) {
      containerRef.current.classList.toggle("dark", isDarkMode)
    }
  }, [isDarkMode, containerRef])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-style="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}

// --- Lib ---
import { handleImageUpload, handleEventImageUpload, handleAdminEmailImageUpload, handleAnnouncementImageUpload, MAX_FILE_SIZE, setImageUploadContext, setEventImageUploadContext, setAdminEmailUploadContext, setAnnouncementUploadContext } from "@/lib/tiptap-utils"
import { toast } from "sonner"

// --- Styles ---
// Note: Not importing simple-editor.scss globally to avoid affecting page styles
// We'll scope all styles to the editor container

type UploadContext = 'auto' | 'event' | 'placements' | 'admin-email' | 'announcement'

interface TiptapSimpleEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  specialtySlug?: string
  pageSlug?: string
  eventId?: string // For event image uploads
  eventSlug?: string
  draftId?: string
  onImageUploaded?: (imagePath: string) => void
  documentId?: string
  uploadContext?: UploadContext
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onTextColorClick,
  isMobile,
  containerRef,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  onTextColorClick: () => void
  isMobile: boolean
  containerRef: React.RefObject<HTMLDivElement>
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
        <TableDropdownMenu portal={isMobile} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <>
            <TextColorPopover />
            <ColorHighlightPopover />
          </>
        ) : (
          <>
            <TextColorPopoverButton onClick={onTextColorClick} />
            <ColorHighlightPopoverButton onClick={onHighlighterClick} />
          </>
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ScopedThemeToggle containerRef={containerRef} />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link" | "textColor"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : type === "textColor" ? (
          <PaletteIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : type === "textColor" ? (
      <TextColorPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function TiptapSimpleEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  specialtySlug,
  pageSlug,
  eventId,
  eventSlug,
  draftId,
  onImageUploaded,
  documentId,
  uploadContext = 'auto',
}: TiptapSimpleEditorProps) {
  const isMobile = useIsMobile()
  const [isMounted, setIsMounted] = useState(false)
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link" | "textColor">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    setIsMounted(true)
    // Ensure document doesn't have dark class (prevent global dark mode)
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Set image upload context - prioritize eventId over placements
  const shouldUseEventUploads =
    uploadContext === 'event' || (uploadContext === 'auto' && Boolean(eventId || eventSlug || draftId))
  const shouldUseAdminEmailUploads = uploadContext === 'admin-email'
  const shouldUseAnnouncementUploads = uploadContext === 'announcement'

  useEffect(() => {
    if (shouldUseEventUploads) {
      setEventImageUploadContext(eventId, eventSlug, draftId)
      setAdminEmailUploadContext(undefined)
      setAnnouncementUploadContext(undefined)
      setImageUploadContext(undefined, undefined, documentId)
    } else if (shouldUseAdminEmailUploads) {
      setEventImageUploadContext(undefined, undefined, undefined)
      setAdminEmailUploadContext(draftId)
      setAnnouncementUploadContext(undefined)
      setImageUploadContext(undefined, undefined, documentId)
    } else if (shouldUseAnnouncementUploads) {
      setEventImageUploadContext(undefined, undefined, undefined)
      setAdminEmailUploadContext(undefined)
      setAnnouncementUploadContext(draftId)
      setImageUploadContext(undefined, undefined, documentId)
    } else {
      setEventImageUploadContext(undefined, undefined, undefined)
      setAdminEmailUploadContext(undefined)
      setAnnouncementUploadContext(undefined)
      setImageUploadContext(specialtySlug, pageSlug, documentId)
    }
  }, [shouldUseEventUploads, shouldUseAdminEmailUploads, shouldUseAnnouncementUploads, eventId, eventSlug, draftId, specialtySlug, pageSlug, documentId])

  const imageUploadHandler =
    shouldUseEventUploads ? handleEventImageUpload :
    shouldUseAdminEmailUploads ? handleAdminEmailImageUpload :
    shouldUseAnnouncementUploads ? handleAnnouncementImageUpload :
    handleImageUpload

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
        "data-placeholder": placeholder,
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData || (window as any).clipboardData;
        if (!clipboardData) return false;

        // Get pasted text
        const pastedText = clipboardData.getData('text/plain');
        
        // Check if it looks like tab-separated data (Excel/CSV)
        if (pastedText && pastedText.includes('\t')) {
          event.preventDefault();
          
          // Parse tab-separated data
          const rows = pastedText.split('\n').filter((row: string) => row.trim().length > 0);
          if (rows.length === 0) return true;

          const tableData = rows.map((row: string) => 
            row.split('\t').map(cell => cell.trim())
          );

          // Determine dimensions
          const maxCols = Math.max(...tableData.map((row: string[]) => row.length));
          const numRows = tableData.length;
          const numCols = maxCols;

          if (numRows > 0 && numCols > 0) {
            // Get editor instance - try from view first, then ref
            const editorInstance = (view as any).editor || editorRef.current;
            if (!editorInstance) return false;

            // Create table structure for Tiptap
            const tableRows: any[] = [];
            
            for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
              const rowCells: any[] = [];
              const rowData = tableData[rowIndex] || [];
              
              for (let colIndex = 0; colIndex < numCols; colIndex++) {
                const cellContent = rowData[colIndex] || '';
                // Use TableHeader for first row, TableCell for others
                const cellType = rowIndex === 0 ? 'tableHeader' : 'tableCell';
                
                // Create cell content structure
                const cellParagraph = cellContent ? {
                  type: 'paragraph',
                  content: [{ type: 'text', text: cellContent }]
                } : { type: 'paragraph' };
                
                rowCells.push({
                  type: cellType,
                  content: [cellParagraph]
                });
              }
              
              tableRows.push({
                type: 'tableRow',
                content: rowCells
              });
            }

            // Insert table using Tiptap command
            editorInstance.chain()
              .focus()
              .insertContent({
                type: 'table',
                content: tableRows
              })
              .run();
            
            return true;
          }
        }

        // Let default paste handler handle other content
        return false;
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph", "tableCell"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      ImageResizeNode.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image-resize',
        },
      }),
      Typography,
      Superscript,
      Subscript,
      Selection,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: imageUploadHandler,
        onError: (error) => {
          console.error("Upload failed:", error);
          toast.error(`Image upload failed: ${error.message || 'Unknown error'}`);
        },
        onSuccess: (url) => {
          if (onImageUploaded) {
            // Extract path from URL if possible
            const urlObj = new URL(url, window.location.origin)
            const path = urlObj.searchParams.get('path')
            if (path) {
              onImageUploaded(path)
            }
          }
        },
      }),
    ],
    content: value || "",
  })

  // Store editor in ref and attach paste handler for Excel data
  useEffect(() => {
    if (!editor) return;
    
    editorRef.current = editor
    
    // Attach paste handler directly to editor DOM element as backup
    const editorElement = editor.view.dom
    if (!editorElement) return;
    
    const handlePasteEvent = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      if (!clipboardData) return;

      const pastedText = clipboardData.getData('text/plain');
      
      // Check if it looks like tab-separated data (Excel/CSV)
      if (pastedText && pastedText.includes('\t')) {
        event.preventDefault();
        event.stopPropagation();
        
        // Parse tab-separated data
        const rows = pastedText.split('\n').filter((row: string) => row.trim().length > 0);
        if (rows.length === 0) return;

        const tableData = rows.map((row: string) => 
          row.split('\t').map(cell => cell.trim())
        );

        const maxCols = Math.max(...tableData.map((row: string[]) => row.length));
        const numRows = tableData.length;
        const numCols = maxCols;

        if (numRows > 0 && numCols > 0) {
          // Create table structure for Tiptap
          const tableRows: any[] = [];
          
          for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
            const rowCells: any[] = [];
            const rowData = tableData[rowIndex] || [];
            
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
              const cellContent = rowData[colIndex] || '';
              const cellType = rowIndex === 0 ? 'tableHeader' : 'tableCell';
              
              const cellParagraph = cellContent ? {
                type: 'paragraph',
                content: [{ type: 'text', text: cellContent }]
              } : { type: 'paragraph' };
              
              rowCells.push({
                type: cellType,
                content: [cellParagraph]
              });
            }
            
            tableRows.push({
              type: 'tableRow',
              content: rowCells
            });
          }

          // Insert table using Tiptap command
          editor.chain()
            .focus()
            .insertContent({
              type: 'table',
              content: tableRows
            })
            .run();
        }
      }
    };

    // Use capture phase to ensure we catch it first
    editorElement.addEventListener('paste', handlePasteEvent, true);
    
    return () => {
      editorElement.removeEventListener('paste', handlePasteEvent, true);
    };
  }, [editor])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile])

  // Update editor content when value prop changes (external update)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [value, editor])

  if (!isMounted || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[600px] border border-gray-300 rounded-md bg-white">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        /* Override Simple Editor template's global styles for our container */
        .tiptap-simple-editor-container {
          width: 100% !important;
          height: auto !important;
          max-width: 100% !important;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          overflow: visible !important;
          position: relative;
          display: block;
          /* Ensure no transform or will-change that creates stacking context */
          transform: none !important;
          will-change: auto !important;
        }
        
        /* On mobile, allow toolbar to overflow container */
        @media (max-width: 480px) {
          .tiptap-simple-editor-container {
            overflow: visible !important;
            transform: none !important;
            will-change: auto !important;
          }
        }
        
        .tiptap-simple-editor-container .simple-editor-wrapper {
          width: 100% !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: none !important;
          overflow: hidden !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          /* Ensure no transform that creates stacking context */
          transform: none !important;
          will-change: auto !important;
        }
        
        /* On mobile, ensure wrapper can contain toolbar */
        @media (max-width: 480px) {
          .tiptap-simple-editor-container .simple-editor-wrapper {
            overflow: visible !important;
            position: relative !important;
            min-height: 400px;
          }
        }
        
        .tiptap-simple-editor-container .simple-editor-content {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          height: auto !important;
          min-height: 200px;
          max-height: 400px !important;
          display: flex !important;
          flex-direction: column !important;
          flex: 1 1 auto !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Increase height on desktop only */
        @media (min-width: 641px) {
          .tiptap-simple-editor-container .simple-editor-content {
            max-height: 800px !important;
            min-height: 400px;
          }
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
          padding: 1rem !important;
          min-height: 200px !important;
          height: auto !important;
          max-height: none !important;
          flex: 1 1 auto !important;
          overflow: visible !important;
          font-family: var(--font-roboto), 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          font-weight: 400 !important;
        }
        
        /* Increase min-height on desktop */
        @media (min-width: 641px) {
          .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
            min-height: 400px !important;
          }
        }
        
        .tiptap-simple-editor-container .tiptap-toolbar {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          flex-wrap: wrap !important;
          width: 100% !important;
        }
        
        /* Mobile toolbar positioning - fixed at bottom of editor container */
        @media (max-width: 480px) {
          /* Toolbar should be positioned at bottom of editor container */
          .tiptap-simple-editor-container .simple-editor-wrapper .tiptap-toolbar[data-variant="fixed"],
          .tiptap-simple-editor-container .tiptap-toolbar[data-variant="fixed"] {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            z-index: 10 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: var(--tt-toolbar-height) !important;
            height: calc(var(--tt-toolbar-height) + env(safe-area-inset-bottom, 0.5rem)) !important;
            border-top: 1px solid var(--tt-toolbar-border-color) !important;
            border-bottom: none !important;
            background: var(--tt-toolbar-bg-color) !important;
            padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0.5rem)) !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            align-items: center !important;
            gap: 0.25rem !important;
            margin: 0 !important;
          }
          
          .tiptap-simple-editor-container .tiptap-toolbar[data-variant="fixed"]::-webkit-scrollbar {
            display: none !important;
          }
          
          /* Ensure toolbar groups don't wrap and are scrollable */
          .tiptap-simple-editor-container .tiptap-toolbar[data-variant="fixed"] .tiptap-toolbar-group {
            flex: 0 0 auto !important;
            flex-wrap: nowrap !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
          }
          
          /* Ensure all toolbar children don't shrink */
          .tiptap-simple-editor-container .tiptap-toolbar[data-variant="fixed"] > * {
            flex-shrink: 0 !important;
            flex: 0 0 auto !important;
          }
          
          /* Add padding to editor content to account for toolbar at bottom */
          .tiptap-simple-editor-container .simple-editor-content {
            padding-bottom: calc(var(--tt-toolbar-height) + env(safe-area-inset-bottom, 0.5rem) + 1rem) !important;
            max-height: 300px !important;
          }
        }
        
        /* Ensure toolbar doesn't overflow */
        .tiptap-simple-editor-container .tiptap-toolbar > * {
          flex-shrink: 0;
        }
        
        /* Dark mode styles - scoped to editor container only */
        .tiptap-simple-editor-container.dark {
          background: #1a1c23 !important;
          border-color: #374151 !important;
        }
        
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor {
          background: #1a1c23 !important;
          color: #e5e7eb !important;
        }
        
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor p,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor h1,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor h2,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor h3,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor h4,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor li,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor blockquote,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor {
          color: #e5e7eb !important;
        }
        
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor p.is-editor-empty:first-child::before {
          color: #9ca3af !important;
        }
        
        /* Light mode - ensure text is visible */
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor {
          background: white !important;
          color: #374151 !important;
        }
        
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor p,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor h1,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor h2,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor h3,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor h4,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor li,
        .tiptap-simple-editor-container:not(.dark) .simple-editor-content .tiptap.ProseMirror.simple-editor blockquote {
          color: #374151 !important;
        }
        
        /* CRITICAL: Force Roboto font for all editor content with higher specificity */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor p,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor span,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor div,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor *:not(button):not(input):not(select):not(textarea) {
          font-family: var(--font-roboto, 'Roboto'), 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        /* CRITICAL: Ensure bold text is visible with maximum specificity - override any inline styles */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor strong,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor b,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor p strong,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor p b,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor li strong,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor li b,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor strong *,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor b * {
          font-weight: 700 !important;
          font-family: var(--font-roboto, 'Roboto'), 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        /* Handle Tiptap TextStyle extension - inline font-weight styles MUST be overridden */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor [style*="font-weight: 700"],
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor [style*="font-weight:700"],
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor [style*="font-weight: bold"],
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor [style*="font-weight:bold"],
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor span[style*="font-weight: 700"],
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor span[style*="font-weight:700"] {
          font-weight: 700 !important;
          font-family: var(--font-roboto, 'Roboto'), 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        /* Headings should be bold and use Roboto */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h1,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h2,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h3,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h4,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h5,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor h6 {
          font-family: var(--font-roboto, 'Roboto'), 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-weight: 700 !important;
        }
        
        /* Ensure font smoothing for better bold text rendering on editor container */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          font-variant-ligatures: common-ligatures !important;
        }
        
        /* Ensure lists are properly styled */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor ul,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor ol {
          margin: 0.5em 0 !important;
          padding-left: 1.5em !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor li {
          margin: 0.25em 0 !important;
          display: list-item !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor ul li {
          list-style-type: disc !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor ol li {
          list-style-type: decimal !important;
        }
        
        /* Fix highlight colors - Tiptap Highlight extension applies color via inline style */
        /* Don't override inline styles, they already have the correct color */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor mark {
          /* Ensure border-radius and padding are applied */
          border-radius: 0.25rem;
          padding: 0.1em 0.2em;
        }
        
        /* Table styles - Ensure proper borders with no breaks */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          margin: 1em 0;
          width: 100%;
          table-layout: fixed;
          border: 2px solid #171717 !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table td,
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table th {
          border: 1px solid #171717 !important;
          border-top: 1px solid #171717 !important;
          border-right: 1px solid #171717 !important;
          border-bottom: 1px solid #171717 !important;
          border-left: 1px solid #171717 !important;
          padding: 8px 12px !important;
          min-width: 50px !important;
          min-height: 30px !important;
          text-align: left;
          vertical-align: top !important;
          position: relative;
          margin: 0 !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
        }
        
        /* Ensure no border gaps or breaks */
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table tr {
          border: none !important;
        }
        
        .tiptap-simple-editor-container .simple-editor-content .tiptap.ProseMirror.simple-editor table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(33, 150, 243, 0.1);
          pointer-events: none;
          border: none !important;
        }
        
        /* Dark mode table styles */
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor table {
          border-color: #4b5563 !important;
        }
        
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor table td,
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor table th {
          border-color: #4b5563 !important;
          border-top-color: #4b5563 !important;
          border-right-color: #4b5563 !important;
          border-bottom-color: #4b5563 !important;
          border-left-color: #4b5563 !important;
        }
        
        .tiptap-simple-editor-container.dark .simple-editor-content .tiptap.ProseMirror.simple-editor table th {
          background-color: #1f2937 !important;
        }
      `}</style>
      <div ref={containerRef} className={`tiptap-simple-editor-container ${className}`}>
        <div className="simple-editor-wrapper">
          <EditorContext.Provider value={{ editor }}>
            <Toolbar
              ref={toolbarRef}
              variant="fixed"
            >
              {mobileView === "main" ? (
                <MainToolbarContent
                  onHighlighterClick={() => setMobileView("highlighter")}
                  onLinkClick={() => setMobileView("link")}
                  onTextColorClick={() => setMobileView("textColor")}
                  isMobile={isMobile}
                  containerRef={containerRef}
                />
              ) : (
                <MobileToolbarContent
                  type={mobileView === "highlighter" ? "highlighter" : mobileView === "textColor" ? "textColor" : "link"}
                  onBack={() => setMobileView("main")}
                />
              )}
            </Toolbar>

            <EditorContent
              editor={editor}
              role="presentation"
              className="simple-editor-content"
            />
          </EditorContext.Provider>
        </div>
      </div>
    </>
  )
}
