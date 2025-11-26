export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Maximum 128 characters (reasonable limit)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)')
  }

  // Check for common weak patterns
  if (password.toLowerCase().includes('password')) {
    errors.push('Password cannot contain the word "password"')
  }

  // Check for repeating characters (e.g., "11111111")
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password cannot contain the same character repeated 4 times or more')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}



