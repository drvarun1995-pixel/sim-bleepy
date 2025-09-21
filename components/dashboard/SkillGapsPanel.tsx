'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BookOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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

interface SkillGapsPanelProps {
  scores: ScoreData[]
}

export function SkillGapsPanel({ scores }: SkillGapsPanelProps) {
  // Analyze last 5 attempts for skill gaps
  const recentScores = scores.slice(0, 5)
  
  if (recentScores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Skill Development
          </CardTitle>
          <CardDescription>
            Complete more sessions to identify areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No skill analysis available yet</p>
            <p className="text-sm mb-4">Complete at least 2 sessions to get personalized recommendations</p>
            <Button asChild>
              <Link href="/scenarios">
                <BookOpen className="w-4 h-4 mr-2" />
                Start Training
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate average scores for each domain
  const domainAverages = recentScores.reduce((acc, score) => {
    acc.dataGathering += score.data_gathering_pct
    acc.clinicalManagement += score.clinical_mgmt_pct
    acc.communication += score.communication_pct
    return acc
  }, {
    dataGathering: 0,
    clinicalManagement: 0,
    communication: 0
  })

  const count = recentScores.length
  const averages = {
    dataGathering: Math.round(domainAverages.dataGathering / count),
    clinicalManagement: Math.round(domainAverages.clinicalManagement / count),
    communication: Math.round(domainAverages.communication / count)
  }

  // Identify bottom 2 domains
  const domains = [
    { name: 'Data Gathering', score: averages.dataGathering, key: 'dataGathering' },
    { name: 'Clinical Management', score: averages.clinicalManagement, key: 'clinicalManagement' },
    { name: 'Communication', score: averages.communication, key: 'communication' }
  ]

  const sortedDomains = domains.sort((a, b) => a.score - b.score)
  const skillGaps = sortedDomains.slice(0, 2)

  // Suggested stations based on skill gaps (this would come from your stations data)
  const suggestedStations = {
    dataGathering: [
      { title: 'History Taking Masterclass', specialty: 'General Medicine' },
      { title: 'Systematic Assessment', specialty: 'Cardiology' }
    ],
    clinicalManagement: [
      { title: 'Emergency Decision Making', specialty: 'Emergency Medicine' },
      { title: 'Treatment Planning', specialty: 'Internal Medicine' }
    ],
    communication: [
      { title: 'Patient Communication', specialty: 'General Practice' },
      { title: 'Breaking Bad News', specialty: 'Oncology' }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
          Skill Gaps & Recommendations
        </CardTitle>
        <CardDescription>
          Based on your last {recentScores.length} attempts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skill Gap Analysis */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Areas for Improvement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillGaps.map((domain, index) => (
              <div key={domain.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{domain.name}</span>
                  <Badge 
                    variant={domain.score < 60 ? "destructive" : domain.score < 75 ? "secondary" : "default"}
                  >
                    {domain.score}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${
                      domain.score < 60 ? 'bg-red-500' : 
                      domain.score < 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${domain.score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {domain.score < 60 ? 'Needs significant improvement' :
                   domain.score < 75 ? 'Room for improvement' :
                   'Good foundation, keep practicing'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Stations */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended Training Stations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillGaps.map((domain) => (
              <div key={domain.key} className="space-y-3">
                <h4 className="font-medium text-blue-600 dark:text-blue-400">
                  Focus: {domain.name}
                </h4>
                {suggestedStations[domain.key as keyof typeof suggestedStations]?.map((station, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{station.title}</p>
                        <p className="text-sm text-muted-foreground">{station.specialty}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/station">
                          Start
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Track Your Progress
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
            Focus on these areas in your next 3-5 sessions to see measurable improvement.
          </p>
          <div className="flex flex-wrap gap-2">
            {skillGaps.map((domain) => (
              <Badge key={domain.key} variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
                {domain.name}: {domain.score}%
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
