import { createClient } from '@/utils/supabase/server'
import { KPIGrid } from '@/components/dashboard/KPIGrid'
import { CohortSelector } from '@/components/dashboard/CohortSelector'
import { CohortRadarChart } from '@/components/dashboard/CohortRadarChart'
import { StationUsageChart } from '@/components/dashboard/StationUsageChart'
import { StudentsTable } from '@/components/dashboard/StudentsTable'
import { AssignmentBuilder } from '@/components/dashboard/AssignmentBuilder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, TrendingUp, Award, Download, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function EducatorDashboard() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Fetch educator data
  const [
    { data: cohorts },
    { data: students },
    { data: sessions },
    { data: scores },
    { data: profile }
  ] = await Promise.all([
    supabase
      .from('cohorts')
      .select(`
        id,
        name,
        org,
        cohort_members(count)
      `)
      .eq('owner_id', user.id),
    
    supabase
      .from('cohort_members')
      .select(`
        user_id,
        profiles(full_name, org)
      `)
      .eq('cohorts.owner_id', user.id),
    
    supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        station_id,
        completed,
        started_at,
        stations(title, specialty)
      `)
      .eq('cohort_members.cohorts.owner_id', user.id)
      .limit(100),
    
    supabase
      .from('scores')
      .select(`
        id,
        session_id,
        overall_pct,
        sessions(user_id, started_at)
      `)
      .eq('sessions.cohort_members.cohorts.owner_id', user.id),
    
    supabase
      .from('profiles')
      .select('full_name, org')
      .eq('id', user.id)
      .single()
  ])

  // Calculate KPIs
  const totalStudents = students?.length || 0
  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.completed).length || 0
  const averageScore = scores?.reduce((acc, score) => acc + score.overall_pct, 0) / (scores?.length || 1) || 0
  const passRate = scores?.filter(s => s.overall_pct >= 70).length / (scores?.length || 1) * 100 || 0

  const kpiData = [
    {
      title: 'Total Students',
      value: totalStudents.toString(),
      description: 'Across all cohorts',
      icon: Users,
      trend: totalStudents > 0 ? 'up' : 'stable' as const
    },
    {
      title: 'Median Score',
      value: `${Math.round(averageScore)}%`,
      description: 'Cohort performance',
      icon: TrendingUp,
      trend: averageScore > 70 ? 'up' : averageScore > 50 ? 'stable' : 'down' as const
    },
    {
      title: 'Pass Rate',
      value: `${Math.round(passRate)}%`,
      description: 'Students scoring ≥70%',
      icon: Award,
      trend: passRate > 80 ? 'up' : passRate > 60 ? 'stable' : 'down' as const
    },
    {
      title: 'Completion Rate',
      value: `${Math.round((completedSessions / totalSessions) * 100)}%`,
      description: 'Sessions completed',
      icon: BookOpen,
      trend: completedSessions / totalSessions > 0.8 ? 'up' : 'stable' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {profile?.full_name || 'Educator'}!
        </h1>
        <p className="text-green-100">
          Monitor your students' progress and create engaging learning experiences.
        </p>
        <div className="mt-4 flex space-x-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard/educator/cohorts">
              <Users className="w-4 h-4 mr-2" />
              Manage Cohorts
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-white border-white hover:bg-white hover:text-green-800">
            <Link href="/dashboard/educator/assignments">
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-white border-white hover:bg-white hover:text-green-800">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Cohort Selector */}
      <CohortSelector cohorts={cohorts || []} />

      {/* KPI Grid */}
      <KPIGrid data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort vs Global Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Performance</CardTitle>
            <CardDescription>
              Your cohort vs global averages across OSCE domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CohortRadarChart scores={scores || []} />
          </CardContent>
        </Card>

        {/* Station Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Station Usage</CardTitle>
            <CardDescription>
              Most popular stations in your cohorts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StationUsageChart sessions={sessions || []} />
          </CardContent>
        </Card>
      </div>

      {/* Students Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Performance</CardTitle>
          <CardDescription>
            Latest scores and attempt counts for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsTable students={students || []} scores={scores || []} />
        </CardContent>
      </Card>

      {/* Quick Assignment Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Assignment</CardTitle>
          <CardDescription>
            Create a new assignment for your cohorts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentBuilder cohorts={cohorts || []} />
        </CardContent>
      </Card>
    </div>
  )
}
