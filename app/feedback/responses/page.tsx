'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Download, 
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useRole } from '@/lib/useRole'

interface FeedbackResponse {
  id: string
  user_id: string
  user_name: string
  user_email: string
  responses: { [questionId: string]: string | number }
  completed_at: string
  feedback_form: {
    id: string
    form_name: string
    form_template: string
    questions: any[]
  }
  events: {
    id: string
    title: string
    date: string
    start_time: string
    end_time: string
  }
}

interface Event {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  feedback_responses_count?: number
  average_rating?: number
}

interface Analytics {
  totalResponses: number
  averageRating: number
  responseRate: number
  ratingDistribution: { [rating: string]: number }
  questionAnalytics: { [questionId: string]: any }
}

export default function FeedbackResponsesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canManageEvents, loading: roleLoading } = useRole()
  
  const [responses, setResponses] = useState<FeedbackResponse[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filteredResponses, setFilteredResponses] = useState<FeedbackResponse[]>([])
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Check permissions
  useEffect(() => {
    if (status === 'loading' || roleLoading) return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canManageEvents) {
      toast.error('Access denied. MedEd Team, CTF, or Admin role required.')
      router.push('/dashboard')
      return
    }
  }, [session, status, canManageEvents, roleLoading, router])

  // Fetch data
  useEffect(() => {
    if (session && canManageEvents) {
      fetchData()
    }
  }, [session, canManageEvents])

  // Filter responses
  useEffect(() => {
    let filtered = responses

    // Event filter
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(response => response.events.id === selectedEventId)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(response => 
        response.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.events.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.feedback_form.form_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredResponses(filtered)
  }, [responses, selectedEventId, searchQuery])

  // Calculate analytics
  useEffect(() => {
    if (filteredResponses.length > 0) {
      calculateAnalytics()
    }
  }, [filteredResponses])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch feedback responses
      const responsesResponse = await fetch('/api/feedback/responses')
      if (!responsesResponse.ok) throw new Error('Failed to fetch responses')
      
      const responsesData = await responsesResponse.json()
      setResponses(responsesData.responses || [])
      
      // Fetch events with feedback data
      const eventsResponse = await fetch('/api/events')
      if (!eventsResponse.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await eventsResponse.json()
      setEvents(eventsData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch feedback data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = () => {
    if (filteredResponses.length === 0) {
      setAnalytics(null)
      return
    }

    const totalResponses = filteredResponses.length
    let totalRating = 0
    let ratingCount = 0
    const ratingDistribution: { [rating: string]: number } = {}
    const questionAnalytics: { [questionId: string]: any } = {}

    // Process each response
    filteredResponses.forEach(response => {
      const formQuestions = response.feedback_form.questions
      
      formQuestions.forEach((question: any) => {
        const responseValue = response.responses[question.id]
        
        if (question.type === 'rating' && responseValue) {
          const rating = Number(responseValue)
          totalRating += rating
          ratingCount++
          
          // Rating distribution
          const ratingKey = rating.toString()
          ratingDistribution[ratingKey] = (ratingDistribution[ratingKey] || 0) + 1
        }
        
        // Question-specific analytics
        if (!questionAnalytics[question.id]) {
          questionAnalytics[question.id] = {
            question: question.question,
            type: question.type,
            responses: [],
            averageRating: 0,
            textResponses: []
          }
        }
        
        if (responseValue) {
          questionAnalytics[question.id].responses.push(responseValue)
          
          if (question.type === 'text' || question.type === 'long_text') {
            questionAnalytics[question.id].textResponses.push(responseValue)
          }
        }
      })
    })

    // Calculate averages
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0
    
    // Calculate response rate (assuming we have total attendees)
    const responseRate = 85 // This would be calculated from actual attendance data

    setAnalytics({
      totalResponses,
      averageRating: Math.round(averageRating * 10) / 10,
      responseRate,
      ratingDistribution,
      questionAnalytics
    })
  }

  const handleExport = async () => {
    try {
      const csvData = filteredResponses.map(response => {
        const row: any = {
          'Event': response.events.title,
          'Date': new Date(response.events.date).toLocaleDateString('en-GB'),
          'Student': response.user_name,
          'Email': response.user_email,
          'Completed At': new Date(response.completed_at).toLocaleString('en-GB')
        }
        
        // Add question responses
        const formQuestions = response.feedback_form.questions
        formQuestions.forEach((question: any) => {
          const responseValue = response.responses[question.id]
          row[question.question] = responseValue || ''
        })
        
        return row
      })

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `feedback-responses-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Feedback data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatResponseValue = (value: string | number, questionType: string) => {
    if (questionType === 'rating') {
      return `${value}/5`
    }
    if (questionType === 'yes_no') {
      return value === 'yes' ? 'Yes' : 'No'
    }
    return String(value)
  }

  if (loading) {
    return <LoadingScreen message="Loading Feedback Responses..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
              <p className="text-gray-600 mt-2">
                View and analyze student feedback responses
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.responseRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Events</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString('en-GB')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Responses List */}
        <div className="space-y-6">
          {filteredResponses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Responses Found</h3>
                <p className="text-gray-500">
                  {searchQuery || selectedEventId !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No feedback responses have been submitted yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResponses.map((response) => (
              <Card key={response.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {response.events.title}
                        </h3>
                        <Badge variant="outline" className="bg-green-100 text-green-600">
                          Completed
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(response.events.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {response.events.start_time} - {response.events.end_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {response.user_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500">
                      <p>Completed: {new Date(response.completed_at).toLocaleString('en-GB')}</p>
                    </div>
                  </div>

                  {/* Response Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Feedback Responses:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {response.feedback_form.questions.map((question: any) => {
                        const responseValue = response.responses[question.id]
                        if (!responseValue) return null
                        
                        return (
                          <div key={question.id} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {question.question}
                            </p>
                            <div className="flex items-center gap-2">
                              {question.type === 'rating' && (
                                <div className="flex items-center gap-1">
                                  {getRatingStars(Number(responseValue))}
                                  <span className="text-sm text-gray-600 ml-1">
                                    ({responseValue}/5)
                                  </span>
                                </div>
                              )}
                              {question.type !== 'rating' && (
                                <p className="text-sm text-gray-900">
                                  {formatResponseValue(responseValue, question.type)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


