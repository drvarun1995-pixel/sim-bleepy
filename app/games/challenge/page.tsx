'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, QrCode, ArrowRight, Target, Users, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

export default function ChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quiz/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_count: 10,
        }),
      })
      if (!response.ok) throw new Error('Failed to create challenge')
      const data = await response.json()
      router.push(`/games/challenge/${data.challenge.code}`)
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert('Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = () => {
    if (code.length === 6) {
      router.push(`/games/challenge/${code}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Beta Notice */}
      <BetaNotice />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Challenge Mode
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Compete with friends in real-time challenges</p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
        >
          <Users className="w-6 h-6 text-blue-600 mb-2" />
          <p className="font-semibold text-blue-900">Up to 8 Players</p>
          <p className="text-sm text-blue-700">Compete together</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
        >
          <Trophy className="w-6 h-6 text-purple-600 mb-2" />
          <p className="font-semibold text-purple-900">Real-time Rankings</p>
          <p className="text-sm text-purple-700">See who's winning</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200"
        >
          <QrCode className="w-6 h-6 text-orange-600 mb-2" />
          <p className="font-semibold text-orange-900">Easy Sharing</p>
          <p className="text-sm text-orange-700">QR code or code</p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Challenge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg border-2 border-blue-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create Challenge</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Create a new challenge and invite others to join. Share the code or QR code to get started!
          </p>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:shadow-xl transition-all disabled:opacity-50 font-semibold text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Challenge
              </>
            )}
          </button>
        </motion.div>

        {/* Join Challenge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg border-2 border-green-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-600 rounded-xl">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Join Challenge</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Enter a 6-digit code to join an existing challenge
          </p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 px-4 py-3 border-2 border-green-300 rounded-xl text-center text-3xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                disabled={code.length !== 6}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            {code.length > 0 && code.length < 6 && (
              <p className="text-sm text-gray-500 text-center">
                {6 - code.length} more digits needed
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

