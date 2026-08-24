import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ConferenceBackLink({ href = '/conferences' }: { href?: string }) {
  return (
    <Button asChild>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        All opportunities
      </Link>
    </Button>
  )
}
