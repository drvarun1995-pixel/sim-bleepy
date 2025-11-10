"use client"

import { useState, useEffect } from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HelpTooltipProps {
  content: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpTooltip({ content, side = "top" }: HelpTooltipProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if device is mobile/touch device
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isTouchDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // For mobile: use controlled state with click
  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(!open)
              }}
              className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full transition-colors touch-manipulation"
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side={side} 
            className="max-w-xs z-50"
            onPointerDownOutside={() => setOpen(false)}
          >
            <p className="text-sm">{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // For desktop: use hover (default behavior)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

