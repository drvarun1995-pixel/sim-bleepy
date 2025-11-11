'use client'

import { HelpCircle, BookOpen, Target, Trophy, Crown } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Help & Tutorials</h1>
        <p className="text-gray-600">Learn how to use MedQuest Academy</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Practice Mode
          </h2>
          <p className="text-gray-600 mb-2">
            Practice mode allows you to answer questions at your own pace. Perfect for studying and improving your knowledge.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Select a category and difficulty level</li>
            <li>Choose the number of questions</li>
            <li>Answer questions with a 45-second timer</li>
            <li>Review explanations after each question</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Challenge Mode
          </h2>
          <p className="text-gray-600 mb-2">
            Compete with friends in real-time challenges. Create or join a challenge with a 6-digit code.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Create a challenge and share the code</li>
            <li>Up to 8 players can join</li>
            <li>Answer questions simultaneously</li>
            <li>See live rankings after each question</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Campaign Mode
          </h2>
          <p className="text-gray-600 mb-2">
            Progress through structured learning paths. Unlock new sections as you master topics.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Complete sections to unlock new ones</li>
            <li>Achieve 80%+ accuracy to master a section</li>
            <li>Track your progress through campaigns</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Scoring System
          </h2>
          <p className="text-gray-600 mb-2">
            Points are calculated based on correctness, speed, difficulty, and streaks.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Base: 100 points per correct answer</li>
            <li>Speed bonus: +75 (0-15s), +50 (15-30s), +25 (30-45s)</li>
            <li>Difficulty multiplier: Easy 1.0x, Medium 1.3x, Hard 1.6x</li>
            <li>Streak multiplier: 3+ (1.2x), 5+ (1.5x), 10+ (2.0x)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


