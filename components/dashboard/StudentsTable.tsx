'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { User, TrendingUp, TrendingDown, Minus, Mail } from 'lucide-react'
import { cn } from '@/utils'

interface StudentData {
  user_id: string
  profiles: {
    full_name: string
    org: string
  }
}

interface ScoreData {
  id: string
  session_id: string
  overall_pct: number
  sessions: {
    user_id: string
    started_at: string
  }
}

interface StudentsTableProps {
  students: StudentData[]
  scores: ScoreData[]
}

export function StudentsTable({ students, scores }: StudentsTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'attempts'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Calculate student statistics
  const studentStats = students.map(student => {
    const studentScores = scores.filter(score => score.sessions.user_id === student.user_id)
    const latestScore = studentScores.sort((a, b) => 
      new Date(b.sessions.started_at).getTime() - new Date(a.sessions.started_at).getTime()
    )[0]
    
    const averageScore = studentScores.length > 0 
      ? Math.round(studentScores.reduce((acc, score) => acc + score.overall_pct, 0) / studentScores.length)
      : 0
    
    const attempts = studentScores.length
    
    // Calculate trend (comparing last 3 vs previous 3)
    const recentScores = studentScores.slice(0, 3).map(s => s.overall_pct)
    const previousScores = studentScores.slice(3, 6).map(s => s.overall_pct)
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (recentScores.length >= 2 && previousScores.length >= 2) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length
      const diff = recentAvg - previousAvg
      if (diff > 5) trend = 'up'
      else if (diff < -5) trend = 'down'
    }

    return {
      ...student,
      latestScore: latestScore?.overall_pct || 0,
      averageScore,
      attempts,
      trend,
      lastActivity: latestScore?.sessions.started_at || null
    }
  })

  // Sort students
  const sortedStudents = [...studentStats].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortBy) {
      case 'name':
        aValue = a.profiles.full_name
        bValue = b.profiles.full_name
        break
      case 'score':
        aValue = a.averageScore
        bValue = b.averageScore
        break
      case 'attempts':
        aValue = a.attempts
        bValue = b.attempts
        break
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    }
  })

  const handleSort = (column: 'name' | 'score' | 'attempts') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</Badge>
    } else if (score >= 70) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Good</Badge>
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Average</Badge>
    } else {
      return <Badge variant="destructive">Needs Improvement</Badge>
    }
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No students in your cohorts</p>
        <p className="text-sm">Invite students to join your cohorts to see their progress</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentStats.filter(s => s.attempts > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentStats.length > 0 
                ? Math.round(studentStats.reduce((acc, s) => acc + s.averageScore, 0) / studentStats.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentStats.length > 0 
                ? Math.round((studentStats.filter(s => s.averageScore >= 70).length / studentStats.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center gap-2">
                  Latest Score
                  {sortBy === 'score' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('attempts')}
              >
                <div className="flex items-center gap-2">
                  Attempts
                  {sortBy === 'attempts' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student) => (
              <TableRow key={student.user_id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{student.profiles.full_name}</div>
                    <div className="text-sm text-muted-foreground">{student.profiles.org}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{student.latestScore}%</span>
                    {getScoreBadge(student.latestScore)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{student.attempts}</span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Avg: {student.averageScore}%</div>
                    {student.attempts > 1 && (
                      <div className="text-muted-foreground">
                        Range: {Math.min(...scores.filter(s => s.sessions.user_id === student.user_id).map(s => s.overall_pct))}% - {Math.max(...scores.filter(s => s.sessions.user_id === student.user_id).map(s => s.overall_pct))}%
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(student.trend)}
                    <span className="text-sm capitalize">{student.trend}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {student.lastActivity ? (
                    <div className="text-sm">
                      {format(new Date(student.lastActivity), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No activity</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <Mail className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
