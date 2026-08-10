import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/utils/supabase'
import { formatRoleLabel } from '@/lib/profiles'
import {
  WALK_IN_DESIGNATION_OPTIONS,
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
    account_origin: 'walk_in_guest',
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
