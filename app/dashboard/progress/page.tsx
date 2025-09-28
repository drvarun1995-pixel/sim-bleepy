import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DatabaseHistoryContent } from '@/components/dashboard/DatabaseHistoryContent'
import { GamificationProgress } from '@/components/dashboard/GamificationProgress'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <div>Please sign in to access the dashboard.</div>
  }
  
  return (
    <div className="space-y-8">
      {/* Gamification Progress */}
      <GamificationProgress />
      
      {/* Consultation History */}
      <DatabaseHistoryContent />
    </div>
  )
}
