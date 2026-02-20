import { type Request, type Response, type NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // 1. Check for Custom Guest Header
  const guestId = req.headers['x-user-id'] as string;
  if (guestId) {
      req.user = {
          id: guestId,
          email: `guest_${guestId.substr(0, 5)}@genztools.com`
      };
      next();
      return;
  }

  // 2. Fallback to standard Bearer Token (for Admin or Legacy)
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

  // Admin Token Bypass
  if (token === 'admin-secret-token') {
      req.user = {
          id: 'admin_user',
          email: 'admin@genztools.com'
      };
      next();
      return;
  }

  // Bypass Supabase Auth check if using placeholder (for local dev without real Supabase)
  const isPlaceholderSupabase = process.env.SUPABASE_URL?.includes('placeholder') || false;
  
  if (isPlaceholderSupabase) {
    // Mock user for local development
    req.user = {
      id: 'mock-user-id',
      email: 'mock@example.com'
    }
    next()
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
