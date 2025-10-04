'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Stethoscope, Building2 } from 'lucide-react'

interface FoundationYearDetailsProps {
  foundationYear: string
  hospitalTrust: string
  onFoundationYearChange: (value: string) => void
  onHospitalTrustChange: (value: string) => void
}

const foundationYears = [
  { 
    value: 'FY1', 
    label: 'FY1 (Foundation Year 1)', 
    description: 'First year of foundation training'
  },
  { 
    value: 'FY2', 
    label: 'FY2 (Foundation Year 2)', 
    description: 'Second year of foundation training'
  },
]

export function FoundationYearDetails({
  foundationYear,
  hospitalTrust,
  onFoundationYearChange,
  onHospitalTrustChange
}: FoundationYearDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Foundation Year Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Foundation Year <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          {foundationYears.map((fy) => {
            const isSelected = foundationYear === fy.value
            
            return (
              <Card
                key={fy.value}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'border-2 border-purple-600 bg-purple-50' 
                    : 'border border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => onFoundationYearChange(fy.value)}
              >
                <div className="p-4 flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${
                      isSelected ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {fy.label}
                    </h3>
                    <p className={`text-xs mt-0.5 ${
                      isSelected ? 'text-purple-700' : 'text-gray-500'
                    }`}>
                      {fy.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Hospital/Trust (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="hospitalTrust" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Hospital/Trust <span className="text-gray-400 text-xs ml-1">(Optional)</span>
        </Label>
        <Input
          id="hospitalTrust"
          type="text"
          value={hospitalTrust}
          onChange={(e) => onHospitalTrustChange(e.target.value)}
          placeholder="e.g., Cambridge University Hospitals NHS Foundation Trust"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Where are you currently working?
        </p>
      </div>

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
              We'll show you foundation year-specific training, teaching sessions, and events relevant to your career stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
