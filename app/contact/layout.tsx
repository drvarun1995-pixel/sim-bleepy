import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Bleepy | Support & Enquiries',
  description:
    'Contact the Bleepy team for support, teaching enquiries, or questions about simulation and Foundation Year resources.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
