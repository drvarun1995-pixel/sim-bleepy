"use client"

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, all } from 'lowlight'
import { toast } from 'sonner'
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Code,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Subscript,
  Superscript
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Create lowlight instance for code block syntax highlighting
const lowlight = createLowlight(all)

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  specialtySlug?: string
  pageSlug?: string
  onImageUploaded?: (imagePath: string) => void
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  specialtySlug,
  pageSlug,
  onImageUploaded
}: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const specialtySlugRef = useRef<string | undefined>(specialtySlug)
  const pageSlugRef = useRef<string | undefined>(pageSlug)
  const uploadedImagesRef = useRef<string[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    specialtySlugRef.current = specialtySlug
    pageSlugRef.current = pageSlug
  }, [specialtySlug, pageSlug])

  const editorRef = useRef<any>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      handlePaste: (view, event) => {
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  const handleImageUpload = async () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      try {
        toast.loading('Uploading image...')
        
        const formData = new FormData()
        formData.append('file', file)
        if (specialtySlugRef.current) {
          formData.append('specialtySlug', specialtySlugRef.current)
        }
        if (pageSlugRef.current) {
          formData.append('pageSlug', pageSlugRef.current)
        }

        const response = await fetch('/api/placements/images', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload image')
        }

        const data = await response.json()
        toast.dismiss()
        toast.success('Image uploaded successfully')

        const imageUrl = data.url || data.tempSignedUrl
        
        if (!imageUrl) {
          toast.error('Failed to get image URL')
          return
        }

        if (editorRef.current) {
          editorRef.current.chain().focus().setImage({ src: imageUrl }).run()
        }

        if (data.path) {
          uploadedImagesRef.current.push(data.path)
          if (onImageUploaded) {
            onImageUploaded(data.path)
          }
        }
      } catch (error: any) {
        toast.dismiss()
        toast.error(error.message || 'Failed to upload image')
      }
    }
  }

  if (!isMounted || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[600px] border border-gray-300 rounded-md bg-white">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  const textColors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
    '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff', '#980000', '#ff0000',
    '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
    '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc',
    '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  ]

  const highlightColors = [
    '#ffebee', '#fce4ec', '#f3e5f5', '#ede7f6', '#e8eaf6', '#e3f2fd',
    '#e1f5fe', '#e0f2f1', '#e8f5e9', '#f1f8e9', '#f9fbe7', '#fffde7',
    '#fff9c4', '#fff59d', '#ffecb3', '#ffe0b2', '#ffccbc', '#ffcdd2',
  ]

  return (
    <div className={`tiptap-editor-wrapper ${className}`}>
      <div className="tiptap-toolbar">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="toolbar-btn"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="toolbar-btn"
          title="Redo"
        >
          <Redo size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Headings Dropdown */}
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            'paragraph'
          }
          onChange={(e) => {
            const value = e.target.value
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run()
            } else {
              const level = parseInt(value.replace('h', '')) as 1 | 2 | 3
              editor.chain().focus().toggleHeading({ level }).run()
            }
          }}
          className="toolbar-select"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="toolbar-divider" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline', fontSize: '14px', fontWeight: 'bold' }}>U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          title="Inline Code"
        >
          <Code size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Text Color */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="toolbar-btn"
              title="Text Color"
            >
              <Palette size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto" align="start">
            <div className="color-grid">
              {textColors.map((color) => (
                <button
                  key={color}
                  className="color-item"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run()
                    setShowColorPicker(false)
                  }}
                  title={color}
                />
              ))}
            </div>
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run()
                setShowColorPicker(false)
              }}
              className="w-full mt-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear Color
            </button>
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        <Popover open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
              title="Highlight"
            >
              <Highlighter size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto" align="start">
            <div className="color-grid">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  className="color-item"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color }).run()
                    setShowHighlightPicker(false)
                  }}
                  title={color}
                />
              ))}
            </div>
            <button
              onClick={() => {
                editor.chain().focus().unsetHighlight().run()
                setShowHighlightPicker(false)
              }}
              className="w-full mt-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear Highlight
            </button>
          </PopoverContent>
        </Popover>

        <div className="toolbar-divider" />

        {/* Links and Media */}
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className="toolbar-btn"
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="toolbar-btn"
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={`toolbar-btn ${editor.isActive('table') ? 'is-active' : ''}`}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
      </div>
      
      <EditorContent editor={editor} className="tiptap-content" />
      
      <style jsx global>{`
        .tiptap-editor-wrapper {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          overflow: hidden;
        }
        
        .tiptap-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 8px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }
        
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
          margin: 0 4px;
        }
        
        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          background: transparent;
          border-radius: 0.375rem;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
        }
        
        .toolbar-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }
        
        .toolbar-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .toolbar-btn.is-active {
          background: #e5e7eb;
          color: #111827;
        }
        
        .toolbar-select {
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          height: 32px;
        }
        
        .toolbar-select:hover {
          border-color: #d1d5db;
        }
        
        .tiptap-content {
          padding: 16px;
          min-height: 600px;
        }
        
        .tiptap-content :global(.ProseMirror) {
          outline: none;
          min-height: 600px;
        }
        
        .tiptap-content :global(.ProseMirror) > * + * {
          margin-top: 0.75em;
        }
        
        .tiptap-content :global(.ProseMirror) p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        
        /* Lists */
        .tiptap-content :global(.ProseMirror) ul,
        .tiptap-content :global(.ProseMirror) ol {
          margin: 0.75em 0;
          padding-left: 2em;
        }
        
        .tiptap-content :global(.ProseMirror) ul {
          list-style-type: disc;
        }
        
        .tiptap-content :global(.ProseMirror) ol {
          list-style-type: decimal;
        }
        
        .tiptap-content :global(.ProseMirror) li {
          margin: 0.25em 0;
          display: list-item;
        }
        
        /* Headings */
        .tiptap-content :global(.ProseMirror) h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        
        .tiptap-content :global(.ProseMirror) h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }
        
        .tiptap-content :global(.ProseMirror) h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }
        
        /* Blockquote */
        .tiptap-content :global(.ProseMirror) blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }
        
        /* Code */
        .tiptap-content :global(.ProseMirror) code {
          background: #f3f4f6;
          color: #ef4444;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .tiptap-content :global(.ProseMirror) pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .tiptap-content :global(.ProseMirror) pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }
        
        /* Links */
        .tiptap-content :global(.ProseMirror) a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .tiptap-content :global(.ProseMirror) a:hover {
          color: #1d4ed8;
        }
        
        /* Images */
        .tiptap-content :global(.ProseMirror) img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          border-radius: 0.5rem;
        }
        
        /* Highlight */
        .tiptap-content :global(.ProseMirror) mark {
          background-color: #fef08a;
          border-radius: 0.25rem;
          padding: 0.1em 0.2em;
        }
        
        /* Tables */
        .tiptap-content :global(.ProseMirror) table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
          border: 1px solid #e5e7eb;
        }
        
        .tiptap-content :global(.ProseMirror) table td,
        .tiptap-content :global(.ProseMirror) table th {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          min-width: 50px;
          text-align: left;
        }
        
        .tiptap-content :global(.ProseMirror) table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .tiptap-content :global(.ProseMirror) table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(33, 150, 243, 0.2);
          pointer-events: none;
        }
        
        /* Color Picker */
        .color-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          padding: 8px;
          width: 240px;
        }
        
        .color-item {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          padding: 0;
        }
        
        .color-item:hover {
          border-color: #2563eb;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
