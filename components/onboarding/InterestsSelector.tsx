'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Heart, Microscope, Brain, Baby, Zap, Stethoscope, Eye, Bone } from 'lucide-react'

interface InterestsSelectorProps {
  interests: string[]
  onInterestsChange: (interests: string[]) => void
}

const availableInterests = [
  { value: 'clinical_skills', label: 'Clinical Skills', icon: Stethoscope },
  { value: 'research', label: 'Research & Academia', icon: Microscope },
  { value: 'surgery', label: 'Surgery', icon: Heart },
  { value: 'medicine', label: 'Medicine', icon: Brain },
  { value: 'pediatrics', label: 'Pediatrics', icon: Baby },
  { value: 'emergency', label: 'Emergency Medicine', icon: Zap },
  { value: 'psychiatry', label: 'Psychiatry', icon: Brain },
  { value: 'radiology', label: 'Radiology', icon: Eye },
  { value: 'orthopedics', label: 'Orthopedics', icon: Bone },
  { value: 'cardiology', label: 'Cardiology', icon: Heart },
  { value: 'oncology', label: 'Oncology', icon: Microscope },
  { value: 'neurology', label: 'Neurology', icon: Brain },
]

export function InterestsSelector({ interests, onInterestsChange }: InterestsSelectorProps) {
  const handleToggle = (value: string) => {
    if (interests.includes(value)) {
      onInterestsChange(interests.filter(i => i !== value))
    } else {
      onInterestsChange([...interests, value])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          Select your areas of interest
        </Label>
        <p className="text-sm text-gray-500 mt-1">
          This helps us personalize your event recommendations. You can change this later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableInterests.map((interest) => {
          const Icon = interest.icon
          const isSelected = interests.includes(interest.value)

          return (
            <Card
              key={interest.value}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-2 border-purple-600 bg-purple-50' 
                  : 'border border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleToggle(interest.value)}
            >
              <div className="p-4 flex items-center space-x-3">
                <Checkbox
                  id={interest.value}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(interest.value)}
                  className="flex-shrink-0"
                />
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isSelected ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <label
                  htmlFor={interest.value}
                  className={`text-sm font-medium cursor-pointer flex-1 ${
                    isSelected ? 'text-purple-900' : 'text-gray-700'
                  }`}
                >
                  {interest.label}
                </label>
              </div>
            </Card>
          )
        })}
      </div>

      {interests.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900">
                {interests.length} {interests.length === 1 ? 'interest' : 'interests'} selected
              </h4>
              <p className="text-xs text-green-700 mt-1">
                Great! We'll prioritize events matching your interests in your personalized dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
