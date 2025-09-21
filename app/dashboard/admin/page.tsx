import { LiveMetricsPanel } from '@/components/dashboard/LiveMetricsPanel'
import { StationPerformanceTable } from '@/components/dashboard/StationPerformanceTable'
import { TechHealthPanel } from '@/components/dashboard/TechHealthPanel'
import { CostTelemetryPanel } from '@/components/dashboard/CostTelemetryPanel'
import { ContentOpsPanel } from '@/components/dashboard/ContentOpsPanel'
import { CompliancePanel } from '@/components/dashboard/CompliancePanel'
import { mockLiveMetrics, mockStationPerformance, mockTechHealth, mockCostTelemetry } from '@/lib/mockData'

export default async function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor system performance and operations</p>
      </div>

      {/* Live Metrics */}
      <LiveMetricsPanel data={mockLiveMetrics} />

      {/* Station Performance */}
      <StationPerformanceTable data={mockStationPerformance} />

      {/* Tech Health & Cost Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechHealthPanel data={mockTechHealth} />
        <CostTelemetryPanel data={mockCostTelemetry} />
      </div>

      {/* Content Operations & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentOpsPanel />
        <CompliancePanel />
      </div>
    </div>
  )
}