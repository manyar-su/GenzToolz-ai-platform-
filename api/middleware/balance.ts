import { type Response, type NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase.js' // Fix import path extension if needed
import { type AuthRequest } from './auth.js'

// Middleware: Cek saldo tanpa potong (Logic Gate)
export const ensureBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ success: false, error: 'Unauthorized: User not found' })
    return
  }

  // Bypass balance check if using placeholder Supabase
  if (process.env.SUPABASE_URL?.includes('placeholder')) {
    next()
    return
  }

  // Admin Bypass (Unlimited Balance)
  if (req.user.id === 'admin_user') {
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
      console.error('Balance Check Error:', error)
      res.status(500).json({ success: false, error: 'Gagal mengecek saldo' })
      return
    }

    if (data.balance_tokens <= 0) {
       res.status(402).json({ success: false, error: 'Saldo Habis. Silakan Top Up!' })
       return
    }

    next()
  } catch (error: any) {
    console.error('Balance Check Exception:', error)
    res.status(500).json({ success: false, error: 'Terjadi kesalahan sistem' })
  }
}

// Helper: Potong saldo setelah sukses (Deduct)
export const deductToken = async (userId: string, amount: number = 1): Promise<boolean> => {
  // Bypass deduction if using placeholder Supabase
  if (process.env.SUPABASE_URL?.includes('placeholder')) {
    return true
  }

  // Admin Bypass (No deduction)
  if (userId === 'admin_user') {
      return true;
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
    // Note: Not atomic, but ensures functionality if RPC is missing
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
    if (newBalance < 0) return false // Should be caught by ensureBalance, but double check

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

