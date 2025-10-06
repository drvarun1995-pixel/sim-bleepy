'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Eye, Gauge } from 'lucide-react'

interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
  visibility: number
  description: string
  icon: string
  main: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchWeather()
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000)
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      // Using OpenWeatherMap API for Basildon, UK
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      
      console.log('🌤️ Weather API Key present:', API_KEY ? 'Yes' : 'No')
      
      if (!API_KEY || API_KEY === 'demo') {
        console.error('❌ OpenWeatherMap API key not configured')
        throw new Error('API key not configured')
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=Basildon,UK&units=metric&appid=${API_KEY}`
      console.log('🌍 Fetching weather from:', url.replace(API_KEY, 'API_KEY_HIDDEN'))
      
      const response = await fetch(url)
      
      console.log('📡 Weather API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Weather API Error:', errorData)
        throw new Error(`API Error: ${errorData.message || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('✅ Weather data received:', data)
      
      setWeather({
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        visibility: Math.round(data.visibility / 1000), // Convert to km
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        main: data.weather[0].main
      })
      setError(false)
    } catch (err) {
      console.error('💥 Weather fetch error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'clear':
        return <Sun className="h-12 w-12 text-yellow-400" />
      case 'clouds':
        return <Cloud className="h-12 w-12 text-gray-400" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-12 w-12 text-blue-400" />
      case 'snow':
        return <CloudSnow className="h-12 w-12 text-blue-200" />
      default:
        return <Cloud className="h-12 w-12 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center justify-center">
            <Cloud className="h-12 w-12 text-white/50 animate-bounce" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card className="bg-gradient-to-br from-gray-400 to-gray-500 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <Cloud className="h-8 w-8 text-white/50 mx-auto mb-2" />
            <p className="text-sm">Weather unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 text-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          {/* Left: Location and Temperature */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">Basildon</h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold">{weather.temp}°</span>
              <span className="text-xl text-white/80">C</span>
            </div>
            <p className="text-sm text-white/90 capitalize mb-1">{weather.description}</p>
            <p className="text-xs text-white/70">Feels like {weather.feelsLike}°C</p>
          </div>

          {/* Right: Weather Icon */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
            {getWeatherIcon(weather.main)}
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
            <Droplets className="h-4 w-4 text-white/80" />
            <div className="flex-1">
              <p className="text-xs text-white/70">Humidity</p>
              <p className="text-sm font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
            <Wind className="h-4 w-4 text-white/80" />
            <div className="flex-1">
              <p className="text-xs text-white/70">Wind</p>
              <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
            <Gauge className="h-4 w-4 text-white/80" />
            <div className="flex-1">
              <p className="text-xs text-white/70">Pressure</p>
              <p className="text-sm font-semibold">{weather.pressure} hPa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
            <Eye className="h-4 w-4 text-white/80" />
            <div className="flex-1">
              <p className="text-xs text-white/70">Visibility</p>
              <p className="text-sm font-semibold">{weather.visibility} km</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

