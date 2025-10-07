'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap } from 'lucide-react'

interface StudentDetailsProps {
  university: string
  studyYear: string
  onUniversityChange: (value: string) => void
  onStudyYearChange: (value: string) => void
}

export function StudentDetails({
  university,
  studyYear,
  onUniversityChange,
  onStudyYearChange
}: StudentDetailsProps) {
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // Update available years when university changes
  useEffect(() => {
    if (university === 'ARU') {
      setAvailableYears(['1', '2', '3', '4', '5'])
    } else if (university === 'UCL') {
      setAvailableYears(['1', '2', '3', '4', '5', '6'])
    } else {
      setAvailableYears([])
    }

    // Reset year if it's not available in the new university
    if (studyYear && university) {
      const years = university === 'ARU' ? ['1', '2', '3', '4', '5'] : ['1', '2', '3', '4', '5', '6']
      if (!years.includes(studyYear)) {
        onStudyYearChange('')
      }
    }
  }, [university, studyYear, onStudyYearChange])

  return (
    <div className="space-y-6">
      {/* University Selection */}
      <div className="space-y-2">
        <Label htmlFor="university" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          University <span className="text-red-500">*</span>
        </Label>
        <Select value={university} onValueChange={onUniversityChange}>
          <SelectTrigger id="university" className="w-full">
            <SelectValue placeholder="Select your university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ARU">Anglia Ruskin University (ARU)</SelectItem>
            <SelectItem value="UCL">University College London (UCL)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Select the university where you're currently studying
        </p>
      </div>

      {/* Year Selection - Only show after university is selected */}
      {university && (
        <div className="space-y-2">
          <Label htmlFor="studyYear">
            Year of Study <span className="text-gray-400 text-xs ml-1">(Optional)</span>
          </Label>
          <Select value={studyYear} onValueChange={onStudyYearChange}>
            <SelectTrigger id="studyYear" className="w-full">
              <SelectValue placeholder="Select your year (optional)" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  Year {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {university === 'ARU' && 'Leave blank to see all ARU events, or select a year for more targeted content'}
            {university === 'UCL' && 'Leave blank to see all UCL events, or select a year for more targeted content'}
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">Personalized content</h4>
            <p className="text-xs text-blue-700 mt-1">
              If you select a specific year, you'll see events tailored to your year level. If you skip the year, you'll see all events for your university.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
