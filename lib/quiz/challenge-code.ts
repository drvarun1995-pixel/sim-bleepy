/**
 * Challenge Code Generation
 * Generates unique 6-digit codes for challenges
 */

/**
 * Generate a random 6-digit code
 */
export function generateChallengeCode(): string {
  // Generate a random 6-digit number (100000-999999)
  const min = 100000
  const max = 999999
  const code = Math.floor(Math.random() * (max - min + 1)) + min
  return code.toString()
}

/**
 * Validate challenge code format
 */
export function isValidChallengeCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/**
 * Format challenge code for display (adds spacing: 123 456)
 */
export function formatChallengeCode(code: string): string {
  if (!isValidChallengeCode(code)) {
    return code
  }
  return `${code.slice(0, 3)} ${code.slice(3, 6)}`
}


