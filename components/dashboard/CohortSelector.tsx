'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/utils'

interface Cohort {
  id: string
  name: string
  org: string
  cohort_members: Array<{ count: number }>
}

interface CohortSelectorProps {
  cohorts: Cohort[]
}

export function CohortSelector({ cohorts }: CohortSelectorProps) {
  const [selectedCohort, setSelectedCohort] = useState<string>('all')
  const [inviteLink, setInviteLink] = useState<string>('')

  const selectedCohortData = cohorts.find(c => c.id === selectedCohort)
  const totalStudents = cohorts.reduce((acc, cohort) => 
    acc + (cohort.cohort_members[0]?.count || 0), 0
  )

  const generateInviteLink = (cohortId: string) => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/invite/cohort/${cohortId}`
    setInviteLink(link)
    navigator.clipboard.writeText(link)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cohort Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Select Cohort
          </CardTitle>
          <CardDescription>
            Choose a cohort to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger>
              <SelectValue placeholder="Select a cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCohortData && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-medium">
                  {selectedCohortData.cohort_members[0]?.count || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{selectedCohortData.org}</span>
              </div>
            </div>
          )}

          {selectedCohort === 'all' && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Students:</span>
                <span className="font-medium">{totalStudents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cohorts:</span>
                <span className="font-medium">{cohorts.length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Students</CardTitle>
          <CardDescription>
            Generate invite links for your cohorts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedCohort === 'all' ? (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a specific cohort to generate invite link</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => generateInviteLink(selectedCohort)}
                className="w-full"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                Generate Invite Link
              </Button>
              
              {inviteLink && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Invite link copied to clipboard:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded truncate">
                      {inviteLink}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with students to join the cohort
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohort Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Quick stats for your cohorts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cohorts.slice(0, 3).map((cohort) => (
              <div key={cohort.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{cohort.name}</p>
                  <p className="text-xs text-muted-foreground">{cohort.org}</p>
                </div>
                <Badge variant="secondary">
                  {cohort.cohort_members[0]?.count || 0} students
                </Badge>
              </div>
            ))}
            
            {cohorts.length > 3 && (
              <div className="text-center">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/dashboard/educator/cohorts">
                    View all {cohorts.length} cohorts
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
