import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }

  req.user = {
    userId: decoded.userId,
    email: decoded.email,
  }

  next()
}



