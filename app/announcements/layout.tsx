import type { Metadata } from 'next'
import '../content-styles.css'

export const metadata: Metadata = {
  title: 'Announcements | Bleepy',
  description:
    'Stay updated with the latest features, improvements, and news from the Bleepy platform.',
}

export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
