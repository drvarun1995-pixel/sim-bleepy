import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { stationConfigs } from '@/utils/stationConfigs'

export const dynamic = 'force-dynamic'

export default async function RandomStationPage() {
  const available = Object.values(stationConfigs).filter((station) => station.available)
  const station = available[Math.floor(Math.random() * Math.max(available.length, 1))]
  const dest = station ? `/station/${station.id}` : '/stations'

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(dest)}`)
  }

  redirect(dest)
}
