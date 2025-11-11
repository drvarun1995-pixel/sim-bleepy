import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Games - MedQuest Academy',
  description: 'Medical quiz games for UK medical students',
}

export default function GamesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MedQuest Academy</h1>
        <p className="text-gray-600 mb-8">
          Welcome to the medical quiz game! Choose a mode to get started.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
            <p className="text-gray-600 mb-4">
              Practice questions at your own pace. Perfect for studying and improving your knowledge.
            </p>
            <a
              href="/dashboard/games/practice"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Start Practice
            </a>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Challenge Mode</h2>
            <p className="text-gray-600 mb-4">
              Compete with friends in real-time challenges. Create or join a challenge with a code.
            </p>
            <a
              href="/dashboard/games/challenge"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Start Challenge
            </a>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Campaigns</h2>
            <p className="text-gray-600 mb-4">
              Progress through structured campaigns and unlock new sections as you master topics.
            </p>
            <a
              href="/dashboard/games/campaigns"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              View Campaigns
            </a>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Leaderboards</h2>
            <p className="text-gray-600 mb-4">
              See how you rank against other medical students. Compete for the top spots!
            </p>
            <a
              href="/dashboard/games/leaderboards"
              className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              View Leaderboards
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


