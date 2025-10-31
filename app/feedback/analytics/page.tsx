'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  Filter,
  Download,
  Eye,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

// Chart components (integrate with recharts or similar library)
const BarChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center">
      <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xs text-gray-500">No data available</div>
    </div>
  </div>
)

const PieChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center">
      <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xs text-gray-500">No data available</div>
    </div>
  </div>
)

const LineChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center">
      <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xs text-gray-500">No data available</div>
    </div>
  </div>
)

interface FeedbackAnalytics {
  totalForms: number
  totalResponses: number
  responseRate: number
  averageRating: number
  completionRate: number
  topRatedEvents: Array<{
    id: string
    title: string
    rating: number
    responses: number
  }>
  responseTrends: Array<{
    date: string
    responses: number
  }>
  ratingDistribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
  feedbackCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  anonymousVsUser: {
    anonymous: number
    user: number
  }
}

interface Event {
  id: string
  title: string
  date: string
  status: string
}

export default function FeedbackAnalyticsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    // Initialize selected event from URL (?event_id=...)
    const urlEventId = searchParams?.get('event_id')
    if (urlEventId && urlEventId !== selectedEvent) {
      setSelectedEvent(urlEventId)
    }
    loadAnalytics()
    loadEvents()
  }, [session, selectedEvent, selectedPeriod, searchParams])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedEvent && { event_id: selectedEvent })
      })
      
      const response = await fetch(`/api/feedback/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error('Failed to load analytics:', response.statusText)
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600 mb-4">No feedback data available yet</p>
              <Button onClick={() => router.push('/feedback')}>
                Create Feedback Forms
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/feedback')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feedback
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into feedback data</p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              <select 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/feedback')}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4" />
                Manage Forms
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalForms}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.responseRate}%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.averageRating}/5</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Response Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Response Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={analytics.responseTrends} title="Responses Over Time" />
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={analytics.ratingDistribution} title="Rating Distribution" />
            </CardContent>
          </Card>

          {/* Feedback Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Feedback Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={analytics.feedbackCategories} title="Feedback Categories" />
            </CardContent>
          </Card>

          {/* Anonymous vs User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anonymous vs User Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Anonymous</span>
                  </div>
                  <span className="text-sm font-bold">{analytics.anonymousVsUser.anonymous}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">User-based</span>
                  </div>
                  <span className="text-sm font-bold">{analytics.anonymousVsUser.user}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Rated Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Rated Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topRatedEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.responses} responses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(event.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{event.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
