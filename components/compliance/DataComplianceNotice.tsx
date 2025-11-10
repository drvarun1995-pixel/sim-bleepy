import { Shield, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface DataComplianceNoticeProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function DataComplianceNotice({ 
  variant = 'default',
  className = '' 
}: DataComplianceNoticeProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-800 leading-relaxed">
            <strong>Data Compliance:</strong> All documents are reviewed by Admins, MedEd Team, and CTF. No patient identifiable data. Images are from the internet with no direct link to patients.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Data Compliance & Privacy Assurance
            </h3>
            <div className="text-sm text-green-800 leading-relaxed space-y-1">
              <p>
                <strong>Patient Data Protection:</strong> All documents and resources on this platform do <strong>not contain any patient identifiable data</strong>. All content is reviewed and verified by <strong>Administrators</strong>, <strong>MedEd Team</strong>, and <strong>Clinical Teaching Fellows (CTF)</strong> before publication.
              </p>
              <p>
                <strong>Image Compliance:</strong> Any images included in documents or resources are sourced from the internet and have <strong>no direct link to patients</strong>. All images are carefully reviewed to ensure compliance with data protection regulations.
              </p>
              <p className="text-xs text-green-700 mt-2">
                This review process ensures full compliance with data protection standards and maintains the highest levels of privacy and confidentiality.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

