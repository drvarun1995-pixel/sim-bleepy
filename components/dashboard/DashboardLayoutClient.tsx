'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { Menu } from 'lucide-react'

interface DashboardLayoutClientProps {
  role: 'student' | 'educator' | 'admin'
  userName?: string
  children: React.ReactNode
}

export function DashboardLayoutClient({ role, userName, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar 
        role={role} 
        userName={userName}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
          <div className="px-4 py-4">
            <div className="flex items-start justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 border border-white/20 flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-white" />
              </button>
              
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold text-white mb-0.5">
                  Dashboard
                </h1>
                <p className="text-purple-100 text-xs">
                  Welcome, {userName || 'User'}
                </p>
              </div>
              
              <div className="w-10 flex-shrink-0"></div> {/* Spacer for alignment */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
