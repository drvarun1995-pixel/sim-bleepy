'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const toggleVisibility = () => {
      // Calculate scroll progress
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = window.scrollY
      const progress = (scrolled / scrollHeight) * 100

      setScrollProgress(progress)
      setIsVisible(scrolled > 300)
    }

    window.addEventListener('scroll', toggleVisibility)
    toggleVisibility() // Initial check

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 group"
      aria-label="Scroll to top"
    >
      {/* Circular progress background */}
      <svg
        className="w-12 h-12 md:w-14 md:h-14 -rotate-90 transition-all duration-300 group-hover:scale-110"
        viewBox="0 0 56 56"
      >
        {/* Background circle with gradient */}
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="#eaa540"
          stroke="none"
        />
        {/* Inner white circle for progress track */}
        <circle
          cx="28"
          cy="28"
          r="20"
          fill="white"
          stroke="none"
        />
        {/* Progress circle */}
        <circle
          cx="28"
          cy="28"
          r="20"
          fill="none"
          stroke="#eaa540"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`}
          strokeLinecap="round"
          className="transition-all duration-150"
        />
      </svg>
      
      {/* Arrow icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <ArrowUp 
          className="h-5 w-5 md:h-6 md:w-6 transition-all duration-300 group-hover:-translate-y-0.5" 
          style={{ color: '#eaa540' }}
        />
      </div>
      
      {/* Shadow */}
      <div className="absolute inset-0 rounded-full shadow-xl transition-shadow duration-300" style={{ boxShadow: '0 8px 24px rgba(234, 165, 64, 0.4)' }}></div>
    </button>
  )
}
