'use client'

import { useEffect } from 'react'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import { UserManagementContent } from '@/components/admin/UserManagementContent'

export default function AdminUsers() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin before allowing access
    checkAdminAccess()
  }, [session, status, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const { role } = await response.json()
        
        // Only allow admins to access this page
        if (role !== 'admin') {
          router.push('/dashboard')
          return
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to check admin access:', error)
      router.push('/dashboard')
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayoutClient role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading user management...</p>
        </div>
      </DashboardLayoutClient>
    )
  }

  return (
    <DashboardLayoutClient role="admin">
      <UserManagementContent />
    </DashboardLayoutClient>
  )
}
