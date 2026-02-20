-- ⚠️ RESET SCHEMA untuk mendukung Email/Password Auth + Custom ID (genz-xxxxx)
-- Internal ID kembali ke UUID (untuk integrasi Auth Supabase), tapi kita tambah kolom 'user_code' untuk ID unik yang dilihat user.

-- 1. Hapus Tabel Lama
DROP TABLE IF EXISTS public.affiliate_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Tabel Profiles Baru
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Link ke Supabase Auth
  user_code TEXT UNIQUE NOT NULL, -- ID Unik User (genz-xxxxx) untuk display/topup
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  balance_tokens INTEGER DEFAULT 10, -- Bonus 10 Token
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  referral_code TEXT UNIQUE, -- Sama dengan user_code atau beda, kita samakan saja biar simpel
  referred_by UUID REFERENCES public.profiles(id), -- Referrer pakai UUID internal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR role = 'admin');

-- 4. Tabel Transaksi
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC DEFAULT 0,
  tokens_added INTEGER NOT NULL,
  type TEXT DEFAULT 'TOPUP' CHECK (type IN ('TOPUP', 'BONUS', 'ADMIN_ADD')),
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Affiliate Logs
CREATE TABLE public.affiliate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES public.profiles(id) NOT NULL,
  new_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  bonus_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Trigger untuk User Baru (Opsional jika insert via API, tapi bagus untuk backup)
-- Kita handle insert profile di API saja agar lebih kontrol generate user_code

-- 7. FUNGSI ADMIN: Topup by User Code (genz-xxxxx)
CREATE OR REPLACE FUNCTION public.admin_topup_by_code(
  p_user_code TEXT,    -- Input: genz-12345
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_referrer_id UUID;
  v_bonus_amount INTEGER;
  v_result JSONB;
BEGIN
  -- 1. Cari UUID berdasarkan User Code
  SELECT id, referred_by INTO v_user_id, v_referrer_id
  FROM public.profiles
  WHERE user_code = p_user_code;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User ID (genz-...) tidak ditemukan');
  END IF;

  -- 2. Tambah Token
  UPDATE public.profiles
  SET balance_tokens = balance_tokens + p_amount
  WHERE id = v_user_id;

  -- Catat Transaksi
  INSERT INTO public.transactions (user_id, tokens_added, type, status, amount)
  VALUES (v_user_id, p_amount, 'ADMIN_ADD', 'COMPLETED', 0);

  -- 3. Bonus Affiliate (20%)
  IF v_referrer_id IS NOT NULL THEN
    v_bonus_amount := FLOOR(p_amount * 0.20);

    IF v_bonus_amount > 0 THEN
      UPDATE public.profiles
      SET balance_tokens = balance_tokens + v_bonus_amount
      WHERE id = v_referrer_id;

      INSERT INTO public.affiliate_logs (referrer_id, new_user_id, bonus_amount)
      VALUES (v_referrer_id, v_user_id, v_bonus_amount);
      
      INSERT INTO public.transactions (user_id, tokens_added, type, status, amount)
      VALUES (v_referrer_id, v_bonus_amount, 'BONUS', 'COMPLETED', 0);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Topup berhasil', 
    'user_id', v_user_id,
    'bonus', COALESCE(v_bonus_amount, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
