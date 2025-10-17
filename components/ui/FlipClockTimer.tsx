'use client'

import { useState, useEffect } from 'react'

interface FlipClockTimerProps {
  startDate: string
  startTime: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface TimeUnit {
  value: number
  label: string
}

interface FlipDigitProps {
  digit: number
  size: 'sm' | 'md' | 'lg'
}

function FlipDigit({ digit, size }: FlipDigitProps) {
  const [currentDigit, setCurrentDigit] = useState(digit)
  const [isFlipping, setIsFlipping] = useState(false)
  const [nextDigit, setNextDigit] = useState(digit)

  useEffect(() => {
    if (digit !== currentDigit) {
      setNextDigit(digit)
      setIsFlipping(true)
      
      // Start the flip animation
      const timer = setTimeout(() => {
        setCurrentDigit(digit)
        setIsFlipping(false)
      }, 150) // Half of the flip duration

      return () => clearTimeout(timer)
    }
  }, [digit, currentDigit])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-6 h-8',
          digit: 'text-sm',
          label: 'text-xs'
        }
      case 'lg':
        return {
          container: 'w-10 h-14',
          digit: 'text-xl',
          label: 'text-xs'
        }
      default:
        return {
          container: 'w-8 h-12',
          digit: 'text-lg',
          label: 'text-xs'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className={`${sizeClasses.container} relative`}>
      <div className="relative w-full h-full bg-gradient-to-b from-purple-600 to-blue-600 rounded-md shadow-md overflow-hidden">
        {/* Current digit */}
        <div className={`absolute inset-0 flex items-center justify-center text-white font-bold ${sizeClasses.digit} transition-all duration-300 ease-in-out ${
          isFlipping ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          {currentDigit}
        </div>
        
        {/* Next digit (flipping in) */}
        {isFlipping && (
          <div className={`absolute inset-0 flex items-center justify-center text-white font-bold ${sizeClasses.digit} transition-all duration-300 ease-in-out translate-y-0 opacity-100`}>
            {nextDigit}
          </div>
        )}
        
        {/* Flip line effect */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-purple-800 opacity-40 transform -translate-y-1/2"></div>
        
        {/* Top highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-purple-400 to-transparent opacity-30"></div>
        
        {/* Bottom shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-purple-900 to-transparent opacity-40"></div>
      </div>
    </div>
  )
}

export function FlipClockTimer({ 
  startDate, 
  startTime, 
  className = '', 
  size = 'md'
}: FlipClockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  const [isEventStarted, setIsEventStarted] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const eventDateTime = new Date(`${startDate}T${startTime}`)
      
      const difference = eventDateTime.getTime() - now.getTime()
      
      if (difference <= 0) {
        setIsEventStarted(true)
        setTimeLeft(null)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        total: difference
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [startDate, startTime])

  if (isEventStarted) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-200 shadow-md">
          <div className="text-xl font-bold text-green-600 mb-1 animate-pulse">🚀 Event Started!</div>
          <div className="text-sm text-gray-700 font-medium">Join the session now!</div>
        </div>
      </div>
    )
  }

  if (!timeLeft) {
    return null
  }

  const formatNumber = (num: number): [number, number] => {
    const str = num.toString().padStart(2, '0')
    return [parseInt(str[0]), parseInt(str[1])]
  }

  const timeUnits: TimeUnit[] = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.minutes, label: 'MINUTES' },
    { value: timeLeft.seconds, label: 'SECONDS' }
  ]

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'gap-1'
      case 'lg':
        return 'gap-2'
      default:
        return 'gap-1.5'
    }
  }

  const getLabelSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-xs'
      default:
        return 'text-xs'
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-center ${getSizeClasses()} ${className}`}>
      {timeUnits.map((unit, index) => {
        const [tens, ones] = formatNumber(unit.value)
        
        return (
          <div key={unit.label} className="flex flex-col items-center">
            {/* Digit container */}
            <div className="flex items-center gap-0.5">
              {/* Tens digit */}
              <FlipDigit digit={tens} size={size} />
              
              {/* Ones digit */}
              <FlipDigit digit={ones} size={size} />
            </div>
            
            {/* Label */}
            <div className="text-center mt-1">
              <div className={`font-bold text-gray-700 uppercase tracking-wide ${getLabelSizeClasses()}`}>
                {unit.label}
              </div>
            </div>
            
            {/* Separator (except for last item) */}
            {index < timeUnits.length - 1 && (
              <div className="flex flex-col items-center justify-center mx-1 mt-2">
                <div className="w-1 h-1 bg-purple-400 rounded-full mb-0.5"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
