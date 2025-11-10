import { AlertCircle, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AttendanceTrackingNoticeProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function AttendanceTrackingNotice({ 
  variant = 'default',
  className = '' 
}: AttendanceTrackingNoticeProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Attendance Tracking:</strong> Your attendance is monitored and tracked by the MedEd Team and Administrators.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Attendance Tracking Notice
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Your attendance at events is automatically tracked and monitored by the <strong>MedEd Team</strong> and <strong>Administrators</strong>. 
              This information is used for educational records, certification, and compliance purposes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

