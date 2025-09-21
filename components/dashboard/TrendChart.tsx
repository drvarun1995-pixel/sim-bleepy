'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface ScoreData {
  id: string
  session_id: string
  overall_pct: number
  data_gathering_pct: number
  clinical_mgmt_pct: number
  communication_pct: number
  sessions: {
    started_at: string
    stations: {
      title: string
    }
  }
}

interface TrendChartProps {
  data: ScoreData[]
}

export function TrendChart({ data }: TrendChartProps) {
  // Transform data for chart
  const chartData = data
    .sort((a, b) => new Date(a.sessions.started_at).getTime() - new Date(b.sessions.started_at).getTime())
    .map((score, index) => ({
      session: `Session ${index + 1}`,
      date: format(new Date(score.sessions.started_at), 'MMM dd'),
      overall: score.overall_pct,
      dataGathering: score.data_gathering_pct,
      clinicalMgmt: score.clinical_mgmt_pct,
      communication: score.communication_pct,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Complete some sessions to see your progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'overall' ? 'Overall' :
              name === 'dataGathering' ? 'Data Gathering' :
              name === 'clinicalMgmt' ? 'Clinical Management' :
              'Communication'
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="overall" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="dataGathering" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="clinicalMgmt" 
            stroke="#f59e0b" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="communication" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary"></div>
          <span>Overall Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border border-green-500"></div>
          <span>Data Gathering</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-amber-500 border-dashed border border-amber-500"></div>
          <span>Clinical Management</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-500 border-dashed border border-purple-500"></div>
          <span>Communication</span>
        </div>
      </div>
    </div>
  )
}
