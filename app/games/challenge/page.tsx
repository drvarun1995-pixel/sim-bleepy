'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, QrCode, ArrowRight, Target, Users, Trophy, Zap, CheckCircle2, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'
import { toast } from 'sonner'

export default function ChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

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

  const handleJoin = async () => {
    if (code.length !== 6) {
      return
    }

    setJoinLoading(true)
    try {
      const response = await fetch(`/api/quiz/challenges/${code}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Invalid Code', {
            description: 'The challenge code you entered is incorrect. Please check and try again.',
            duration: 4000,
          })
          return
        }
        throw new Error('Failed to fetch challenge')
      }
      
      // Challenge exists, navigate to it
      router.push(`/games/challenge/${code}`)
    } catch (error) {
      console.error('Error joining challenge:', error)
      toast.error('Error', {
        description: 'An error occurred while joining the challenge. Please try again.',
        duration: 4000,
      })
    } finally {
      setJoinLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Up to 8 Players',
      description: 'Compete together with friends and classmates in real-time.',
      color: 'blue',
    },
    {
      icon: Trophy,
      title: 'Real-time Rankings',
      description: 'See who\'s winning with live leaderboard updates.',
      color: 'purple',
    },
    {
      icon: QrCode,
      title: 'Easy Sharing',
      description: 'Join with a simple 6-digit code or scan a QR code.',
      color: 'orange',
    },
    {
      icon: Zap,
      title: 'Fast-paced Action',
      description: 'Answer questions quickly to climb the leaderboard.',
      color: 'green',
    },
  ]

  const tips = [
    {
      icon: CheckCircle2,
      text: 'Create a challenge and share the code with your friends',
    },
    {
      icon: CheckCircle2,
      text: 'Answer questions quickly and accurately to score more points',
    },
    {
      icon: CheckCircle2,
      text: 'Watch the leaderboard to see how you compare in real-time',
    },
    {
      icon: CheckCircle2,
      text: 'Use QR codes for easy joining - just scan and play',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
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

        {/* Main Create/Join Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Challenge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-200 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create Challenge</h2>
            </div>
            <p className="text-gray-600 mb-6 text-center md:text-left">
              Create a new challenge and invite others to join. Share the code or QR code to get started!
            </p>
            <div className="mt-auto">
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
            </div>
          </motion.div>

          {/* Join Challenge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-2xl shadow-xl border-2 border-green-200 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <div className="p-3 bg-green-600 rounded-xl">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Join Challenge</h2>
            </div>
            <p className="text-gray-600 mb-6 text-center md:text-left">
              Enter a 6-digit code to join an existing challenge
            </p>
            <div className="mt-auto">
              <div className="flex gap-2 items-stretch">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 min-w-0 px-4 py-3 border-2 border-green-300 rounded-xl text-center text-2xl sm:text-3xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={6}
                  disabled={joinLoading}
                  style={{ maxWidth: 'calc(100% - 4.5rem)' }}
                />
                <button
                  onClick={handleJoin}
                  disabled={code.length !== 6 || joinLoading}
                  className="flex-shrink-0 w-14 self-stretch bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {joinLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <ArrowRight className="w-6 h-6" />
                  )}
                </button>
              </div>
              {code.length > 0 && code.length < 6 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  {6 - code.length} more digits needed
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Challenge Mode?</h2>
            <p className="text-gray-600">Everything you need for competitive learning</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'from-blue-500 to-cyan-500 bg-blue-50 border-blue-200 text-blue-900',
                purple: 'from-purple-500 to-pink-500 bg-purple-50 border-purple-200 text-purple-900',
                green: 'from-green-500 to-emerald-500 bg-green-50 border-green-200 text-green-900',
                orange: 'from-orange-500 to-amber-500 bg-orange-50 border-orange-200 text-orange-900',
              }
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 text-center flex flex-col items-center"
                >
                  <div className={`flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-600">Simple steps to start your challenge</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Create or Join',
                description: 'Create a new challenge or join an existing one using a 6-digit code or QR code.',
                icon: Target,
              },
              {
                step: '2',
                title: 'Compete in Real-time',
                description: 'Answer questions quickly and accurately to climb the leaderboard.',
                icon: Zap,
              },
              {
                step: '3',
                title: 'See Results',
                description: 'View final rankings and see how you compared to other players.',
                icon: Trophy,
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-200 to-emerald-200 transform translate-x-4" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* Tips Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Challenge Tips</h2>
              <p className="text-green-100">Maximize your competitive edge with these strategies</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, index) => {
              const Icon = tip.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{tip.text}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Stats/Info Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              8
            </div>
            <div className="text-gray-600 font-semibold">Maximum Players</div>
            <div className="text-sm text-gray-500 mt-1">Compete with up to 8 players</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Real-time
            </div>
            <div className="text-gray-600 font-semibold">Live Leaderboard</div>
            <div className="text-sm text-gray-500 mt-1">See rankings update instantly</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Quick
            </div>
            <div className="text-gray-600 font-semibold">Easy Joining</div>
            <div className="text-sm text-gray-500 mt-1">6-digit code or QR scan</div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

