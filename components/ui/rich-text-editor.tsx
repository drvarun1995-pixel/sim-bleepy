"use client"

import React, { useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { toast } from 'sonner'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  specialtySlug?: string // For organizing images by specialty
  pageSlug?: string // For organizing images by page title
  onImageUploaded?: (imagePath: string) => void // Callback when image is uploaded
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter description...",
  className = "",
  specialtySlug,
  pageSlug,
  onImageUploaded
}: RichTextEditorProps & { onImageUploaded?: (imagePath: string) => void }) {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const pageSlugRef = useRef<string | undefined>(pageSlug)
  const specialtySlugRef = useRef<string | undefined>(specialtySlug)
  const uploadedImagesRef = useRef<string[]>([]) // Track uploaded image paths

  // Keep refs in sync with props
  useEffect(() => {
    pageSlugRef.current = pageSlug
    specialtySlugRef.current = specialtySlug
  }, [pageSlug, specialtySlug])

  const imageHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }

      // Validate file type
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

        // Prioritize tempSignedUrl for immediate display (full URL works instantly)
        // Fallback to view API URL if tempSignedUrl not available
        const imageUrlForEditor = data.tempSignedUrl || data.url
        
        if (!imageUrlForEditor) {
          toast.error('Failed to get image URL')
          console.error('Upload response:', data)
          return
        }

        console.log('Inserting image - tempSignedUrl:', data.tempSignedUrl, 'viewUrl:', data.url)

        // Get Quill instance from the editor container
        // ReactQuill renders the editor, so we need to access it via DOM
        const getQuillInstance = () => {
          // Try to find Quill instance within our editor container
          if (editorContainerRef.current) {
            const editorContainer = editorContainerRef.current.querySelector('.ql-container')
            if (editorContainer) {
              // Access Quill instance - it's stored on the container element
              const quillEditor = (editorContainer as any).__quill
              if (quillEditor) {
                return quillEditor
              }
              
              // Alternative: try to get from the editor div
              const editorDiv = editorContainerRef.current.querySelector('.ql-editor')
              if (editorDiv) {
                return (editorDiv as any).__quill || (editorDiv as any).__quillInstance
              }
            }
          }
          
          // Fallback: try global search
          const editorContainer = document.querySelector('.rich-text-editor .ql-container')
          if (editorContainer) {
            return (editorContainer as any).__quill
          }
          
          return null
        }

        // Preload the image to ensure it's available before inserting
        const img = new Image()
        img.onload = () => {
          // Get Quill instance
          const quill = getQuillInstance()
          if (!quill) {
            toast.error('Editor not ready. Please try again.')
            return
          }

          const range = quill.getSelection(true)
          const index = range ? range.index : quill.getLength()
          
          // Insert image using tempSignedUrl for immediate display
          quill.insertEmbed(index, 'image', imageUrlForEditor)
          
          // Move cursor after the image
          quill.setSelection(index + 1)
          
          // Update content - if we used tempSignedUrl, replace with view API URL
          // This ensures saved content uses view API (never expires)
          setTimeout(() => {
            const updatedContent = quill.root.innerHTML
            
            // Replace tempSignedUrl with view API URL if both exist
            if (data.tempSignedUrl && data.url && updatedContent.includes(data.tempSignedUrl)) {
              const contentWithViewUrl = updatedContent.replace(
                new RegExp(data.tempSignedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                data.url
              )
              onChange(contentWithViewUrl)
            } else {
              // Just update with current content
              onChange(updatedContent)
            }
            
            // Track uploaded image path for cleanup if page not saved
            if (data.path) {
              uploadedImagesRef.current.push(data.path)
              // Notify parent component about uploaded image
              if (onImageUploaded) {
                onImageUploaded(data.path)
              }
            }
          }, 100)
        }
        
        img.onerror = () => {
          console.error('Failed to load image:', imageUrlForEditor)
          toast.error('Failed to load image. Please try again.')
        }
        
        // Start loading the image
        img.src = imageUrlForEditor
      } catch (error: any) {
        toast.dismiss()
        toast.error(error.message || 'Failed to upload image')
      }
    }
  }

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        [{ 'table': 'insert-table' }],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    // Note: Quill 2.0 has basic table support via the table button in toolbar
    // Users can insert tables and edit them using the table button
  }), [specialtySlug])

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'indent',
    'align',
    'link', 'image', 'video',
    'table',
    'table-row',
    'table-cell'
  ]

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .rich-text-editor .ql-editor {
          background-color: white !important;
          color: #374151 !important;
          min-height: 600px !important;
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
        
        /* Table styles */
        .rich-text-editor .ql-editor table {
          border-collapse: collapse;
          margin: 10px 0;
          width: 100%;
        }
        .rich-text-editor .ql-editor table td,
        .rich-text-editor .ql-editor table th {
          border: 1px solid #d1d5db;
          padding: 8px;
        }
        .rich-text-editor .ql-editor table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Image styles */
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          margin: 10px 0;
        }
        
        /* Video styles */
        .rich-text-editor .ql-editor .ql-video {
          width: 100%;
          height: 400px;
          margin: 10px 0;
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
            min-height: 400px !important;
            font-size: 16px !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
      <div ref={editorContainerRef}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}

