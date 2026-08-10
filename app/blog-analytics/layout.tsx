import type { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blog Analytics | Bleepy',
  robots: NOINDEX_ROBOTS,
}

export default function BlogAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}
