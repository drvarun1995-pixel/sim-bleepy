import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your certificate | Bleepy',
  robots: { index: false, follow: false },
}

export default function GuestCertificateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
