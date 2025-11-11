'use client'

import { PracticeSetup } from '@/components/quiz/PracticeSetup'
import { BetaNotice } from '@/components/quiz/BetaNotice'
import { BookOpen, TrendingUp, Award, BarChart3, Lightbulb, CheckCircle2, Timer, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PracticePage() {
  const features = [
    {
      icon: Timer,
      title: 'Flexible Timing',
      description: 'Choose your pace with customizable time limits from 30 to 90 seconds per question.',
      color: 'blue',
    },
    {
      icon: Target,
      title: 'Smart Practice',
      description: 'Filter by category and difficulty to focus on areas that need improvement.',
      color: 'purple',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your performance with detailed analytics and accuracy metrics.',
      color: 'green',
    },
    {
      icon: Award,
      title: 'Instant Feedback',
      description: 'Get immediate results and explanations to learn from each question.',
      color: 'amber',
    },
  ]

  const tips = [
    {
      icon: CheckCircle2,
      text: 'Start with fewer questions to build confidence',
    },
    {
      icon: CheckCircle2,
      text: 'Review explanations carefully to understand concepts',
    },
    {
      icon: CheckCircle2,
      text: 'Practice regularly to maintain and improve your skills',
    },
    {
      icon: CheckCircle2,
      text: 'Use skip option if you\'re unsure - it\'s better than guessing',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Beta Notice */}
        <BetaNotice />

        {/* Main Practice Setup */}
        <PracticeSetup />

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Practice Mode?</h2>
            <p className="text-gray-600">Everything you need to excel in your medical studies</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'from-blue-500 to-cyan-500 bg-blue-50 border-blue-200 text-blue-900',
                purple: 'from-purple-500 to-pink-500 bg-purple-50 border-purple-200 text-purple-900',
                green: 'from-green-500 to-emerald-500 bg-green-50 border-green-200 text-green-900',
                amber: 'from-amber-500 to-orange-500 bg-amber-50 border-amber-200 text-amber-900',
              }
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} mb-4`}>
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
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-600">Simple steps to start your practice session</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Configure Settings',
                description: 'Choose your category, difficulty, number of questions, and time limit.',
                icon: BookOpen,
              },
              {
                step: '2',
                title: 'Answer Questions',
                description: 'Work through questions at your own pace with instant feedback.',
                icon: Zap,
              },
              {
                step: '3',
                title: 'Review Results',
                description: 'See your score, accuracy, and detailed explanations for each question.',
                icon: BarChart3,
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-cyan-200 transform translate-x-4" />
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
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Practice Tips</h2>
              <p className="text-blue-100">Maximize your learning with these helpful strategies</p>
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
                  transition={{ delay: 0.9 + index * 0.1 }}
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
          transition={{ delay: 1.0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              100+
            </div>
            <div className="text-gray-600 font-semibold">Points Per Question</div>
            <div className="text-sm text-gray-500 mt-1">Simple scoring system</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Random
            </div>
            <div className="text-gray-600 font-semibold">Question Order</div>
            <div className="text-sm text-gray-500 mt-1">Different every time</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Unlimited
            </div>
            <div className="text-gray-600 font-semibold">Practice Sessions</div>
            <div className="text-sm text-gray-500 mt-1">Practice as much as you want</div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

