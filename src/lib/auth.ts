import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { UserService } from '@shared/index'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          const userService = new UserService()
          const user = await userService.findByEmail(credentials.email)

          if (!user) {
            console.error(`User not found: ${credentials.email}`)
            return null
          }

          // Check if user has a password (OAuth users don't have passwords)
          if (!user.password) {
            console.error(`User ${credentials.email} is an OAuth user and cannot login with password`)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.error(`Invalid password for user: ${credentials.email}`)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        try {
          const email = user.email
          if (!email) return false

          // Check if user exists
          const userService = new UserService()
          let dbUser = await userService.findByEmail(email)

          // If user doesn't exist, create one
          if (!dbUser) {
            dbUser = await userService.create({
              email,
              name: user.name || profile?.name || email.split('@')[0],
              password: null, // OAuth users don't have passwords
            })

            // Also sync to auth server
            try {
              const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:4000'
              await fetch(`${AUTH_SERVER_URL}/api/auth/oauth/signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email,
                  name: dbUser.name,
                  provider: 'google',
                }),
              })
            } catch (error) {
              console.warn('Failed to sync OAuth user to auth server:', error)
            }
          }

          // Update user ID for session
          user.id = dbUser.id
          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'google') {
        token.provider = 'google'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
