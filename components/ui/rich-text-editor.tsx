"use client"

import React, { useMemo, useRef, useEffect, useCallback } from 'react'
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

  // Get Quill instance helper function
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

  const tableHandler = useCallback(() => {
    const quill = getQuillInstance()
    if (!quill) {
      toast.error('Editor not ready. Please try again.')
      return
    }

    // Create a grid selector dialog
    const dialog = document.createElement('div')
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `
    
    const container = document.createElement('div')
    container.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 90%;
    `
    
    const title = document.createElement('div')
    title.textContent = 'Select Table Size'
    title.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #374151;
    `
    
    const gridContainer = document.createElement('div')
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 2px;
      margin-bottom: 16px;
      border: 1px solid #d1d5db;
      padding: 4px;
      border-radius: 4px;
    `
    
    let selectedRows = 3
    let selectedCols = 3
    let hoveredRows = 0
    let hoveredCols = 0
    
    const cells: HTMLDivElement[] = []
    
    // Define updateGrid function first
    const updateGrid = () => {
      const rows = hoveredRows || selectedRows
      const cols = hoveredCols || selectedCols
      
      cells.forEach((cell, index) => {
        const row = Math.floor(index / 10)
        const col = index % 10
        
        if (row < rows && col < cols) {
          cell.style.background = '#3b82f6'
          cell.style.border = '1px solid #2563eb'
        } else {
          cell.style.background = '#f3f4f6'
          cell.style.border = '1px solid #e5e7eb'
        }
      })
      
      const sizeText = document.getElementById('table-size-text')
      if (sizeText) {
        sizeText.textContent = `${rows} × ${cols}`
      }
    }
    
    // Define insertTable function first
    const insertTable = () => {
      const rows = selectedRows
      const cols = selectedCols
      
      // Get current selection
      const range = quill.getSelection(true)
      const index = range ? range.index : quill.getLength()
      
      // Build table HTML string
      let tableHTML = '<table class="quill-table" style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 2px solid #171717; background-color: #ffffff;"><tbody>'
      
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>'
        for (let j = 0; j < cols; j++) {
          tableHTML += '<td style="border: 1px solid #171717; padding: 8px; min-width: 50px; min-height: 30px; background-color: #ffffff;">&nbsp;</td>'
        }
        tableHTML += '</tr>'
      }
      
      tableHTML += '</tbody></table><p><br></p>'
      
      // Insert using dangerouslyPasteHTML
      quill.clipboard.dangerouslyPasteHTML(index, tableHTML, 'user')
      
      // Update content immediately
      const updatedContent = quill.root.innerHTML
      onChange(updatedContent)
      
      // Apply styles directly to DOM elements after a short delay
      // Also trigger the applyTableStyles function
      setTimeout(() => {
        const insertedTable = quill.root.querySelector('.quill-table') || quill.root.querySelector('table')
        if (insertedTable) {
          // Force apply styles with !important via setProperty
          const tableEl = insertedTable as HTMLElement
          tableEl.style.setProperty('border-collapse', 'collapse', 'important')
          tableEl.style.setProperty('width', '100%', 'important')
          tableEl.style.setProperty('margin', '10px 0', 'important')
          tableEl.style.setProperty('border', '2px solid #171717', 'important')
          tableEl.style.setProperty('background-color', '#ffffff', 'important')
          tableEl.style.setProperty('border-spacing', '0', 'important')
          tableEl.style.setProperty('display', 'table', 'important')
          
          // Apply styles to all cells with !important
          const cells = insertedTable.querySelectorAll('td, th')
          cells.forEach((cell) => {
            const cellEl = cell as HTMLElement
            cellEl.style.setProperty('border', '1px solid #171717', 'important')
            cellEl.style.setProperty('padding', '8px', 'important')
            cellEl.style.setProperty('min-width', '50px', 'important')
            cellEl.style.setProperty('min-height', '30px', 'important')
            cellEl.style.setProperty('background-color', '#ffffff', 'important')
            cellEl.style.setProperty('display', 'table-cell', 'important')
            cellEl.style.setProperty('vertical-align', 'top', 'important')
          })
          
          // Force reflow
          void tableEl.offsetHeight
        }
        
        // Try to place cursor in first cell
        setTimeout(() => {
          const firstCell = quill.root.querySelector('table td')
          if (firstCell) {
            quill.setSelection(index + 1)
          }
        }, 50)
      }, 200)
      
      document.body.removeChild(dialog)
      toast.success(`Table inserted (${rows} × ${cols})`)
    }
    
    // Create 10x10 grid
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div')
        cell.style.cssText = `
          width: 20px;
          height: 20px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: background 0.1s;
        `
        
        cell.addEventListener('mouseenter', () => {
          hoveredRows = row + 1
          hoveredCols = col + 1
          updateGrid()
        })
        
        cell.addEventListener('click', () => {
          selectedRows = row + 1
          selectedCols = col + 1
          insertTable()
        })
        
        cells.push(cell)
        gridContainer.appendChild(cell)
      }
    }
    
    const sizeText = document.createElement('div')
    sizeText.id = 'table-size-text'
    sizeText.textContent = `${selectedRows} × ${selectedCols}`
    sizeText.style.cssText = `
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 16px;
      font-weight: 500;
    `
    
    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    `
    
    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancel'
    cancelButton.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    `
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(dialog)
    })
    
    const insertButton = document.createElement('button')
    insertButton.textContent = 'Insert Table'
    insertButton.style.cssText = `
      padding: 8px 16px;
      border: none;
      background: #3b82f6;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `
    insertButton.addEventListener('click', insertTable)
    
    // Initialize grid
    updateGrid()
    
    // Assemble dialog
    buttonContainer.appendChild(cancelButton)
    buttonContainer.appendChild(insertButton)
    container.appendChild(title)
    container.appendChild(sizeText)
    container.appendChild(gridContainer)
    container.appendChild(buttonContainer)
    dialog.appendChild(container)
    
    // Add to body
    document.body.appendChild(dialog)
    
    // Close on outside click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog)
      }
    })
  }, [onChange])

  // Function to apply table styles
  const applyTableStyles = useCallback(() => {
    if (!editorContainerRef.current) return
    
    const editor = editorContainerRef.current.querySelector('.ql-editor')
    if (!editor) return
    
    const tables = editor.querySelectorAll('table')
    tables.forEach((table) => {
      const tableEl = table as HTMLElement
      tableEl.style.borderCollapse = 'collapse'
      tableEl.style.width = '100%'
      tableEl.style.margin = '10px 0'
      tableEl.style.border = '2px solid #171717'
      tableEl.style.backgroundColor = '#ffffff'
      tableEl.style.borderSpacing = '0'
      tableEl.style.display = 'table'
      
      const cells = table.querySelectorAll('td, th')
      cells.forEach((cell) => {
        const cellEl = cell as HTMLElement
        cellEl.style.border = '1px solid #171717'
        cellEl.style.padding = '8px'
        cellEl.style.minWidth = '50px'
        cellEl.style.minHeight = '30px'
        cellEl.style.backgroundColor = '#ffffff'
        cellEl.style.display = 'table-cell'
        cellEl.style.verticalAlign = 'top'
      })
    })
  }, [])

  // MutationObserver to maintain table styles
  useEffect(() => {
    if (!editorContainerRef.current) return
    
    const editor = editorContainerRef.current.querySelector('.ql-editor')
    if (!editor) return
    
    // Apply styles initially
    applyTableStyles()
    
    // Create MutationObserver to watch for changes
    const observer = new MutationObserver(() => {
      applyTableStyles()
    })
    
    observer.observe(editor, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    })
    
    // Also apply on content changes
    const interval = setInterval(() => {
      applyTableStyles()
    }, 500)
    
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [applyTableStyles])

  // Add custom table button to toolbar if Quill doesn't show it
  useEffect(() => {
    const addTableButton = () => {
      if (!editorContainerRef.current) return
      
      const toolbar = editorContainerRef.current.querySelector('.ql-toolbar')
      if (!toolbar) return
      
      // Check if table button already exists
      const existingTableBtn = toolbar.querySelector('[data-value="insert-table"], .ql-table-button')
      if (existingTableBtn) return
      
      // Find the video button and its parent format group
      const videoButton = toolbar.querySelector('[data-value="video"]')
      const cleanButton = toolbar.querySelector('[data-value="clean"]')
      
      // Create table button group
      const tableButtonGroup = document.createElement('span')
      tableButtonGroup.className = 'ql-formats'
      
      const tableBtn = document.createElement('button')
      tableBtn.type = 'button'
      tableBtn.className = 'ql-table-button'
      tableBtn.setAttribute('aria-label', 'Insert Table')
      tableBtn.setAttribute('title', 'Insert Table')
      tableBtn.style.cssText = 'width: 28px; height: 24px; display: inline-block;'
      tableBtn.innerHTML = `
        <svg viewBox="0 0 18 18" style="width: 18px; height: 18px; display: block; margin: 0 auto;">
          <rect class="ql-stroke" height="12" width="12" x="3" y="3" fill="none" stroke="currentColor" stroke-width="1"></rect>
          <rect class="ql-fill" height="2" width="2" x="5" y="5" fill="currentColor"></rect>
          <rect class="ql-fill" height="2" width="2" x="11" y="5" fill="currentColor"></rect>
          <rect class="ql-fill" height="2" width="2" x="5" y="11" fill="currentColor"></rect>
          <rect class="ql-fill" height="2" width="2" x="11" y="11" fill="currentColor"></rect>
        </svg>
      `
      
      tableBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        tableHandler()
      }
      
      tableButtonGroup.appendChild(tableBtn)
      
      // Insert after video button's parent format group, or before clean button
      if (videoButton?.parentElement) {
        // Insert after the format group containing video button
        videoButton.parentElement.insertAdjacentElement('afterend', tableButtonGroup)
      } else if (cleanButton?.parentElement) {
        // Insert before clean button's format group
        cleanButton.parentElement.insertAdjacentElement('beforebegin', tableButtonGroup)
      } else {
        // Fallback: append to end
        toolbar.appendChild(tableButtonGroup)
      }
    }
    
    // Wait for Quill to initialize - try multiple times
    const tryAdd = () => {
      const toolbar = editorContainerRef.current?.querySelector('.ql-toolbar')
      if (toolbar) {
        addTableButton()
      } else {
        setTimeout(tryAdd, 100)
      }
    }
    
    const timer = setTimeout(tryAdd, 300)
    
    return () => clearTimeout(timer)
  }, [tableHandler])

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
        image: imageHandler,
        table: tableHandler
      }
    },
    // Custom table handler with visual grid selector for inserting tables
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
        
        /* Table styles - Apply to ALL tables */
        .rich-text-editor .ql-editor table,
        .rich-text-editor table,
        .ql-editor table {
          border-collapse: collapse !important;
          margin: 10px 0 !important;
          width: 100% !important;
          border: 2px solid #171717 !important;
          display: table !important;
          background-color: #ffffff !important;
          border-spacing: 0 !important;
        }
        .rich-text-editor .ql-editor table td,
        .rich-text-editor .ql-editor table th,
        .rich-text-editor table td,
        .rich-text-editor table th,
        .ql-editor table td,
        .ql-editor table th {
          border: 1px solid #171717 !important;
          padding: 8px !important;
          min-width: 50px !important;
          min-height: 30px !important;
          vertical-align: top !important;
          background-color: #ffffff !important;
          display: table-cell !important;
        }
        .rich-text-editor .ql-editor table th,
        .rich-text-editor table th,
        .ql-editor table th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
          border: 1px solid #171717 !important;
        }
        .rich-text-editor .ql-editor table tbody tr,
        .rich-text-editor table tbody tr,
        .ql-editor table tbody tr {
          display: table-row !important;
        }
        .rich-text-editor .ql-editor table tbody td,
        .rich-text-editor table tbody td,
        .ql-editor table tbody td {
          display: table-cell !important;
        }
        .rich-text-editor .ql-editor table thead,
        .rich-text-editor table thead,
        .ql-editor table thead {
          display: table-header-group !important;
        }
        .rich-text-editor .ql-editor table tbody,
        .rich-text-editor table tbody,
        .ql-editor table tbody {
          display: table-row-group !important;
        }
        .rich-text-editor .ql-editor .quill-table,
        .rich-text-editor .quill-table {
          border: 2px solid #171717 !important;
        }
        .rich-text-editor .ql-editor .quill-table td,
        .rich-text-editor .quill-table td {
          border: 1px solid #171717 !important;
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

