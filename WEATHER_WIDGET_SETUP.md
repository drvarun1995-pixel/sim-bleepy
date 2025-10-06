# Weather Widget Setup

## Overview
A live weather widget has been added to the dashboard showing real-time weather for Basildon, UK.

## Features
- 🌡️ Current temperature and "feels like" temperature
- ☁️ Weather condition with appropriate icon
- 💧 Humidity percentage
- 💨 Wind speed (km/h)
- 👁️ Visibility (km)
- 🔄 Auto-refreshes every 10 minutes
- 🎨 Beautiful gradient design with glassmorphism effects

## Setup Instructions

### 1. Get OpenWeatherMap API Key
1. Go to https://openweathermap.org/api
2. Click "Sign Up" (or "Sign In" if you have an account)
3. After signing in, go to "API keys" in your account
4. Copy your API key

### 2. Add API Key to Environment Variables

Create or update your `.env.local` file in the project root:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

**Important**: The `NEXT_PUBLIC_` prefix is required for the API key to be accessible in the browser.

### 3. Restart Development Server

After adding the API key, restart your dev server:
```bash
npm run dev
```

### 4. Production Deployment

For Vercel deployment:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_OPENWEATHER_API_KEY` with your API key
4. Redeploy

## Free Tier Limits
OpenWeatherMap free tier includes:
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5 day forecast

Since the widget refreshes every 10 minutes, it uses only ~4,320 calls per month (well within the free limit).

## Fallback Behavior
If the API key is missing or there's an error:
- Shows "Weather unavailable" message
- Displays a cloud icon
- Doesn't break the dashboard

## Location
The widget is hardcoded to show weather for **Basildon, UK** (near Basildon Hospital).

