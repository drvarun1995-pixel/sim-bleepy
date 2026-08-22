import type { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Download Analytics | Bleepy',
  robots: NOINDEX_ROBOTS,
}

export default function DownloadAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
