'use client'

import dynamic from 'next/dynamic'

/** Code-split TipTap so edit routes do not inflate shared marketing bundles. */
export const TiptapSimpleEditor = dynamic(
  () =>
    import('./tiptap-simple-editor').then((mod) => ({
      default: mod.TiptapSimpleEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-500">
        Loading editor…
      </div>
    ),
  }
)
