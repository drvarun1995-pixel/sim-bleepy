/**
 * Generates a random strong password
 * @param length - Length of the password (default: 12)
 * @returns A random strong password
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to randomize the position of required characters
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Generates a temporary password for admin-created users
 * This will be used once and then the user must change it
 */
export function generateTemporaryPassword(): string {
  return generateRandomPassword(16) // Longer password for temporary use
}
