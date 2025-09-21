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
    user_id: string
    started_at: string
  }
}

interface CohortRadarChartProps {
  scores: ScoreData[]
}

export function CohortRadarChart({ scores }: CohortRadarChartProps) {
  // Calculate cohort averages
  const cohortAverages = scores.reduce((acc, score) => {
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

  const count = Math.max(scores.length, 1)
  const averages = {
    dataGathering: Math.round(cohortAverages.dataGathering / count),
    clinicalManagement: Math.round(cohortAverages.clinicalManagement / count),
    communication: Math.round(cohortAverages.communication / count),
    overall: Math.round(cohortAverages.overall / count)
  }

  // Mock global averages (in real app, this would come from API)
  const globalAverages = {
    dataGathering: 72,
    clinicalManagement: 68,
    communication: 75,
    overall: 71
  }

  const radarData = [
    {
      subject: 'Data Gathering',
      cohort: averages.dataGathering,
      global: globalAverages.dataGathering,
      fullMark: 100,
    },
    {
      subject: 'Clinical Management',
      cohort: averages.clinicalManagement,
      global: globalAverages.clinicalManagement,
      fullMark: 100,
    },
    {
      subject: 'Communication',
      cohort: averages.communication,
      global: globalAverages.communication,
      fullMark: 100,
    },
  ]

  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No cohort data available</p>
          <p className="text-sm">Students need to complete sessions to see performance comparison</p>
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
            name="Your Cohort"
            dataKey="cohort"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="Global Average"
            dataKey="global"
            stroke="#6b7280"
            fill="#6b7280"
            fillOpacity={0.1}
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Legend and summary */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Your Cohort</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full border-2 border-dashed border-gray-500"></div>
            <span>Global Average</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Gathering:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{averages.dataGathering}%</span>
                <span className={`text-xs ${averages.dataGathering > globalAverages.dataGathering ? 'text-green-600' : 'text-red-600'}`}>
                  ({averages.dataGathering > globalAverages.dataGathering ? '+' : ''}{averages.dataGathering - globalAverages.dataGathering}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clinical Management:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{averages.clinicalManagement}%</span>
                <span className={`text-xs ${averages.clinicalManagement > globalAverages.clinicalManagement ? 'text-green-600' : 'text-red-600'}`}>
                  ({averages.clinicalManagement > globalAverages.clinicalManagement ? '+' : ''}{averages.clinicalManagement - globalAverages.clinicalManagement}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Communication:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{averages.communication}%</span>
                <span className={`text-xs ${averages.communication > globalAverages.communication ? 'text-green-600' : 'text-red-600'}`}>
                  ({averages.communication > globalAverages.communication ? '+' : ''}{averages.communication - globalAverages.communication}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
