'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SessionData {
  id: string
  user_id: string
  station_id: string
  completed: boolean
  started_at: string
  stations: {
    title: string
    specialty: string
  }
}

interface StationUsageChartProps {
  sessions: SessionData[]
}

export function StationUsageChart({ sessions }: StationUsageChartProps) {
  // Group sessions by station and calculate usage stats
  const stationUsage = sessions.reduce((acc, session) => {
    const stationTitle = session.stations.title
    if (!acc[stationTitle]) {
      acc[stationTitle] = {
        title: stationTitle,
        specialty: session.stations.specialty,
        totalAttempts: 0,
        completedAttempts: 0,
        uniqueUsers: new Set()
      }
    }
    
    acc[stationTitle].totalAttempts++
    if (session.completed) {
      acc[stationTitle].completedAttempts++
    }
    acc[stationTitle].uniqueUsers.add(session.user_id)
    
    return acc
  }, {} as Record<string, {
    title: string
    specialty: string
    totalAttempts: number
    completedAttempts: number
    uniqueUsers: Set<string>
  }>)

  // Convert to chart data and sort by total attempts
  const chartData = Object.values(stationUsage)
    .map(station => ({
      name: station.title.length > 20 ? station.title.substring(0, 20) + '...' : station.title,
      fullName: station.title,
      specialty: station.specialty,
      attempts: station.totalAttempts,
      completed: station.completedAttempts,
      uniqueUsers: station.uniqueUsers.size,
      completionRate: Math.round((station.completedAttempts / station.totalAttempts) * 100)
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 8) // Top 8 stations

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No station usage data</p>
          <p className="text-sm">Students need to start sessions to see usage patterns</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'attempts' ? 'Total Attempts' : 'Completed'
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullName
              }
              return label
            }}
          />
          <Bar 
            dataKey="attempts" 
            fill="hsl(var(--primary))" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="completed" 
            fill="#10b981" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend and summary */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Total Attempts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
        </div>
        
        {/* Top stations summary */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          {chartData.slice(0, 3).map((station, index) => (
            <div key={station.fullName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">#{index + 1}</span>
                <span className="font-medium truncate">{station.fullName}</span>
                <span className="text-muted-foreground">({station.specialty})</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{station.uniqueUsers} users</span>
                <span>{station.completionRate}% completion</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
