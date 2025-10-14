'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCheck, UserX, Mail, Trash2, Save, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf' | 'suspended' | 'deleted'
  createdAt: string
  lastLogin?: string
  totalAttempts: number
  averageScore: number
}

interface UserEditModalProps {
  user: User
  onUserUpdate: () => void
  trigger: React.ReactNode
}

export function UserEditModal({ user, onUserUpdate, trigger }: UserEditModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: selectedRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        onUserUpdate()
        setTimeout(() => {
          setOpen(false)
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user role' })
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (action: string, data?: any) => {
    setLoading(true)
    setMessage(null)

    try {
      if (action === 'send_email') {
        // Handle email sending through MailerLite
        const response = await fetch('/api/admin/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.email,
            subject: data?.subject || 'Message from Admin',
            content: data?.content || 'This is a message from the admin panel.',
            userName: user.name,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          setMessage({ type: 'success', text: result.message })
        } else {
          setMessage({ type: 'error', text: result.error })
        }
      } else {
        // Handle other actions (suspend, activate, delete)
        const response = await fetch(`/api/admin/users/${user.id}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            data,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          setMessage({ type: 'success', text: result.message })
          onUserUpdate()
          if (action === 'delete') {
            setTimeout(() => {
              setOpen(false)
            }, 1500)
          }
        } else {
          setMessage({ type: 'error', text: result.error })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${action} user` })
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'educator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'meded_team':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'ctf':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'deleted':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                  <option value="meded_team">MedEd Team</option>
                  <option value="ctf">CTF</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Status
                </label>
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Stats
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Total Attempts: {user.totalAttempts}</p>
                  <p>Average Score: {user.averageScore.toFixed(1)}%</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Info
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Joined: {formatDate(user.createdAt)}</p>
                  {user.lastLogin && (
                    <p>Last Login: {formatDate(user.lastLogin)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRoleUpdate}
              disabled={loading || selectedRole === user.role}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const subject = prompt('Email Subject:', 'Message from Admin')
                const content = prompt('Email Content:', 'This is a message from the admin panel.')
                if (subject && content) {
                  handleUserAction('send_email', { subject, content })
                }
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>

            {user.role === 'suspended' ? (
              <Button
                variant="outline"
                onClick={() => handleUserAction('activate')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Activate
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleUserAction('suspend')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                Suspend
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                  handleUserAction('delete')
                }
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
