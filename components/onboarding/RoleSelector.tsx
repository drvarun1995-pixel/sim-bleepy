'use client'

import { Card } from '@/components/ui/card'
import { GraduationCap, Stethoscope, Heart, Microscope, UserCog, Briefcase, Shield } from 'lucide-react'

interface RoleSelectorProps {
  selectedRole: string
  onRoleChange: (role: string) => void
}

const roles = [
  { 
    value: 'medical_student', 
    label: 'Medical Student', 
    icon: GraduationCap,
    description: 'Currently studying medicine'
  },
  { 
    value: 'foundation_doctor', 
    label: 'Foundation Year Doctor', 
    icon: Stethoscope,
    description: 'FY1 or FY2 doctor'
  },
  { 
    value: 'clinical_fellow', 
    label: 'Clinical Fellow', 
    icon: Heart,
    description: 'Clinical research or training'
  },
  { 
    value: 'specialty_doctor', 
    label: 'Specialty Doctor', 
    icon: Microscope,
    description: 'Specialist in training'
  },
  { 
    value: 'registrar', 
    label: 'Registrar', 
    icon: UserCog,
    description: 'Specialist registrar'
  },
  { 
    value: 'consultant', 
    label: 'Consultant', 
    icon: Briefcase,
    description: 'Consultant physician'
  },
  {
    value: 'meded_team',
    label: 'MedEd Team',
    icon: Shield,
    description: 'Medical education team member'
  },
]

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        I am a: <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.value
          
          return (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-2 border-purple-600 bg-purple-50' 
                  : 'border border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => onRoleChange(role.value)}
            >
              <div className="p-4 flex items-start space-x-3">
                <div className={`flex-shrink-0 ${
                  isSelected ? 'text-purple-600' : 'text-gray-400'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${
                      isSelected ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {role.label}
                    </h3>
                    {isSelected && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${
                    isSelected ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {role.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
