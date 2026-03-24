// @ts-nocheck
import { type Response, type NextFunction } from 'express'
import { type AuthRequest } from './auth.js'

// In-memory store: userId -> { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000 // 1 menit
const MAX_REQUESTS = 10      // max 10 request per menit per user per tool

export const rateLimitTool = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const userId = req.user?.id || req.ip || 'anonymous'
  const tool = req.path.split('/')[1] || 'unknown'
  const key = `${userId}:${tool}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    res.setHeader('Retry-After', retryAfter)
    res.status(429).json({
      success: false,
      error: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`
    })
    return
  }

  entry.count++
  next()
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store.entries()) {
    if (now > val.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)
