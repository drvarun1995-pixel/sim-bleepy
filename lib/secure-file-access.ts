import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const DOWNLOAD_UNLOCK_COOKIE = 'bleepy_dl_unlock'
/** How long a verified download-password unlock remains valid */
export const DOWNLOAD_UNLOCK_TTL_SECONDS = 60 * 60 * 12 // 12 hours
/** Long-lived token for images embedded in outbound emails */
export const EMAIL_IMAGE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 120 // 120 days

export const FILE_NOINDEX_HEADERS: Record<string, string> = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'private, no-store',
}

const STAFF_ROLES = new Set(['admin', 'meded_team', 'ctf'])

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!value) {
    throw new Error('NEXTAUTH_SECRET (or JWT_SECRET) is required for secure file access')
  }
  return value
}

function signBody(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url')
}

export function signAccessToken(payload: Record<string, unknown>, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = Buffer.from(JSON.stringify({ ...payload, exp }), 'utf8').toString('base64url')
  return `${body}.${signBody(body)}`
}

export function verifyAccessToken<T extends Record<string, unknown>>(
  token: string | null | undefined
): (T & { exp: number }) | null {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  try {
    const expected = signBody(body)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & {
      exp: number
    }
    if (!parsed?.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null
    return parsed
  } catch {
    return null
  }
}

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false
  return STAFF_ROLES.has(role.trim().toLowerCase())
}

export async function hasDownloadUnlock(email: string): Promise<boolean> {
  try {
    const jar = await cookies()
    const token = jar.get(DOWNLOAD_UNLOCK_COOKIE)?.value
    const payload = verifyAccessToken<{ email?: string; purpose?: string }>(token)
    return (
      !!payload?.email &&
      payload.purpose === 'download-unlock' &&
      payload.email.toLowerCase() === email.toLowerCase()
    )
  } catch {
    return false
  }
}

export function downloadUnlockCookieOptions(maxAge = DOWNLOAD_UNLOCK_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function withFileSecurityHeaders(
  init?: HeadersInit,
  extra?: Record<string, string>
): Headers {
  const headers = new Headers(init)
  for (const [k, v] of Object.entries(FILE_NOINDEX_HEADERS)) {
    headers.set(k, v)
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) headers.set(k, v)
  }
  return headers
}

export function applyFileSecurityHeaders(response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(FILE_NOINDEX_HEADERS)) {
    response.headers.set(k, v)
  }
  return response
}

export function isSafeStoragePath(path: string): boolean {
  if (!path || path.includes('..') || path.includes('\\') || path.startsWith('/')) return false
  return true
}

export function signEmailImageToken(path: string): string {
  return signAccessToken({ path, purpose: 'email-image' }, EMAIL_IMAGE_TOKEN_TTL_SECONDS)
}

export function verifyEmailImageToken(path: string, token: string | null): boolean {
  const payload = verifyAccessToken<{ path?: string; purpose?: string }>(token)
  return !!payload && payload.purpose === 'email-image' && payload.path === path
}

/** Strip storage URLs/paths from API responses so clients cannot bypass download APIs. */
export function stripStorageFields<T extends Record<string, unknown>>(row: T): Omit<
  T,
  'file_url' | 'file_path' | 'download_url'
> {
  const { file_url: _u, file_path: _p, download_url: _d, ...safe } = row as T & {
    file_url?: unknown
    file_path?: unknown
    download_url?: unknown
  }
  return safe
}

/**
 * Certificate storage paths are often users/{id}/... — block cross-user IDOR.
 * Staff can access any path; students only their own folder or a DB-linked certificate.
 */
export async function canAccessCertificateStoragePath(
  email: string,
  path: string
): Promise<boolean> {
  if (!isSafeStoragePath(path)) return false

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', email)
    .single()

  if (!user) return false
  if (isStaffRole(user.role)) return true

  // Shared template assets (session already required by caller)
  if (
    path.startsWith('template-images/') ||
    path.startsWith('templates/') ||
    path.startsWith('certificate-templates/')
  ) {
    return true
  }

  if (path.startsWith(`users/${user.id}/`)) return true

  // Generators often store under users/{name}/... — allow if DB links this user to the path
  if (user.role === 'educator' && path.startsWith('users/')) {
    const { data: generated } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_url')
      .eq('generated_by', user.id)
      .limit(200)
    if (generated?.some((cert) => (cert.certificate_url || '').includes(path))) {
      return true
    }
  }

  const { data: owned } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_url, certificate_filename')
    .eq('user_id', user.id)
    .limit(200)

  if (!owned?.length) return false

  return owned.some((cert) => {
    const url = cert.certificate_url || ''
    if (url.includes(path)) return true
    if (cert.certificate_filename && path.endsWith(cert.certificate_filename)) {
      return path.includes(user.id)
    }
    return false
  })
}
