import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 10 * 60 * 1000

type WeatherPayload = {
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

let cached: { data: WeatherPayload; expiresAt: number } | null = null

export async function GET() {
  try {
    const apiKey =
      process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Weather not configured' }, { status: 503 })
    }

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: { 'Cache-Control': 'private, max-age=600' },
      })
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Basildon,UK&units=metric&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 })
    }

    const data = await response.json()
    const payload: WeatherPayload = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6),
      visibility: Math.round(data.visibility / 1000),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      main: data.weather[0].main,
    }

    cached = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=600' },
    })
  } catch (error) {
    console.error('Error in GET /api/weather:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
