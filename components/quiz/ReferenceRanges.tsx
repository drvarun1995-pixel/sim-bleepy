'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { REFERENCE_RANGES } from '@/lib/quiz/reference-ranges'
import { motion, AnimatePresence } from 'framer-motion'

interface ReferenceRangesProps {
  className?: string
}

export function ReferenceRanges({ className = '' }: ReferenceRangesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Button to toggle reference ranges */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
      >
        <span>Reference ranges</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Dropdown/Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] max-h-[80vh] bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden"
            >
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reference ranges</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] px-4 py-3">
              <div className="space-y-3">
                {REFERENCE_RANGES.map((category) => {
                  const isExpanded = expandedCategories.has(category.category)
                  
                  return (
                    <div key={category.category} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.category)}
                        className="w-full flex items-center justify-between text-left py-2 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
                      >
                        <span className="font-semibold text-gray-900">{category.category}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {/* Category Ranges */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-2 pl-2">
                              {category.ranges.map((range, index) => (
                                <div key={index} className="text-sm bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors">
                                  <div className="font-semibold text-blue-700 mb-2 px-2 py-1 bg-blue-50 rounded border-l-4 border-blue-500">
                                    {range.name}
                                  </div>
                                  <div className="text-gray-700 whitespace-pre-line font-mono text-xs ml-2">
                                    {range.range}
                                  </div>
                                  {range.notes && (
                                    <div className="text-xs text-gray-500 italic mt-2 ml-2 border-l-2 border-gray-300 pl-2">
                                      {range.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* Footer Note */}
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 italic">
                Reference ranges vary according to individual labs. All values are for adults unless otherwise stated.
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

