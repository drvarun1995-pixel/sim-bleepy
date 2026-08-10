import { createClient, SupabaseClient } from '@supabase/supabase-js'

const WINDOW_MS = 5 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 10
const LOCKOUT_MS = 15 * 60 * 1000

type RateLimitRow = {
  rate_key: string
  failed_attempts: number
  window_start: string
  locked_until: string | null
}

type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
}

// Fallback when Supabase table is not yet migrated (single-instance only)
const memoryStore = new Map<string, { failedAttempts: number; windowStart: number; lockedUntil: number | null }>()

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  supabaseAdmin = createClient(url, key)
  return supabaseAdmin
}

function checkMemoryLimit(key: string): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry) return { allowed: true }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  if (now - entry.windowStart > WINDOW_MS) {
    memoryStore.delete(key)
    return { allowed: true }
  }

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    }
  }

  return { allowed: true }
}

function recordMemoryFailure(key: string): void {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    memoryStore.set(key, { failedAttempts: 1, windowStart: now, lockedUntil: null })
    return
  }

  entry.failedAttempts += 1
  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS
  }
}

function clearMemory(key: string): void {
  memoryStore.delete(key)
}

export async function checkAuthRateLimit(rateKey: string): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return checkMemoryLimit(rateKey)

  try {
    const { data, error } = await supabase
      .from('auth_rate_limits')
      .select('rate_key, failed_attempts, window_start, locked_until')
      .eq('rate_key', rateKey)
      .maybeSingle()

    if (error) {
      console.warn('auth_rate_limits lookup failed, using memory fallback:', error.message)
      return checkMemoryLimit(rateKey)
    }

    if (!data) return { allowed: true }

    const row = data as RateLimitRow
    const now = Date.now()
    const windowStart = new Date(row.window_start).getTime()
    const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : null

    if (lockedUntil && lockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
      }
    }

    if (now - windowStart > WINDOW_MS) {
      await supabase.from('auth_rate_limits').delete().eq('rate_key', rateKey)
      return { allowed: true }
    }

    if (row.failed_attempts >= MAX_FAILED_ATTEMPTS) {
      const newLockedUntil = new Date(now + LOCKOUT_MS).toISOString()
      await supabase
        .from('auth_rate_limits')
        .update({ locked_until: newLockedUntil })
        .eq('rate_key', rateKey)
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
      }
    }

    return { allowed: true }
  } catch (err) {
    console.warn('auth rate limit error, using memory fallback:', err)
    return checkMemoryLimit(rateKey)
  }
}

export async function recordFailedAuthAttempt(rateKey: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    recordMemoryFailure(rateKey)
    return
  }

  try {
    const { data } = await supabase
      .from('auth_rate_limits')
      .select('failed_attempts, window_start')
      .eq('rate_key', rateKey)
      .maybeSingle()

    const now = new Date().toISOString()

    if (!data) {
      await supabase.from('auth_rate_limits').insert({
        rate_key: rateKey,
        failed_attempts: 1,
        window_start: now,
        locked_until: null,
      })
      return
    }

    const row = data as RateLimitRow
    const windowStart = new Date(row.window_start).getTime()
    const expired = Date.now() - windowStart > WINDOW_MS

    const failedAttempts = expired ? 1 : row.failed_attempts + 1
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MS).toISOString()
        : null

    await supabase.from('auth_rate_limits').upsert({
      rate_key: rateKey,
      failed_attempts: failedAttempts,
      window_start: expired ? now : row.window_start,
      locked_until: lockedUntil,
    })
  } catch (err) {
    console.warn('record failed auth attempt error, using memory fallback:', err)
    recordMemoryFailure(rateKey)
  }
}

export async function clearAuthRateLimit(rateKey: string): Promise<void> {
  clearMemory(rateKey)
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  try {
    await supabase.from('auth_rate_limits').delete().eq('rate_key', rateKey)
  } catch {
    // non-fatal
  }
}

export function loginRateKey(email: string): string {
  return `login:${email.toLowerCase().trim()}`
}

export function forgotPasswordRateKey(email: string): string {
  return `forgot:${email.toLowerCase().trim()}`
}

export function resetPasswordRateKey(ip: string): string {
  return `reset-password:${ip}`
}

export function downloadPasswordRateKey(email: string): string {
  return `download-password:${email.toLowerCase().trim()}`
}

export function blogTrackRateKey(email: string): string {
  return `blog-track:${email.toLowerCase().trim()}`
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

export function ipRateKey(ip: string, action: string): string {
  return `ip:${action}:${ip}`
}

type SoftLimitOptions = {
  windowMs: number
  maxAttempts: number
  lockoutMs: number
}

/** Memory-only throttle for high-frequency authenticated endpoints (e.g. analytics heartbeats). */
export function consumeSoftRateLimit(
  rateKey: string,
  options: SoftLimitOptions
): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(rateKey)

  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  if (!entry || now - entry.windowStart > options.windowMs) {
    memoryStore.set(rateKey, { failedAttempts: 1, windowStart: now, lockedUntil: null })
    return { allowed: true }
  }

  entry.failedAttempts += 1
  if (entry.failedAttempts > options.maxAttempts) {
    entry.lockedUntil = now + options.lockoutMs
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(options.lockoutMs / 1000),
    }
  }

  return { allowed: true }
}

/** Heartbeat-friendly blog analytics ceiling (~2/sec burst, short cool-down). */
export const BLOG_TRACK_SOFT_LIMIT: SoftLimitOptions = {
  windowMs: 60 * 1000,
  maxAttempts: 90,
  lockoutMs: 30 * 1000,
}
