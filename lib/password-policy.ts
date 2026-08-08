/**
 * Bleepy password policy — aligned with Cyber Essentials requirements.
 * Minimum 12 characters; blocks common/guessable passwords.
 */

export const PASSWORD_POLICY = {
  minLength: 12,
  version: '1.0',
  lastUpdated: '2026-08-08',
  summary:
    'Use a unique password of at least 12 characters. Do not reuse passwords from other sites. Never share your password.',
  rules: [
    'At least 12 characters long',
    'Unique to Bleepy — do not reuse passwords from other accounts',
    'Avoid common words (password, admin, bleepy, qwerty, etc.)',
    'Use a password manager if possible',
    'Report suspected compromise to admin@bleepy.co.uk immediately',
  ],
} as const

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'admin',
  'administrator',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'login',
  'abc123',
  'bleepy',
  'medical',
  'doctor',
  'student',
  'ucl',
  'nhs123',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'shadow',
  'trustno1',
])

export type PasswordValidationResult = {
  valid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`)
  }

  const normalized = password.trim().toLowerCase()
  if (COMMON_PASSWORDS.has(normalized)) {
    errors.push('This password is too common. Choose a more unique password')
  }

  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot be a single repeated character')
  }

  return { valid: errors.length === 0, errors }
}

export function getPasswordStrength(password: string): 'weak' | 'fair' | 'strong' {
  if (password.length < PASSWORD_POLICY.minLength) return 'weak'
  const result = validatePassword(password)
  if (!result.valid) return 'weak'
  if (password.length >= 16) return 'strong'
  return 'fair'
}
