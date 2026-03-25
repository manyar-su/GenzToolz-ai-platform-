// @ts-nocheck
import { type Response, type NextFunction } from 'express'
import { supabaseAdmin, hasAdminAccess } from '../lib/supabase.js'
import { type AuthRequest } from './auth.js'

// Token cost per tool — sinkron dengan TOKEN_COST di tools.ts
const TOOL_COSTS: Record<string, number> = {
  'script-architect': 1,
  'trend-analyzer': 1,
  'caption-generator': 1,
  'video-to-short': 1,
  'viral-hook-generator': 1,
  'youtube-seo': 1,
  'comment-reply': 1,
  'color-palette': 1,
  'scheduler-suggestion': 1,
  'podcast-to-shorts': 2,
  'competitor-analyzer': 1,
  'subtitle-generator': 3,
  'brand-pitch': 1,
  'affiliate-hunter': 1,
  'reply-master': 1,
  'giveaway-picker': 1,
  'poll-generator': 1,
  'shadowban-checker': 1,
  'bio-optimizer': 1,
  'thumbnail-tester': 1,
  'color-grading': 1,
  'smart-clipper': 5,
  'text-to-visual': 1,
}

// Middleware: Cek saldo tanpa potong (Logic Gate)
export const ensureBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ success: false, error: 'Unauthorized: User not found' })
    return
  }

  // Bypass: placeholder Supabase (dev mode)
  if (process.env.SUPABASE_URL?.includes('placeholder')) {
    next()
    return
  }

  // Bypass: guest user (tidak punya akun, tidak ada di profiles table)
  const isGuest = !!(req.headers['x-user-id'])
  if (isGuest) {
    res.status(401).json({ success: false, error: 'Login diperlukan untuk menggunakan tools ini.' })
    return
  }

  // Bypass: tidak ada service role key
  if (!hasAdminAccess) {
    console.warn('[Balance] No SERVICE_ROLE_KEY — skipping balance check')
    next()
    return
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('balance_tokens')
      .eq('id', req.user.id)
      .single()

    if (error || !data) {
      // Jika gagal query, jangan block user — log dan lanjutkan
      console.error('Balance Check Error (non-blocking):', error?.message)
      next()
      return
    }

    // Deteksi cost dari URL path
    const pathParts = req.path.split('/')
    const toolSlug = pathParts.find(p => TOOL_COSTS[p]) || ''
    const required = TOOL_COSTS[toolSlug] ?? (req as any).tokenCost ?? 1

    if (data.balance_tokens < required) {
       res.status(402).json({ success: false, error: `Saldo tidak cukup. Dibutuhkan ${required} token, saldo Anda ${data.balance_tokens}. Silakan Top Up!` })
       return
    }

    next()
  } catch (error: any) {
    // Jangan block user jika ada exception — log dan lanjutkan
    console.error('Balance Check Exception (non-blocking):', error?.message)
    next()
  }
}

// Helper: Potong saldo setelah sukses (Deduct)
export const deductToken = async (userId: string, amount: number = 1): Promise<boolean> => {
  // Bypass deduction if using placeholder Supabase
  if (process.env.SUPABASE_URL?.includes('placeholder')) {
    return true
  }

  // Bypass jika tidak ada service role key
  if (!hasAdminAccess) {
    console.warn('[Balance] No SERVICE_ROLE_KEY — skipping token deduction')
    return true
  }

  try {
    // 1. Try RPC first (Atomic)
    const { error } = await supabaseAdmin.rpc('deduct_user_balance', {
      user_id: userId,
      amount: amount
    })

    if (!error) return true

    console.warn('RPC deduct_user_balance failed, attempting manual fallback...', error.message)
    
    // 2. Fallback: Manual Transaction (Get -> Update)
    const { data: user, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('balance_tokens')
        .eq('id', userId)
        .single()
        
    if (fetchError || !user) {
        console.error('Fallback Fetch Error:', fetchError)
        return false
    }
    
    const newBalance = user.balance_tokens - amount
    if (newBalance < 0) return false

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ balance_tokens: newBalance })
        .eq('id', userId)
    
    if (updateError) {
        console.error('Fallback Update Error:', updateError)
        return false
    }
    
    return true
  } catch (error) {
    console.error('Deduct Token Exception:', error)
    return false
  }
}
