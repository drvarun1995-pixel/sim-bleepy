'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Building2, Microscope } from 'lucide-react'

interface OtherRoleDetailsProps {
  roleType: string
  hospitalTrust: string
  specialty: string
  onHospitalTrustChange: (value: string) => void
  onSpecialtyChange: (value: string) => void
}

export function OtherRoleDetails({
  roleType,
  hospitalTrust,
  specialty,
  onHospitalTrustChange,
  onSpecialtyChange
}: OtherRoleDetailsProps) {
  const showSpecialty = ['registrar', 'consultant'].includes(roleType)
  const roleName = roleType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="space-y-6">
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

      {/* Specialty (Optional - for registrars and consultants) */}
      {showSpecialty && (
        <div className="space-y-2">
          <Label htmlFor="specialty" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Specialty <span className="text-gray-400 text-xs ml-1">(Optional)</span>
          </Label>
          <Input
            id="specialty"
            type="text"
            value={specialty}
            onChange={(e) => onSpecialtyChange(e.target.value)}
            placeholder="e.g., Cardiology, Emergency Medicine, Surgery"
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            What is your medical specialty?
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
            <h4 className="text-sm font-medium text-blue-900">Relevant content for {roleName}s</h4>
            <p className="text-xs text-blue-700 mt-1">
              We'll show you CPD events, conferences, and training opportunities relevant to your role and specialty.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
