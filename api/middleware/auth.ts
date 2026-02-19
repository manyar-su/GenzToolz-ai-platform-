import { type Request, type Response, type NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ success: false, error: 'Authorization header missing' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ success: false, error: 'Token missing' })
    return
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ success: false, error: 'Invalid token' })
    return
  }

  req.user = {
    id: user.id,
    email: user.email
  }

  next()
}
