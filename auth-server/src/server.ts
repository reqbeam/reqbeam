import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth server is running' })
})

// Auth routes
app.use('/api/auth', authRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth server running on http://localhost:${PORT}`)
  console.log(`📝 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`)
  console.log(`📝 Signup: POST http://localhost:${PORT}/api/auth/signup`)
  console.log(`✅ Verify: GET http://localhost:${PORT}/api/auth/verify`)
})

