import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/utils/supabase'
import { formatRoleLabel } from '@/lib/profiles'
import {
  WALK_IN_ACCOUNT_ORIGIN,
  WALK_IN_DESIGNATION_OPTIONS,
  claimedWalkInAccountFields,
  isWalkInGuestUser,
  type RegistrationSource,
} from '@/lib/walk-in-shared'

export type { RegistrationSource }
export {
  WALK_IN_DESIGNATION_OPTIONS,
  registrationSourceLabel,
  registrationSourceBadgeClass,
} from '@/lib/walk-in-shared'

export function resolveGuestDesignation(
  designationKey: string,
  otherText?: string | null
): { designation: string; roleType: string | null } {
  const key = (designationKey || '').trim()
  if (!key) {
    throw new Error('Designation is required')
  }

  if (key === 'other') {
    const other = (otherText || '').trim()
    if (!other) {
      throw new Error('Please specify your designation')
    }
    return { designation: other, roleType: null }
  }

  const known = WALK_IN_DESIGNATION_OPTIONS.find((o) => o.value === key && o.value !== 'other')
  if (!known) {
    return { designation: key, roleType: null }
  }

  return {
    designation: formatRoleLabel(known.value) || known.label,
    roleType: known.value,
  }
}

/** Seats that count toward capacity for walk-in / door flows */
export async function countOccupiedSeats(eventId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('event_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended', 'pending'])
    .is('deleted_at', null)

  if (error) {
    throw error
  }

  return count || 0
}

export async function isEventAtCapacity(
  eventId: string,
  bookingCapacity: number | null | undefined
): Promise<boolean> {
  if (bookingCapacity == null || bookingCapacity <= 0) {
    return false
  }
  const occupied = await countOccupiedSeats(eventId)
  return occupied >= bookingCapacity
}

export type WalkInUser = {
  id: string
  name: string | null
  email: string
  role: string
  role_type?: string | null
}

/**
 * Find user by email, or create a provisional walk-in guest account
 * (custom users table — not Supabase Auth).
 */
export async function findOrCreateWalkInGuestUser(params: {
  name: string
  email: string
  roleType?: string | null
}): Promise<{ user: WalkInUser; created: boolean }> {
  const email = params.email.toLowerCase().trim()
  const name = params.name.trim()

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, role_type')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return { user: existing as WalkInUser, created: false }
  }

  const randomPassword = crypto.randomBytes(32).toString('hex')
  const passwordHash = await bcrypt.hash(randomPassword, 12)

  const insertPayload: Record<string, unknown> = {
    email,
    name,
    role: 'student',
    email_verified: false,
    password_hash: passwordHash,
    auth_provider: 'email',
    created_at: new Date().toISOString(),
    admin_created: false,
    must_change_password: true,
    profile_completed: false,
    account_origin: WALK_IN_ACCOUNT_ORIGIN,
  }

  if (params.roleType) {
    insertPayload.role_type = params.roleType
  }

  let { data: created, error } = await supabaseAdmin
    .from('users')
    .insert(insertPayload)
    .select('id, name, email, role, role_type')
    .single()

  // Fallback if newer columns are not migrated yet
  if (error) {
    const fallbackPayload = {
      email,
      name,
      role: 'student',
      email_verified: false,
      password_hash: passwordHash,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      profile_completed: false,
      ...(params.roleType ? { role_type: params.roleType } : {}),
    }
    const fallback = await supabaseAdmin
      .from('users')
      .insert(fallbackPayload)
      .select('id, name, email, role, role_type')
      .single()
    created = fallback.data
    error = fallback.error
  }

  if (error || !created) {
    const { data: raced } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, role_type')
      .eq('email', email)
      .maybeSingle()

    if (raced) {
      return { user: raced as WalkInUser, created: false }
    }

    throw error || new Error('Failed to create guest user')
  }

  return { user: created as WalkInUser, created: true }
}

export type ClaimWalkInGuestUpdates = {
  passwordHash?: string
  name?: string | null
  emailVerified?: boolean
  mustChangePassword?: boolean
  consentGiven?: boolean
  marketingConsent?: boolean
  analyticsConsent?: boolean
  adminCreated?: boolean
  role?: string
  passwordChangedAt?: string
}

/**
 * Promote a door-scan shadow to a normal website user.
 * Same `users.id` so attendance, feedback, and certificates stay linked.
 * Does not rewrite `event_bookings.registration_source` (that stays historical).
 */
export async function claimWalkInGuestUser(
  userId: string,
  extras: ClaimWalkInGuestUpdates = {}
): Promise<{
  id: string
  email: string
  name: string | null
  created_at: string
  email_verified: boolean
}> {
  const now = extras.passwordChangedAt || new Date().toISOString()
  const payload: Record<string, unknown> = {
    ...claimedWalkInAccountFields(new Date(now)),
  }

  if (extras.mustChangePassword !== undefined) {
    payload.must_change_password = extras.mustChangePassword
  }
  if (extras.passwordHash !== undefined) {
    payload.password_hash = extras.passwordHash
    payload.password_changed_at = now
  }
  if (extras.name !== undefined) payload.name = extras.name
  if (extras.emailVerified !== undefined) payload.email_verified = extras.emailVerified
  if (extras.consentGiven !== undefined) {
    payload.consent_given = extras.consentGiven
    payload.consent_timestamp = extras.consentGiven ? now : null
    payload.consent_version = '1.0'
  }
  if (extras.marketingConsent !== undefined) payload.marketing_consent = extras.marketingConsent
  if (extras.analyticsConsent !== undefined) payload.analytics_consent = extras.analyticsConsent
  if (extras.adminCreated !== undefined) payload.admin_created = extras.adminCreated
  if (extras.role !== undefined) payload.role = extras.role

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id, email, name, created_at, email_verified')
    .single()

  if (error || !data) {
    throw error || new Error('Failed to claim walk-in guest account')
  }

  return data
}

export async function claimWalkInGuestUserIfNeeded(user: {
  id: string
  account_origin?: string | null
}): Promise<boolean> {
  if (!isWalkInGuestUser(user)) return false
  await claimWalkInGuestUser(user.id)
  return true
}

export { WALK_IN_ACCOUNT_ORIGIN }
