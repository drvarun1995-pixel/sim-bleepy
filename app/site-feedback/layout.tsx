import type { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Feedback | Bleepy',
  description: 'Share brief feedback on Bleepy to help the next cohort of learners.',
  robots: NOINDEX_ROBOTS,
}

export default function SiteFeedbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
