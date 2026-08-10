import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Bleepy Tutorials | How to Use the Platform',
  description:
    'Step-by-step Bleepy tutorials for doctors and educators — getting started with simulation, events, portfolios, and Foundation Year tools.',
  path: '/tutorials',
})

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return children
}
