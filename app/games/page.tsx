'use client'

import Link from 'next/link'
import { BookOpen, Target, Trophy, Crown, BarChart3, HelpCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

const gameModes = [
  {
    name: 'Practice Mode',
    description: 'Practice questions at your own pace. Perfect for studying and improving your knowledge.',
    href: '/games/practice',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
  },
  {
    name: 'Challenge Mode',
    description: 'Compete with friends in real-time challenges. Create or join a challenge with a code.',
    href: '/games/challenge',
    icon: Target,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
  },
  {
    name: 'Campaigns',
    description: 'Progress through structured campaigns and unlock new sections as you master topics.',
    href: '/games/campaigns',
    icon: Trophy,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
  },
  {
    name: 'Leaderboards',
    description: 'See how you rank against other medical students. Compete for the top spots!',
    href: '/games/leaderboards',
    icon: Crown,
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-600',
  },
]

export default function GamesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Beta Notice */}
      <BetaNotice />
      
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            MedQuest Academy
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Master medical knowledge through interactive quizzes. From Foundation Year to Consultant level.
        </p>
      </motion.div>

      {/* Game Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gameModes.map((mode, index) => (
          <motion.div
            key={mode.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.03, y: -5 }}
            className={`bg-gradient-to-br ${mode.bgGradient} p-8 rounded-2xl shadow-lg border-2 ${mode.borderColor} hover:shadow-2xl transition-all group cursor-pointer`}
          >
            <Link href={mode.href} className="block">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-4 bg-gradient-to-br ${mode.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  <mode.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{mode.name}</h2>
                  <p className="text-gray-600 leading-relaxed">{mode.description}</p>
                </div>
              </div>
              <div className={`mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${mode.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}>
                Get Started
                <mode.icon className="w-5 h-5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Link
          href="/games/stats"
          className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Your Statistics</h3>
            <p className="text-sm text-gray-600">Track your progress</p>
          </div>
        </Link>
        <Link
          href="/games/help"
          className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
            <HelpCircle className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Help & Tutorials</h3>
            <p className="text-sm text-gray-600">Learn how to play</p>
          </div>
        </Link>
      </motion.div>
    </div>
  )
}

