'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataRetentionManager } from '@/components/admin/DataRetentionManager'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
import { Shield, Database, Clock } from 'lucide-react'

export default function DataRetentionPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Data Retention Management</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage data retention policies and execute GDPR-compliant data cleanup
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Data Policies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automated retention rules</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Automated Cleanup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled data deletion</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">GDPR Compliant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Legal compliance maintained</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Retention Manager */}
        <DataRetentionManager />

        {/* Audit Log Viewer */}
        <AuditLogViewer />

        {/* Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                GDPR Data Retention Guidelines
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  • <strong>User Accounts:</strong> Retained for 2 years after last activity to comply with educational record requirements
                </p>
                <p>
                  • <strong>Training Data:</strong> Kept for 1 year for progress tracking and analytics
                </p>
                <p>
                  • <strong>Audit Logs:</strong> Maintained for 7 years as required by data protection regulations
                </p>
                <p>
                  • <strong>Security Tokens:</strong> Automatically deleted after short periods for security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
