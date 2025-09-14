import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Station {
  slug: string
  title: string
}

export interface Attempt {
  id: string
  user_id: string
  station_slug: string
  start_time: string
  end_time?: string
  duration?: number
  scores?: any
  overall_band?: string
  created_at: string
}

export interface AttemptEvent {
  id: string
  attempt_id: string
  type: string
  timestamp: string
  meta?: any
  created_at: string
}
