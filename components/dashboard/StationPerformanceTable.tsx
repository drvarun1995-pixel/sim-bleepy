'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StationPerformanceData {
  id: string
  name: string
  attempts: number
  completionRate: number
  medianScore: number
  difficultyDrift: number
}

interface StationPerformanceTableProps {
  data: StationPerformanceData[]
}

export function StationPerformanceTable({ data }: StationPerformanceTableProps) {
  const getDifficultyDriftIcon = (drift: number) => {
    if (drift > 1) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (drift < -1) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getDifficultyDriftColor = (drift: number) => {
    if (drift > 1) return 'text-green-600'
    if (drift < -1) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Station Performance</CardTitle>
        <CardDescription>
          Performance metrics for all stations over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Median Score</TableHead>
              <TableHead>Difficulty Drift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((station) => (
              <TableRow key={station.id}>
                <TableCell className="font-medium">{station.name}</TableCell>
                <TableCell>{station.attempts}</TableCell>
                <TableCell>
                  <Badge variant={station.completionRate >= 90 ? 'default' : station.completionRate >= 80 ? 'secondary' : 'destructive'}>
                    {station.completionRate}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={station.medianScore >= 80 ? 'default' : station.medianScore >= 70 ? 'secondary' : 'destructive'}>
                    {station.medianScore}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {getDifficultyDriftIcon(station.difficultyDrift)}
                    <span className={getDifficultyDriftColor(station.difficultyDrift)}>
                      {station.difficultyDrift > 0 ? '+' : ''}{station.difficultyDrift.toFixed(1)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}