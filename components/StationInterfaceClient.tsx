'use client'

import dynamic from 'next/dynamic'
import type { StationConfig } from '@/utils/stationConfigs'

const StationInterface = dynamic(() => import('@/components/StationInterface'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" />
  ),
})

export function StationInterfaceClient({
  stationConfig,
  accessToken,
}: {
  stationConfig: StationConfig
  accessToken: string
}) {
  return <StationInterface stationConfig={stationConfig} accessToken={accessToken} />
}
