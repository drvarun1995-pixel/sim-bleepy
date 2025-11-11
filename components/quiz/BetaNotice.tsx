'use client'

import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function BetaNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            Beta Feature
          </h3>
          <p className="text-sm text-yellow-700">
            This feature is currently in beta mode. We're continuously improving it based on your feedback. 
            If you encounter any issues or have suggestions, please let us know.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

