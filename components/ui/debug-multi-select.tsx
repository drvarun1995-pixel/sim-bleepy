"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface DebugMultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function DebugMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className
}: DebugMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedRef = React.useRef(selected)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // Update ref when selected changes
  React.useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = (value: string) => {
    console.log('handleSelect called with:', value, 'current selected:', selectedRef.current)
    
    const newSelected = selectedRef.current.includes(value)
      ? selectedRef.current.filter(item => item !== value)
      : [...selectedRef.current, value]
    
    console.log('newSelected:', newSelected)
    onChange(newSelected)
  }

  // Debug logging
  React.useEffect(() => {
    console.log('DebugMultiSelect - options:', options)
    console.log('DebugMultiSelect - selected:', selected)
    console.log('DebugMultiSelect - open:', open)
  }, [options, selected, open])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => {
          console.log('Button clicked, opening dropdown')
          setOpen(!open)
        }}
        className={cn("w-full justify-between", className)}
      >
        {selected.length === 0 ? placeholder : `${selected.length} selected`}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-white p-1 shadow-md">
          <div className="text-xs text-gray-500 p-2 border-b">
            Debug: {options.length} options, {selected.length} selected
          </div>
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              No items found.
            </div>
          ) : (
            <div className="space-y-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Option clicked:', option.value)
                    handleSelect(option.value)
                  }}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
