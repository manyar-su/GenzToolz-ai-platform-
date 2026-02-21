import { type Response, type NextFunction } from 'express'
import { supabase } from '../lib/supabase.js' // Fix import path extension if needed
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

  try {
    const { data, error } = await supabase
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
    const { error } = await supabase.rpc('deduct_user_balance', {
      user_id: userId,
      amount: amount
    })

    if (error) {
      console.error('Deduct Token Error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Deduct Token Exception:', error)
    return false
  }
}

