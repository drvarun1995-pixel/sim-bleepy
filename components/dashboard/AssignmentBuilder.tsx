'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Plus, X, BookOpen, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils'

interface Cohort {
  id: string
  name: string
  org: string
  cohort_members: Array<{ count: number }>
}

interface AssignmentBuilderProps {
  cohorts: Cohort[]
}

// Mock stations data
const availableStations = [
  { id: '1', title: 'Cardiology Consultation', specialty: 'Cardiology', difficulty: 3 },
  { id: '2', title: 'Emergency Triage', specialty: 'Emergency Medicine', difficulty: 4 },
  { id: '3', title: 'Pediatric Assessment', specialty: 'Pediatrics', difficulty: 3 },
  { id: '4', title: 'Mental Health Interview', specialty: 'Psychiatry', difficulty: 4 },
  { id: '5', title: 'Orthopedic Examination', specialty: 'Orthopedics', difficulty: 2 },
  { id: '6', title: 'Dermatology Case', specialty: 'Dermatology', difficulty: 2 },
  { id: '7', title: 'Neurological Assessment', specialty: 'Neurology', difficulty: 5 },
  { id: '8', title: 'Obstetric Consultation', specialty: 'Obstetrics', difficulty: 4 },
]

export function AssignmentBuilder({ cohorts }: AssignmentBuilderProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedCohorts: [] as string[],
    selectedStations: [] as string[],
    openDate: undefined as Date | undefined,
    closeDate: undefined as Date | undefined,
    timeLimit: '',
    allowRetakes: false,
    showFeedback: true
  })

  const [isCreating, setIsCreating] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCohort = (cohortId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCohorts: prev.selectedCohorts.includes(cohortId)
        ? prev.selectedCohorts.filter(id => id !== cohortId)
        : [...prev.selectedCohorts, cohortId]
    }))
  }

  const toggleStation = (stationId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStations: prev.selectedStations.includes(stationId)
        ? prev.selectedStations.filter(id => id !== stationId)
        : [...prev.selectedStations, stationId]
    }))
  }

  const removeStation = (stationId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStations: prev.selectedStations.filter(id => id !== stationId)
    }))
  }

  const handleCreateAssignment = async () => {
    setIsCreating(true)
    try {
      // Here you would call your API to create the assignment
      console.log('Creating assignment:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        selectedCohorts: [],
        selectedStations: [],
        openDate: undefined,
        closeDate: undefined,
        timeLimit: '',
        allowRetakes: false,
        showFeedback: true
      })
      
      alert('Assignment created successfully!')
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Error creating assignment. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedStationsData = availableStations.filter(station => 
    formData.selectedStations.includes(station.id)
  )

  const totalStudents = cohorts
    .filter(cohort => formData.selectedCohorts.includes(cohort.id))
    .reduce((acc, cohort) => acc + (cohort.cohort_members[0]?.count || 0), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assignment Form */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              placeholder="e.g., Cardiology Assessment Week"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide instructions and learning objectives..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Cohort Selection */}
        <div>
          <Label className="text-base font-medium">Select Cohorts</Label>
          <div className="mt-2 space-y-2">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cohort-${cohort.id}`}
                  checked={formData.selectedCohorts.includes(cohort.id)}
                  onCheckedChange={() => toggleCohort(cohort.id)}
                />
                <Label htmlFor={`cohort-${cohort.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>{cohort.name}</span>
                    <Badge variant="secondary">
                      {cohort.cohort_members[0]?.count || 0} students
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Station Selection */}
        <div>
          <Label className="text-base font-medium">Select Stations</Label>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {availableStations.map((station) => (
              <div key={station.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`station-${station.id}`}
                  checked={formData.selectedStations.includes(station.id)}
                  onCheckedChange={() => toggleStation(station.id)}
                />
                <Label htmlFor={`station-${station.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{station.title}</span>
                      <span className="text-sm text-muted-foreground ml-2">({station.specialty})</span>
                    </div>
                    <Badge variant="outline">
                      Level {station.difficulty}
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Assignment Opens</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.openDate ? format(formData.openDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.openDate}
                  onSelect={(date) => handleInputChange('openDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Assignment Closes</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.closeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.closeDate ? format(formData.closeDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.closeDate}
                  onSelect={(date) => handleInputChange('closeDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
            <Input
              id="timeLimit"
              type="number"
              placeholder="e.g., 30"
              value={formData.timeLimit}
              onChange={(e) => handleInputChange('timeLimit', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowRetakes"
                checked={formData.allowRetakes}
                onCheckedChange={(checked) => handleInputChange('allowRetakes', checked)}
              />
              <Label htmlFor="allowRetakes">Allow multiple attempts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showFeedback"
                checked={formData.showFeedback}
                onCheckedChange={(checked) => handleInputChange('showFeedback', checked)}
              />
              <Label htmlFor="showFeedback">Show immediate feedback</Label>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCreateAssignment} 
          disabled={isCreating || !formData.title || formData.selectedCohorts.length === 0 || formData.selectedStations.length === 0}
          className="w-full"
        >
          {isCreating ? 'Creating...' : 'Create Assignment'}
        </Button>
      </div>

      {/* Assignment Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Preview</CardTitle>
            <CardDescription>
              Review your assignment before creating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.title ? (
              <>
                <div>
                  <h3 className="font-semibold">{formData.title}</h3>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mt-1">{formData.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Students:</span>
                    <span className="ml-2 font-medium">{totalStudents}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stations:</span>
                    <span className="ml-2 font-medium">{formData.selectedStations.length}</span>
                  </div>
                  {formData.timeLimit && (
                    <div>
                      <span className="text-muted-foreground">Time Limit:</span>
                      <span className="ml-2 font-medium">{formData.timeLimit} min</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Retakes:</span>
                    <span className="ml-2 font-medium">{formData.allowRetakes ? 'Allowed' : 'Single attempt'}</span>
                  </div>
                </div>

                {formData.openDate && formData.closeDate && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="ml-2 font-medium">
                      {format(formData.openDate, "MMM dd")} - {format(formData.closeDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                )}

                {selectedStationsData.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Selected Stations:</h4>
                    <div className="space-y-1">
                      {selectedStationsData.map((station) => (
                        <div key={station.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <span className="font-medium">{station.title}</span>
                            <span className="text-sm text-muted-foreground ml-2">({station.specialty})</span>
                          </div>
                          <Badge variant="outline">Level {station.difficulty}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Fill out the form to see assignment preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
