import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_FAILED_ATTEMPTS,
  LOGIN_WINDOW_MINUTES,
} from '@/lib/auth-rate-limit'

export async function notifyLoginLockout(params: {
  email: string
  userName?: string | null
  userExists: boolean
  ip?: string | null
}) {
  try {
    const { sendLoginLockoutNotifications } = await import('@/lib/email')
    await sendLoginLockoutNotifications({
      email: params.email,
      userName: params.userName,
      userExists: params.userExists,
      ip: params.ip,
      lockoutMinutes: LOGIN_LOCKOUT_MINUTES,
      maxAttempts: LOGIN_MAX_FAILED_ATTEMPTS,
      windowMinutes: LOGIN_WINDOW_MINUTES,
    })
  } catch (error) {
    console.error('Login lockout notification failed:', error)
  }
}
