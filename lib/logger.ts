// Server-side logging utility for capturing errors and important events
// Logs are stored in Supabase for admin viewing

import { supabaseAdmin } from '@/utils/supabase'

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  stack?: string
  user_id?: string
  user_email?: string
  api_route?: string
  timestamp: string
}

// Store logs in Supabase
async function storeLog(entry: LogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('system_logs')
      .insert({
        level: entry.level,
        message: entry.message,
        context: entry.context || {},
        stack: entry.stack || null,
        user_id: entry.user_id || null,
        user_email: entry.user_email || null,
        api_route: entry.api_route || null,
        created_at: entry.timestamp
      })

    if (error) {
      // Silently fail - we don't want logging to break the app
      console.error('Failed to store log entry:', error)
    }
  } catch (error) {
    // Silently fail - we don't want logging to break the app
    console.error('Error storing log entry:', error)
  }
}

// Log an error
export async function logError(
  message: string,
  error?: Error | unknown,
  context?: Record<string, any>,
  apiRoute?: string,
  userId?: string,
  userEmail?: string
): Promise<void> {
  const entry: LogEntry = {
    level: 'error',
    message,
    context: context || {},
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    api_route: apiRoute,
    user_id: userId,
    user_email: userEmail
  }

  // Also log to console for immediate visibility
  console.error('❌', message, { error, context, apiRoute, userId, userEmail })

  // Store in database (non-blocking)
  storeLog(entry).catch(() => {})
}

// Log a warning
export async function logWarning(
  message: string,
  context?: Record<string, any>,
  apiRoute?: string,
  userId?: string,
  userEmail?: string
): Promise<void> {
  const entry: LogEntry = {
    level: 'warn',
    message,
    context: context || {},
    timestamp: new Date().toISOString(),
    api_route: apiRoute,
    user_id: userId,
    user_email: userEmail
  }

  console.warn('⚠️', message, { context, apiRoute, userId, userEmail })
  storeLog(entry).catch(() => {})
}

// Log info
export async function logInfo(
  message: string,
  context?: Record<string, any>,
  apiRoute?: string,
  userId?: string,
  userEmail?: string
): Promise<void> {
  const entry: LogEntry = {
    level: 'info',
    message,
    context: context || {},
    timestamp: new Date().toISOString(),
    api_route: apiRoute,
    user_id: userId,
    user_email: userEmail
  }

  console.log('ℹ️', message, { context, apiRoute, userId, userEmail })
  storeLog(entry).catch(() => {})
}

// Log debug (only in development)
export async function logDebug(
  message: string,
  context?: Record<string, any>,
  apiRoute?: string,
  userId?: string,
  userEmail?: string
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const entry: LogEntry = {
      level: 'debug',
      message,
      context: context || {},
      timestamp: new Date().toISOString(),
      api_route: apiRoute,
      user_id: userId,
      user_email: userEmail
    }

    console.log('🔍', message, { context, apiRoute, userId, userEmail })
    storeLog(entry).catch(() => {})
  }
}

