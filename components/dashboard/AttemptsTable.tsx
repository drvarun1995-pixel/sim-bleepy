'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Clock, CheckCircle, XCircle, Award } from 'lucide-react'
import { cn } from '@/utils'

interface SessionData {
  id: string
  station_id: string
  started_at: string
  ended_at: string | null
  duration_s: number | null
  completed: boolean
  stations: {
    title: string
    specialty: string
  }
}

interface AttemptsTableProps {
  data: SessionData[]
}

export function AttemptsTable({ data }: AttemptsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (completed: boolean, ended_at: string | null) => {
    if (!ended_at) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      )
    }
    
    return completed ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Completed
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Incomplete
      </Badge>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium">No attempts yet</p>
        <p className="text-sm">Start your first simulation to see your progress here</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">
                {format(new Date(session.started_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{session.stations.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{session.stations.specialty}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                  {formatDuration(session.duration_s)}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(session.completed, session.ended_at)}
              </TableCell>
              <TableCell>
                {/* This would be populated from scores table */}
                <div className="flex items-center">
                  {session.completed ? (
                    <>
                      <Award className="w-3 h-3 mr-1 text-yellow-500" />
                      <span className="font-medium">85%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedRow(
                    expandedRow === session.id ? null : session.id
                  )}
                >
                  {expandedRow === session.id ? 'Hide' : 'Details'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
