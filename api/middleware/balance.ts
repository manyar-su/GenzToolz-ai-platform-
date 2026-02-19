import { type Response, type NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import { type AuthRequest } from './auth.js'

export const checkBalance = (amount: number) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' })
      return
    }

    try {
      const { error } = await supabase.rpc('deduct_user_balance', {
        user_id: req.user.id,
        amount: amount
      })

      if (error) {
        // Check for the specific error message from the RPC function
        if (error.message.includes('Saldo Tidak Cukup')) {
           res.status(402).json({ success: false, error: 'Saldo Tidak Cukup' })
           return
        }
        console.error('RPC Error:', error)
        res.status(500).json({ success: false, error: 'Failed to process transaction' })
        return
      }

      next()
    } catch (error: any) {
      console.error('Balance Check Error:', error)
      res.status(500).json({ success: false, error: 'Failed to process transaction' })
    }
  }
}
