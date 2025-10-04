'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function ProgressIndicator({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              index < currentStep 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : index === currentStep 
                ? 'bg-purple-600 border-purple-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Connecting Line */}
            {index < totalSteps - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentStep ? 'bg-purple-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {stepLabels.map((label, index) => (
          <div 
            key={index} 
            className={`text-xs text-center transition-colors ${
              index === currentStep 
                ? 'text-purple-600 font-semibold' 
                : index < currentStep
                ? 'text-purple-600'
                : 'text-gray-400'
            }`}
            style={{ width: `${100 / totalSteps}%` }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
