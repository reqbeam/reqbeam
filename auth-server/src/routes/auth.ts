import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma'
import { generateToken } from '../utils/jwt'
import { validatePassword } from '../utils/passwordValidation'

const router = Router()

// OAuth signup endpoint (for OAuth users without password)
router.post('/oauth/signup', async (req: Request, res: Response) => {
  try {
    const { email, name, provider } = req.body

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    // If user exists and this is a sync call, return success
    const isSyncCall = req.headers['x-sync-from'] === 'main-app'
    if (existingUser && isSyncCall) {
      const token = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
      })
      return res.status(200).json({
        message: 'User already exists (synced)',
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      })
    }

    // Create OAuth user (no password)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: null, // OAuth users don't have passwords
      },
    })

    // Also sync to main app database
    if (!isSyncCall) {
      const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000'
      try {
        await fetch(`${MAIN_APP_URL}/api/auth/oauth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-from': 'auth-server',
          },
          body: JSON.stringify({ email, name, provider }),
        })
      } catch (mainAppError) {
        console.warn('Failed to sync OAuth user to main app database:', mainAppError)
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('OAuth signup error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

// OAuth login endpoint (for existing OAuth users)
router.post('/oauth/login', async (req: Request, res: Response) => {
  try {
    const { email, name, provider } = req.body

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: null, // OAuth users don't have passwords
        },
      })

      // Sync to main app
      const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000'
      try {
        await fetch(`${MAIN_APP_URL}/api/auth/oauth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-from': 'auth-server',
          },
          body: JSON.stringify({ email, name, provider }),
        })
      } catch (mainAppError) {
        console.warn('Failed to sync OAuth user to main app database:', mainAppError)
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('OAuth login error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

// Signup endpoint
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
      })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password validation failed',
        errors: passwordValidation.errors,
      })
    }

    // Check if this is a sync call from main app
    const isSyncCall = req.headers['x-sync-from'] === 'main-app'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    // If user exists and this is a sync call, return success (user already synced)
    if (existingUser && isSyncCall) {
      const token = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
      })
      return res.status(200).json({
        message: 'User already exists (synced)',
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in auth server database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Also create user in main website database (skip if this is a sync call from main app)
    if (!isSyncCall) {
      const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000'
      try {
        await fetch(`${MAIN_APP_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-from': 'auth-server',
          },
          body: JSON.stringify({ name, email, password }),
        })
        // Note: We don't fail if main app is unavailable, user is already created in auth server DB
      } catch (mainAppError) {
        console.warn('Failed to sync user to main app database:', mainAppError)
        // Continue anyway - user is created in auth server database
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    // Check if user has a password (OAuth users don't have passwords)
    if (!user.password) {
      return res.status(401).json({
        message: 'This account uses OAuth login. Please use Google sign in.',
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

// Token verification endpoint (for future use)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        valid: false,
      })
    }

    const { verifyToken } = await import('../utils/jwt')
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(403).json({
        message: 'Invalid or expired token',
        valid: false,
      })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        valid: false,
      })
    }

    return res.json({
      valid: true,
      user,
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      valid: false,
    })
  }
})

export default router
