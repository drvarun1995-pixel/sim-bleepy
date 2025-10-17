'use client'

import { useState, useEffect } from 'react'
import { Badge } from './badge'

interface CountdownTimerProps {
  startDate: string
  startTime: string
  className?: string
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CountdownTimer({ 
  startDate, 
  startTime, 
  className = '', 
  showBadge = true,
  size = 'md'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  const [isEventStarted, setIsEventStarted] = useState(false)
  const [isEventEnded, setIsEventEnded] = useState(false)

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
    return showBadge ? (
      <Badge variant="secondary" className={`${className} bg-green-100 text-green-800 border-green-200`}>
        Started
      </Badge>
    ) : (
      <span className={`${className} text-green-600 font-medium`}>
        Started
      </span>
    )
  }

  if (!timeLeft) {
    return null
  }

  const formatTime = () => {
    const { days, hours, minutes } = timeLeft
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${timeLeft.seconds}s`
    }
  }

  const getVariant = () => {
    const { total } = timeLeft
    const hoursLeft = total / (1000 * 60 * 60)
    
    if (hoursLeft < 1) {
      return 'destructive' // Red - less than 1 hour
    } else if (hoursLeft < 24) {
      return 'secondary' // Orange - less than 24 hours
    } else {
      return 'outline' // Default - more than 24 hours
    }
  }

  const getBadgeColor = () => {
    const { total } = timeLeft
    const hoursLeft = total / (1000 * 60 * 60)
    
    if (hoursLeft < 1) {
      return 'bg-red-100 text-red-800 border-red-200' // Red - less than 1 hour
    } else if (hoursLeft < 24) {
      return 'bg-orange-100 text-orange-800 border-orange-200' // Orange - less than 24 hours
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-200' // Blue - more than 24 hours
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-base px-4 py-2'
      default:
        return 'text-sm px-3 py-1.5'
    }
  }

  if (showBadge) {
    return (
      <Badge 
        variant={getVariant()}
        className={`${getBadgeColor()} ${getSizeClasses()} ${className}`}
      >
        {formatTime()}
      </Badge>
    )
  }

  return (
    <span className={`${className} font-medium text-gray-600`}>
      {formatTime()}
    </span>
  )
}
