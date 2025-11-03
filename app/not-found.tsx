'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search, Map, BookOpen, Stethoscope, TrendingUp, Menu } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const quickLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-400 hover:text-blue-300' },
    { name: 'Events', href: '/events', icon: Map, color: 'text-purple-400 hover:text-purple-300' },
    { name: 'Stations', href: '/stations', icon: Stethoscope, color: 'text-green-400 hover:text-green-300' },
    { name: 'Downloads', href: '/downloads', icon: BookOpen, color: 'text-yellow-400 hover:text-yellow-300' },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'text-red-400 hover:text-red-300' },
  ]

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        {/* Main Image with animation */}
        <div className={`flex justify-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative">
            <Image
              src="/404-bleepy-rawrr.webp"
              alt="Bleepy 404 - Rawrr!"
              width={700}
              height={500}
              className="w-full max-w-2xl h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
              priority
            />
            {/* Animated "Rawrr!" badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
              <span className="text-2xl font-bold">Rawrr! 🦖</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`space-y-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Oops! Lost in Space?
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Looks like you've wandered into uncharted territory! Don't worry, Bleepy is here to guide you back. 
            <span className="block mt-2 text-lg text-gray-400">
              The page you're looking for seems to have vanished into the medical education void! 🚀
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            asChild 
            size="lg" 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/">
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-300"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-300"
          >
            <Link href="/dashboard">
              <Search className="h-5 w-5 mr-2" />
              Explore Dashboard
            </Link>
          </Button>
        </div>

        {/* Quick Navigation Grid */}
        <div className={`pt-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-sm text-gray-400 mb-6 font-medium uppercase tracking-wider">
              Quick Navigation
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
              {quickLinks.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group flex flex-col items-center p-4 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 ${link.color}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <link.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Fun Facts Section */}
        <div className={`pt-8 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-full">
            <p className="text-sm text-gray-400">
              💡 <span className="text-gray-300">Tip:</span> Use the navigation menu or quick links above to find what you're looking for!
            </p>
          </div>
        </div>

        {/* 404 Number Display */}
        <div className="absolute top-20 left-10 hidden lg:block">
          <div className="text-9xl font-black text-gray-900/20 select-none">
            404
          </div>
        </div>
        <div className="absolute bottom-20 right-10 hidden lg:block">
          <div className="text-9xl font-black text-gray-900/20 select-none">
            404
          </div>
        </div>
      </div>
    </div>
  )
}

