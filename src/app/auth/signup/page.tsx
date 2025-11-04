'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { validatePassword, getPasswordStrength, getPasswordStrengthColor } from '@/utils/passwordValidation'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setValidationErrors([])

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setValidationErrors(passwordValidation.errors)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (response.ok) {
        router.push('/auth/signin')
      } else {
        const data = await response.json()
        // Handle password validation errors
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors)
          setError('Password validation failed')
        } else {
          setError(data.message || 'Something went wrong')
        }
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors">
            Or{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* Password Requirements - Always Visible */}
              <div className="mt-2 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-600">Password requirements:</span>
                  {password && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded text-white ${getPasswordStrengthColor(getPasswordStrength(password))}`}>
                      {getPasswordStrength(password).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <ul className="space-y-1">
                  <li className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{password.length >= 8 ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[0-9]/.test(password) ? '✓' : '○'}</span>
                    <span>One number (0-9)</span>
                  </li>
                  <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}</span>
                    <span>One special character (!@#$%...)</span>
                  </li>
                </ul>
                
                {/* Password Strength Bar */}
                {password && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          getPasswordStrength(password) === 'weak' ? 'bg-red-500' :
                          getPasswordStrength(password) === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{
                          width: `${
                            getPasswordStrength(password) === 'weak' ? '33.33%' :
                            getPasswordStrength(password) === 'medium' ? '66.66%' :
                            '100%'
                          }`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-medium text-red-800 mb-1">Please fix the following:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


