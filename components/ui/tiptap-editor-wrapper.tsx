"use client"

import dynamic from 'next/dynamic'

// Dynamically import the Tiptap editor to avoid SSR issues
const TiptapEditor = dynamic(() => import('./tiptap-editor').then(mod => ({ default: mod.TiptapEditor })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px] border border-gray-300 rounded-md bg-white">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  )
})

export { TiptapEditor }

