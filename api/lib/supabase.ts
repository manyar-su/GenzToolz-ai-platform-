// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

try { dotenv.config(); } catch {}

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!process.env.SUPABASE_URL) {
  console.warn('[Supabase] SUPABASE_URL missing')
}
if (!supabaseServiceKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY missing — admin operations will use anon key (RLS may block)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client: pakai service role key agar bypass RLS
// Kalau tidak ada service role key, tetap pakai anon key (tapi RLS bisa block)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

// Flag untuk cek apakah admin client punya full access
export const hasAdminAccess = !!supabaseServiceKey
