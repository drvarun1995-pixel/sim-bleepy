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
    description: 'Practice mode allows you to answer questions at your own pace. Perfect for studying and improving your knowledge.',
    points: [
      'Select a category and difficulty level',
      'Choose the number of questions (5, 10, 20, or 50)',
      'Answer questions with a 1-minute timer',
      'Review detailed explanations after each question',
      'Track your progress and improve over time',
    ],
  },
  {
    title: 'Challenge Mode',
    icon: Target,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    description: 'Compete with friends in real-time challenges. Create or join a challenge with a 6-digit code.',
    points: [
      'Create a challenge and share the code or QR code',
      'Up to 8 players can join simultaneously',
      'Answer questions in real-time together',
      'See live rankings after each question',
      '5-minute lobby countdown with "Start Now" option',
    ],
  },
  {
    title: 'Campaign Mode',
    icon: Trophy,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    description: 'Progress through structured learning paths. Unlock new sections as you master topics.',
    points: [
      'Complete sections to unlock new ones',
      'Achieve 80%+ accuracy to master a section',
      'Track your progress through campaigns',
      'Structured learning from basic to advanced',
    ],
  },
  {
    title: 'Scoring System',
    icon: Crown,
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    description: 'Points are calculated based on correctness, difficulty, and streaks.',
    points: [
      'Base: 100 points per correct answer',
      'Difficulty multiplier: Easy 1.0x, Medium 1.3x, Hard 1.6x',
      'Streak multiplier: 3+ (1.2x), 5+ (1.5x), 10+ (2.0x)',
      'Only correct answers earn points',
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
              <p className="text-sm text-gray-600">You have 1 minute per question. Take your time to think carefully!</p>
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

