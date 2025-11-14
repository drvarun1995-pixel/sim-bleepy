'use client'

import { HelpCircle, BookOpen, Target, Trophy, Crown, Sparkles, Clock, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { BetaNotice } from '@/components/quiz/BetaNotice'

const helpSections = [
  {
    title: 'Practice Mode',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    description:
      'Build confidence with flexible solo sessions. Practice mode mirrors real exam pacing while letting you choose the topic and time pressure.',
    points: [
      'Pick any category/difficulty and select 5, 10, 20, or 50 questions',
      'Choose a personal timer: 30, 45, 60, 75, or 90 seconds per question',
      'See the correct answer and explanation immediately after each attempt',
      'Earn XP toward your leaderboard rank every time you complete a session',
      'Great for daily streaks, revision blocks, and focused topic drills',
    ],
  },
  {
    title: 'Challenge Mode',
    icon: Target,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    description:
      'Host or join real-time multiplayer quizzes. Everyone sees the same questions, and transitions are locked to keep the group in sync.',
    points: [
      'Create a room, share the 6-digit code (or QR) and invite up to 8 players',
      'Each question stays on screen until every player submits or the timer expires',
      'We verify all answers server-side, then show the solution for 3 seconds',
      'Scoreboard slides in for another 3 seconds before the next question',
      'Perfect for teaching sessions, peer revision, or departmental games',
    ],
  },
  {
    title: 'Campaign Mode',
    icon: Trophy,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    description:
      'Structured learning paths with unlockable sections. Campaign mode is ideal when you want guidance on what to revise next.',
    points: [
      'Finish a section with 80%+ accuracy to unlock the next block',
      'Mix of practice-style questions plus curated revision notes',
      'Campaign progress feeds into your XP and badge collection',
      'Use it to build long-term mastery of each specialty',
    ],
  },
  {
    title: 'Scoring System',
    icon: Crown,
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    description:
      'We simplified scoring to keep games transparent. Only correct answers earn points, so accuracy matters more than button mashing.',
    points: [
      'Base: 100 points per correct answer (no deductions for incorrect)',
      'Difficulty and streak multipliers are currently disabled for fairness',
      'Speed bonuses are off – finishing inside the timer is enough',
      'Challenge and practice scores both count toward your total',
    ],
  },
  {
    title: 'Leaderboards & XP',
    icon: Sparkles,
    gradient: 'from-amber-500 to-pink-500',
    bgGradient: 'from-amber-50 to-pink-50',
    borderColor: 'border-amber-200',
    description:
      'Leaderboard positions are powered by XP from practice sessions, achievements, and streak bonuses.',
    points: [
      'Complete practice sessions to award XP automatically',
      'Earn extra XP from achievements (perfect score, streak bonuses, etc.)',
      'Make your profile public to appear on the global leaderboard',
      'Challenges are great for live play, but XP currently comes from practice + achievements',
    ],
  },
]

export default function HelpPage() {
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
          <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl">
            <HelpCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Help & Tutorials
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Learn how to use MedQuest Academy and master medical knowledge</p>
      </motion.div>

      {/* Help Sections */}
      <div className="space-y-6">
        {helpSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${section.bgGradient} p-8 rounded-2xl shadow-lg border-2 ${section.borderColor}`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 bg-gradient-to-br ${section.gradient} rounded-xl shadow-lg`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed">{section.description}</p>
              </div>
            </div>
            <ul className="space-y-2 ml-16">
              {section.points.map((point, pointIndex) => (
                <li key={pointIndex} className="flex items-start gap-2 text-gray-700">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.gradient}`}></span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-200"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          Quick Tips
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Time Management</p>
              <p className="text-sm text-gray-600">Choose your preferred time limit (30-90 seconds). Take your time to think carefully!</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Build Streaks</p>
              <p className="text-sm text-gray-600">Consecutive correct answers multiply your points!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

