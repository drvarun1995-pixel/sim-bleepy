'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Settings, TestTube, Crown } from 'lucide-react'

export function ContentOpsPanel() {
  const stations = [
    { id: '1', name: 'Cardiac Emergency', status: 'active', version: '2.1', owner: 'Dr. Smith', lastUpdated: '2024-01-07' },
    { id: '2', name: 'Respiratory Distress', status: 'active', version: '1.8', owner: 'Dr. Johnson', lastUpdated: '2024-01-06' },
    { id: '3', name: 'Trauma Assessment', status: 'draft', version: '3.0', owner: 'Dr. Chen', lastUpdated: '2024-01-05' },
    { id: '4', name: 'Pediatric Fever', status: 'active', version: '1.5', owner: 'Dr. Williams', lastUpdated: '2024-01-04' },
    { id: '5', name: 'Psychiatric Crisis', status: 'maintenance', version: '2.0', owner: 'Dr. Brown', lastUpdated: '2024-01-03' }
  ]

  const abTests = [
    { id: '1', name: 'Cardiac Difficulty A/B', status: 'completed', winner: 'Variant B', improvement: '+12%' },
    { id: '2', name: 'Communication Prompts', status: 'running', winner: null, improvement: null },
    { id: '3', name: 'Feedback Timing', status: 'draft', winner: null, improvement: null }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>
      case 'draft': return <Badge variant="secondary">Draft</Badge>
      case 'maintenance': return <Badge variant="destructive">Maintenance</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Content Operations
        </CardTitle>
        <CardDescription>
          Station library and A/B testing management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Station Library */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Station Library</h4>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
          <div className="space-y-2">
            {stations.slice(0, 3).map((station) => (
              <div key={station.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{station.name}</div>
                  <div className="text-xs text-muted-foreground">
                    v{station.version} • {station.owner} • {station.lastUpdated}
                  </div>
                </div>
                {getStatusBadge(station.status)}
              </div>
            ))}
          </div>
        </div>

        {/* A/B Tests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">A/B Tests</h4>
            <Button size="sm" variant="outline">
              <TestTube className="w-4 h-4 mr-2" />
              New Test
            </Button>
          </div>
          <div className="space-y-2">
            {abTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{test.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {test.status === 'completed' && test.winner && (
                      <span className="flex items-center">
                        <Crown className="w-3 h-3 mr-1 text-yellow-600" />
                        Winner: {test.winner} ({test.improvement})
                      </span>
                    )}
                    {test.status === 'running' && 'In progress...'}
                    {test.status === 'draft' && 'Draft'}
                  </div>
                </div>
                <Badge variant={test.status === 'completed' ? 'default' : test.status === 'running' ? 'secondary' : 'outline'}>
                  {test.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{stations.length}</div>
              <div className="text-xs text-muted-foreground">Total Stations</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{stations.filter(s => s.status === 'active').length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{abTests.filter(t => t.status === 'running').length}</div>
              <div className="text-xs text-muted-foreground">Running Tests</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
