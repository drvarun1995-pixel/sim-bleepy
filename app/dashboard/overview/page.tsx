import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OverviewContent } from '@/components/dashboard/OverviewContent'

export default async function OverviewPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Please sign in to access the dashboard.</div>
  }
  
  // Show dynamic overview content
  return <OverviewContent />
}
