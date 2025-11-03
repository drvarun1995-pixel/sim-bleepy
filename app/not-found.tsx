import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Image */}
        <div className="flex justify-center">
          <Image
            src="/404-logo.webp"
            alt="404 Page Not Found"
            width={600}
            height={400}
            className="w-full max-w-2xl h-auto rounded-lg shadow-lg"
            priority
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You might be looking for:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              href="/events" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Events
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              href="/stations" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Stations
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              href="/downloads" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Downloads
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

