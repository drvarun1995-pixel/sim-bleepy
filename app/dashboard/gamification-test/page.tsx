'use client'

export default function GamificationTest() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🎮 Gamification Test Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          If you can see this page, the basic routing is working.
        </p>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Test Components:
          </h2>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>✅ Basic page rendering</li>
            <li>⏳ Level Progress component</li>
            <li>⏳ Achievement Gallery component</li>
            <li>⏳ Leaderboard component</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
