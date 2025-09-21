'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'

interface CostTelemetryData {
  totalCost: number
  totalTokens: number
  totalDuration: number
  providerBreakdown: {
    hume: { cost: number; tokens: number; duration: number }
    openai: { cost: number; tokens: number; duration: number }
  }
  serviceBreakdown: {
    asr: { cost: number; duration: number }
    tts: { cost: number; duration: number }
    chat: { cost: number; tokens: number }
    embeddings: { cost: number; tokens: number }
    emotion: { cost: number; tokens: number }
  }
}

interface RealtimeMetrics {
  activeSessions: number
  currentCostPerMinute: number
  estimatedDailyCost: number
}

interface CostTelemetryPanelProps {
  data?: CostTelemetryData // Keep for backward compatibility
}

export function CostTelemetryPanel({ data: mockData }: CostTelemetryPanelProps) {
  const [usageData, setUsageData] = useState<CostTelemetryData | null>(null)
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use real data if available, otherwise fall back to mock data
  const data = usageData || mockData

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch usage summary for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const usageResponse = await fetch(`/api/analytics/usage-summary?start_date=${thirtyDaysAgo}`)
      
      if (!usageResponse.ok) {
        throw new Error('Failed to fetch usage data')
      }
      
      const usage = await usageResponse.json()
      setUsageData(usage)

      // Fetch real-time metrics
      const realtimeResponse = await fetch('/api/analytics/realtime-usage')
      
      if (realtimeResponse.ok) {
        const realtime = await realtimeResponse.json()
        setRealtimeMetrics(realtime)
      }
    } catch (err) {
      console.error('Failed to fetch usage data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
    
    // Refresh every 30 seconds for real-time data
    const interval = setInterval(fetchUsageData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Cost Telemetry
          </CardTitle>
          <CardDescription>Loading cost data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalCost = data?.totalCost || 0
  const humeCost = data?.providerBreakdown?.hume?.cost || 0
  const openaiCost = data?.providerBreakdown?.openai?.cost || 0
  const humePercentage = totalCost > 0 ? (humeCost / totalCost) * 100 : 0
  const openaiPercentage = totalCost > 0 ? (openaiCost / totalCost) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Cost Telemetry
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchUsageData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          AI service usage costs and provider breakdown
          {error && <span className="text-red-600 ml-2">({error})</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <Badge variant="outline">£{totalCost.toFixed(2)}</Badge>
            </div>
            <div className="text-2xl font-bold">£{totalCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Daily Estimate</span>
              <Badge variant="outline">
                £{realtimeMetrics?.estimatedDailyCost?.toFixed(2) || '0.00'}
              </Badge>
            </div>
            <div className="text-2xl font-bold">
              £{realtimeMetrics?.estimatedDailyCost?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Current rate
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Provider Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Hume AI</span>
              </div>
              <span className="text-sm font-medium">£{humeCost.toFixed(2)}</span>
            </div>
            <Progress value={humePercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {humePercentage.toFixed(1)}% of total cost
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">OpenAI</span>
              </div>
              <span className="text-sm font-medium">£{openaiCost.toFixed(2)}</span>
            </div>
            <Progress value={openaiPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {openaiPercentage.toFixed(1)}% of total cost
            </div>
          </div>
        </div>

        {/* Cost Trends */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Cost Trends</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-green-600">-5.2%</div>
              <div className="text-xs text-muted-foreground">vs last week</div>
              <TrendingDown className="w-4 h-4 mx-auto mt-1 text-green-600" />
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-blue-600">£0.47</div>
              <div className="text-xs text-muted-foreground">avg per session</div>
              <Minus className="w-4 h-4 mx-auto mt-1 text-blue-600" />
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-purple-600">+12.3%</div>
              <div className="text-xs text-muted-foreground">usage growth</div>
              <TrendingUp className="w-4 h-4 mx-auto mt-1 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Cost Optimization Tips */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Optimization Tips</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full mt-2"></div>
              <span>Consider caching frequent responses to reduce API calls</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full mt-2"></div>
              <span>Monitor token usage patterns to optimize prompts</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 bg-purple-500 rounded-full mt-2"></div>
              <span>Review session lengths to identify efficiency opportunities</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}