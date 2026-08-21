import { redirect } from 'next/navigation'

export default function NewsletterPreviewRedirect() {
  redirect('/emails/newsletter')
}
