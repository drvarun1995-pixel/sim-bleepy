'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Graduate preview now lives in the system email template hub. */
export default function GraduateEmailTemplatePreviewRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/emails/templates')
  }, [router])
  return null
}
