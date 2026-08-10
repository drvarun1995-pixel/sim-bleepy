import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

export const NOINDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
}

export function buildPageMetadata(opts: {
  title: string
  description: string
  path: string
  robots?: Metadata['robots']
}): Metadata {
  const url = absoluteUrl(opts.path)
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.robots,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  }
}
