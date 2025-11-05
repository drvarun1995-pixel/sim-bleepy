import { RefreshCw } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ 
  message = 'Loading...', 
  fullScreen = true 
}: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center z-50'
    : 'w-full min-h-[400px] bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
