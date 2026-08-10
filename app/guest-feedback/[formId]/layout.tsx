import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Event feedback | Bleepy',
  robots: { index: false, follow: false },
}

/** Public walk-in feedback — no signed-in shell */
export default function GuestFeedbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
