import { createClient } from '@/utils/supabase/server'
import { KPIGrid } from '@/components/dashboard/KPIGrid'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { RadarDomains } from '@/components/dashboard/RadarDomains'
import { AttemptsTable } from '@/components/dashboard/AttemptsTable'
import { SkillGapsPanel } from '@/components/dashboard/SkillGapsPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, BookOpen, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Fetch student data
  const [
    { data: sessions },
    { data: scores },
    { data: profile }
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id,
        station_id,
        started_at,
        ended_at,
        duration_s,
        completed,
        stations(title, specialty)
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('scores')
      .select(`
        id,
        session_id,
        overall_pct,
        data_gathering_pct,
        clinical_mgmt_pct,
        communication_pct,
        sessions(started_at, stations(title))
      `)
      .eq('sessions.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('profiles')
      .select('full_name, org')
      .eq('id', user.id)
      .single()
  ])

  // Calculate KPIs
  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.completed).length || 0
  const averageScore = scores && scores.length > 0 ? scores.reduce((acc, score) => acc + score.overall_pct, 0) / scores.length : 0
  const bestScore = Math.max(...(scores?.map(s => s.overall_pct) || [0]))
  
  // Calculate streak (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentSessions = sessions?.filter(s => 
    new Date(s.started_at) >= sevenDaysAgo
  ).length || 0

  const kpiData = [
    {
      title: 'Current Streak',
      value: recentSessions.toString(),
      description: 'Sessions in last 7 days',
      icon: TrendingUp,
      trend: (recentSessions > 3 ? 'up' : recentSessions > 1 ? 'stable' : 'down') as 'up' | 'stable' | 'down'
    },
    {
      title: 'Best Score',
      value: `${bestScore}%`,
      description: 'Highest score achieved',
      icon: Trophy,
      trend: 'up' as const
    },
    {
      title: 'Average Score',
      value: `${Math.round(averageScore)}%`,
      description: 'Overall performance',
      icon: TrendingUp,
      trend: (averageScore > 70 ? 'up' : averageScore > 50 ? 'stable' : 'down') as 'up' | 'stable' | 'down'
    },
    {
      title: 'Completion Rate',
      value: `${Math.round((completedSessions / totalSessions) * 100)}%`,
      description: 'Sessions completed',
      icon: Play,
      trend: (completedSessions / totalSessions > 0.8 ? 'up' : 'stable') as 'up' | 'stable'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {profile?.full_name || 'Student'}!
        </h1>
        <p className="text-blue-100">
          Ready to continue your clinical skills training? Let's see how you're progressing.
        </p>
        <div className="mt-4 flex space-x-3">
          <Button asChild variant="secondary">
            <Link href="/station">
              <Play className="w-4 h-4 mr-2" />
              Resume Last Session
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-white border-white hover:bg-white hover:text-blue-800">
            <Link href="/scenarios">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Stations
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <KPIGrid data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Your scores across all completed sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={[]} />
          </CardContent>
        </Card>

        {/* OSCE Domains Radar */}
        <Card>
          <CardHeader>
            <CardTitle>OSCE Domains Analysis</CardTitle>
            <CardDescription>
              Performance breakdown across clinical competencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarDomains data={[]} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
          <CardDescription>
            Your latest simulation sessions and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttemptsTable data={[]} />
        </CardContent>
      </Card>

      {/* Skill Gaps Panel */}
      <SkillGapsPanel scores={[]} />
    </div>
  )
}
