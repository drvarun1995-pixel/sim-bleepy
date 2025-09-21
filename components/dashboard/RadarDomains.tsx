'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

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

interface RadarDomainsProps {
  data: ScoreData[]
}

export function RadarDomains({ data }: RadarDomainsProps) {
  // Calculate average scores for each domain from last 5 attempts
  const domainAverages = data.slice(0, 5).reduce((acc, score) => {
    acc.dataGathering += score.data_gathering_pct
    acc.clinicalManagement += score.clinical_mgmt_pct
    acc.communication += score.communication_pct
    acc.overall += score.overall_pct
    return acc
  }, {
    dataGathering: 0,
    clinicalManagement: 0,
    communication: 0,
    overall: 0
  })

  const count = Math.max(data.length, 1)
  const averages = {
    dataGathering: Math.round(domainAverages.dataGathering / count),
    clinicalManagement: Math.round(domainAverages.clinicalManagement / count),
    communication: Math.round(domainAverages.communication / count),
    overall: Math.round(domainAverages.overall / count)
  }

  const radarData = [
    {
      subject: 'Data Gathering',
      A: averages.dataGathering,
      fullMark: 100,
    },
    {
      subject: 'Clinical Management',
      A: averages.clinicalManagement,
      fullMark: 100,
    },
    {
      subject: 'Communication',
      A: averages.communication,
      fullMark: 100,
    },
  ]

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No OSCE data available</p>
          <p className="text-sm">Complete some sessions to see domain analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }}
            tickCount={5}
            tickFormatter={(value) => `${value}%`}
          />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Domain scores summary */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Data Gathering:</span>
          <span className="font-medium">{averages.dataGathering}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Clinical Management:</span>
          <span className="font-medium">{averages.clinicalManagement}%</span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-muted-foreground">Communication:</span>
          <span className="font-medium">{averages.communication}%</span>
        </div>
      </div>
    </div>
  )
}
