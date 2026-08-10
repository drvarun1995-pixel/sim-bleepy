import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Bleepy | Clinical Skills Training for NHS Doctors',
  description:
    'Learn about Bleepy — AI clinical skills simulation and Foundation Year teaching resources for NHS doctors, piloted at Basildon.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
