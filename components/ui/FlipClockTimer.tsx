'use client'

import React, { useState, useEffect } from 'react'

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

  useEffect(() => {
    if (digit !== currentDigit) {
      setIsFlipping(true)
      
      // Simple flip animation
      const timer = setTimeout(() => {
        setCurrentDigit(digit)
        setIsFlipping(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [digit, currentDigit])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-5 h-7 sm:w-6 sm:h-8 md:w-7 md:h-10',
          digit: 'text-xs sm:text-sm',
          label: 'text-xs'
        }
      case 'lg':
        return {
          container: 'w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16',
          digit: 'text-lg sm:text-xl md:text-2xl',
          label: 'text-xs sm:text-sm'
        }
      default:
        return {
          container: 'w-6 h-9 sm:w-8 sm:h-11 md:w-9 md:h-13',
          digit: 'text-sm sm:text-base md:text-lg',
          label: 'text-xs'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className={`${sizeClasses.container} relative`}>
      <div className={`relative w-full h-full bg-gradient-to-b from-purple-600 to-blue-600 rounded-md shadow-lg flex items-center justify-center transition-transform duration-300 ${
        isFlipping ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
      }`}>
        <div className={`text-white font-bold ${sizeClasses.digit}`}>
          {currentDigit}
        </div>
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
        return 'gap-1 sm:gap-2 md:gap-3'
      case 'lg':
        return 'gap-2 sm:gap-4 md:gap-6'
      default:
        return 'gap-2 sm:gap-3 md:gap-4'
    }
  }

  const getLabelSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-xs sm:text-sm'
      default:
        return 'text-xs'
    }
  }

  const getSeparatorSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm sm:text-lg md:text-xl mx-1 sm:mx-2 md:mx-3'
      case 'lg':
        return 'text-lg sm:text-xl md:text-2xl mx-2 sm:mx-3 md:mx-4'
      default:
        return 'text-base sm:text-xl md:text-2xl mx-1 sm:mx-2 md:mx-3'
    }
  }

  return (
    <div className={`flex items-center justify-center flex-wrap sm:flex-nowrap ${getSizeClasses()} ${className}`}>
      {timeUnits.map((unit, index) => {
        const [tens, ones] = formatNumber(unit.value)
        
        return (
          <React.Fragment key={unit.label}>
            <div className="flex flex-col items-center mb-2 sm:mb-0">
              {/* Digit container */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Tens digit */}
                <FlipDigit digit={tens} size={size} />
                
                {/* Ones digit */}
                <FlipDigit digit={ones} size={size} />
              </div>
              
              {/* Label */}
              <div className="text-center mt-1 sm:mt-2">
                <div className={`font-bold text-gray-700 uppercase tracking-wide ${getLabelSizeClasses()}`}>
                  {unit.label}
                </div>
              </div>
            </div>
            
            {/* Colon separator (except for last item) */}
            {index < timeUnits.length - 1 && (
              <div className={`flex items-center justify-center text-purple-600 font-bold ${getSeparatorSizeClasses()}`}>
                :
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
