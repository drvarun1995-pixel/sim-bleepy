import type { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Sign in | Bleepy',
  robots: NOINDEX_ROBOTS,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
