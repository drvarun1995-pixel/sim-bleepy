import { NextRequest, NextResponse } from 'next/server'
import {
  checkAuthRateLimit,
  consumeSoftRateLimit,
  getClientIp,
  ipRateKey,
  LOGIN_IP_RATE_LIMIT,
  loginRateKey,
} from '@/lib/auth-rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const probeLimit = consumeSoftRateLimit(ipRateKey(ip, 'lock-status'), {
    windowMs: 60 * 1000,
    maxAttempts: 30,
    lockoutMs: 60 * 1000,
  })
  if (!probeLimit.allowed) {
    return NextResponse.json({ locked: true, retryAfterSeconds: probeLimit.retryAfterSeconds || 60 })
  }

  let email = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  } catch {
    return NextResponse.json({ locked: false })
  }

  if (!email) {
    return NextResponse.json({ locked: false })
  }

  const [emailLimit, ipLimit] = await Promise.all([
    checkAuthRateLimit(loginRateKey(email)),
    checkAuthRateLimit(ipRateKey(ip, 'login'), LOGIN_IP_RATE_LIMIT),
  ])

  const locked = !emailLimit.allowed || !ipLimit.allowed
  const retryAfterSeconds = Math.max(
    emailLimit.retryAfterSeconds || 0,
    ipLimit.retryAfterSeconds || 0
  )

  return NextResponse.json({
    locked,
    retryAfterSeconds: locked ? retryAfterSeconds || undefined : undefined,
  })
}
