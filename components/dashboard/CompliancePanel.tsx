'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Trash2, Clock, AlertTriangle } from 'lucide-react'

export function CompliancePanel() {
  const upcomingRetentions = [
    { id: '1', sessionId: 'sess_001', keptUntil: '2024-01-15', daysLeft: 8 },
    { id: '2', sessionId: 'sess_002', keptUntil: '2024-01-16', daysLeft: 9 },
    { id: '3', sessionId: 'sess_003', keptUntil: '2024-01-17', daysLeft: 10 },
    { id: '4', sessionId: 'sess_004', keptUntil: '2024-01-18', daysLeft: 11 },
    { id: '5', sessionId: 'sess_005', keptUntil: '2024-01-19', daysLeft: 12 }
  ]

  const getDaysLeftBadge = (days: number) => {
    if (days <= 7) return <Badge variant="destructive">{days} days</Badge>
    if (days <= 14) return <Badge variant="secondary">{days} days</Badge>
    return <Badge variant="outline">{days} days</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Compliance & Data Management
        </CardTitle>
        <CardDescription>
          Transcript retention and data privacy controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Retention Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Retention Policy:</strong> Transcripts are automatically purged after 30 days unless extended for educational purposes.
          </AlertDescription>
        </Alert>

        {/* Upcoming Retentions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Upcoming Retentions</h4>
            <Button size="sm" variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {upcomingRetentions.map((retention) => (
              <div key={retention.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{retention.sessionId}</div>
                  <div className="text-xs text-muted-foreground">
                    Expires: {retention.keptUntil}
                  </div>
                </div>
                {getDaysLeftBadge(retention.daysLeft)}
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Operations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Bulk Operations</h4>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="w-full justify-start">
              <Trash2 className="w-4 h-4 mr-2" />
              Purge transcripts older than 30 days
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Export compliance report
            </Button>
          </div>
        </div>

        {/* Compliance Stats */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Compliance Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-green-600">1,247</div>
              <div className="text-xs text-muted-foreground">Active Transcripts</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-blue-600">23</div>
              <div className="text-xs text-muted-foreground">Expiring Soon</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-purple-600">5,892</div>
              <div className="text-xs text-muted-foreground">Total Purged</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-lg font-bold text-orange-600">99.8%</div>
              <div className="text-xs text-muted-foreground">Compliance Rate</div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Privacy Settings</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-purge enabled</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retention period</span>
              <span className="font-medium">30 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Anonymization</span>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}