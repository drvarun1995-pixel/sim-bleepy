"use client"

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter description...",
  className = ""
}: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }), [])

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ]

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .rich-text-editor .ql-editor {
          background-color: white !important;
          color: #374151 !important;
        }
        .rich-text-editor .ql-container {
          background-color: white !important;
        }
        .rich-text-editor .ql-toolbar {
          background-color: #f9fafb !important;
          border: 1px solid #d1d5db !important;
          border-bottom: none !important;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: 1px solid #d1d5db !important;
        }
        
        /* Mobile-specific styles */
        @media (max-width: 640px) {
          .rich-text-editor .ql-toolbar {
            padding: 4px !important;
          }
          .rich-text-editor .ql-toolbar .ql-formats {
            margin-right: 8px !important;
          }
          .rich-text-editor .ql-toolbar button {
            width: 24px !important;
            height: 24px !important;
            padding: 2px !important;
          }
          .rich-text-editor .ql-toolbar button svg {
            width: 12px !important;
            height: 12px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker {
            height: 24px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker-label {
            padding: 2px 4px !important;
            font-size: 12px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker-options {
            font-size: 12px !important;
          }
          .rich-text-editor .ql-editor {
            min-height: 200px !important;
            font-size: 16px !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ minHeight: '150px' }}
      />
    </div>
  )
}

