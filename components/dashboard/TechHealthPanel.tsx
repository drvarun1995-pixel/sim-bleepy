'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface TechHealthData {
  asrLatencyP50: number
  asrLatencyP95: number
  ttsLatencyP50: number
  ttsLatencyP95: number
  disconnectRate: number
  scoringFailCount: number
}

interface TechHealthPanelProps {
  data: TechHealthData
}

export function TechHealthPanel({ data }: TechHealthPanelProps) {
  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
  }

  const asrP50Status = getHealthStatus(data.asrLatencyP50, { good: 150, warning: 300 })
  const asrP95Status = getHealthStatus(data.asrLatencyP95, { good: 300, warning: 500 })
  const ttsP50Status = getHealthStatus(data.ttsLatencyP50, { good: 100, warning: 200 })
  const ttsP95Status = getHealthStatus(data.ttsLatencyP95, { good: 250, warning: 400 })
  const disconnectStatus = getHealthStatus(data.disconnectRate, { good: 2, warning: 5 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Tech Health
        </CardTitle>
        <CardDescription>
          System performance and reliability metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ASR Latency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ASR Latency</span>
            <Badge variant="outline" className={asrP95Status.color}>
              {asrP95Status.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border ${asrP50Status.bgColor} ${asrP50Status.borderColor}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">P50</span>
                <span className={`text-sm font-medium ${asrP50Status.color}`}>
                  {data.asrLatencyP50}ms
                </span>
              </div>
              <Progress value={(data.asrLatencyP50 / 500) * 100} className="h-2" />
            </div>
            <div className={`p-3 rounded-lg border ${asrP95Status.bgColor} ${asrP95Status.borderColor}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">P95</span>
                <span className={`text-sm font-medium ${asrP95Status.color}`}>
                  {data.asrLatencyP95}ms
                </span>
              </div>
              <Progress value={(data.asrLatencyP95 / 500) * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* TTS Latency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">TTS Latency</span>
            <Badge variant="outline" className={ttsP95Status.color}>
              {ttsP95Status.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border ${ttsP50Status.bgColor} ${ttsP50Status.borderColor}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">P50</span>
                <span className={`text-sm font-medium ${ttsP50Status.color}`}>
                  {data.ttsLatencyP50}ms
                </span>
              </div>
              <Progress value={(data.ttsLatencyP50 / 250) * 100} className="h-2" />
            </div>
            <div className={`p-3 rounded-lg border ${ttsP95Status.bgColor} ${ttsP95Status.borderColor}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">P95</span>
                <span className={`text-sm font-medium ${ttsP95Status.color}`}>
                  {data.ttsLatencyP95}ms
                </span>
              </div>
              <Progress value={(data.ttsLatencyP95 / 250) * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Disconnect Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Disconnect Rate</span>
            <Badge variant="outline" className={disconnectStatus.color}>
              {disconnectStatus.status}
            </Badge>
          </div>
          <div className={`p-3 rounded-lg border ${disconnectStatus.bgColor} ${disconnectStatus.borderColor}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Last 24h</span>
              <span className={`text-sm font-medium ${disconnectStatus.color}`}>
                {data.disconnectRate}%
              </span>
            </div>
            <Progress value={(data.disconnectRate / 10) * 100} className="h-2" />
          </div>
        </div>

        {/* Error Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Error Summary</span>
            <div className="flex items-center space-x-2">
              {data.scoringFailCount === 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scoring Failures</span>
              <span className="font-medium">{data.scoringFailCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last 24h</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}