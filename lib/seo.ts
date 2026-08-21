import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site-url'

/** Default 1200×630 share card for Facebook / WhatsApp / X / LinkedIn. */
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png'
export const DEFAULT_OG_IMAGE_VERSION = 4

export const DEFAULT_OG_IMAGE = {
  url: `${DEFAULT_OG_IMAGE_PATH}?v=${DEFAULT_OG_IMAGE_VERSION}`,
  width: 1200,
  height: 630,
  alt: 'Bleepy — AI clinical skills training for NHS doctors',
} as const

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
  image?: { url: string; width?: number; height?: number; alt?: string }
}): Metadata {
  const url = absoluteUrl(opts.path)
  const image = opts.image
    ? {
        url: opts.image.url.startsWith('http')
          ? opts.image.url
          : absoluteUrl(opts.image.url),
        width: opts.image.width || 1200,
        height: opts.image.height || 630,
        alt: opts.image.alt || opts.title,
      }
    : {
        url: absoluteUrl(DEFAULT_OG_IMAGE.url),
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      }

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
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [image.url],
    },
  }
}
