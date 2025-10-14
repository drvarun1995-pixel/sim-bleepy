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
      
      if (!API_KEY) {
        throw new Error('API key not configured')
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Basildon,UK&units=metric&appid=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather')
      }

      const data = await response.json()
      
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
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'clear':
        return <Sun className="h-8 w-8 text-yellow-300" />
      case 'clouds':
        return <Cloud className="h-8 w-8 text-white/90" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-8 w-8 text-blue-200" />
      case 'snow':
        return <CloudSnow className="h-8 w-8 text-blue-100" />
      default:
        return <Cloud className="h-8 w-8 text-white/90" />
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center justify-center">
            <Cloud className="h-8 w-8 text-white/50 animate-bounce" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card className="bg-gradient-to-br from-gray-400 to-gray-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Cloud className="h-6 w-6 text-white/50" />
            <p className="text-sm">Weather unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 text-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
      
      <CardContent className="p-3 relative z-10">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Location and Temperature */}
          <div className="flex items-center gap-2">
            {/* Weather Icon */}
            <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg">
              {getWeatherIcon(weather.main)}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-xs font-bold">Basildon</h3>
                <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded-full">Live</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{weather.temp}°C</span>
                <span className="text-[10px] text-white/70">• Feels {weather.feelsLike}°C</span>
              </div>
              <p className="text-[10px] text-white/80 capitalize">{weather.description}</p>
            </div>
          </div>

          {/* Right: Weather Details - Compact Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 py-1 rounded-md">
              <Droplets className="h-3 w-3 text-white/80" />
              <span className="font-semibold">{weather.humidity}%</span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 py-1 rounded-md">
              <Wind className="h-3 w-3 text-white/80" />
              <span className="font-semibold">{weather.windSpeed} km/h</span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 py-1 rounded-md">
              <Gauge className="h-3 w-3 text-white/80" />
              <span className="font-semibold">{weather.pressure}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 py-1 rounded-md">
              <Eye className="h-3 w-3 text-white/80" />
              <span className="font-semibold">{weather.visibility} km</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

