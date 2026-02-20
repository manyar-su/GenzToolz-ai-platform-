-- ⚠️ PENTING: Script ini akan mereset tabel profiles agar mendukung ID format baru (genz-XXXXX).
-- Data lama di tabel profiles, transactions, dan affiliate_logs akan terhapus.

-- 1. Hapus Tabel Lama (Urutan penting karena Foreign Keys)
DROP TABLE IF EXISTS public.affiliate_logs;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.profiles CASCADE; -- Cascade untuk menghapus relasi/policy terkait

-- Enable UUID extension (jika belum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Ulang Tabel Profiles (Dengan ID sebagai TEXT)
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, -- TEXT agar bisa menampung UUID (user login) DAN 'genz-XXXXX' (guest)
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  balance_tokens INTEGER DEFAULT 10,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'guest')),
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Buat Policies (Fixed Type Casting)

-- Policy: Semua orang bisa baca (untuk referral)
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

-- Policy: Insert (Bebas, karena kita handle ID di aplikasi)
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

-- Policy: Update (Hanya diri sendiri atau Admin)
-- Kita cast auth.uid() ke text agar cocok dengan kolom id (text)
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE 
  USING (
    (auth.uid()::text = id) OR (role = 'admin')
  );

-- 5. Buat Tabel Transaksi
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC DEFAULT 0,
  tokens_added INTEGER NOT NULL,
  type TEXT DEFAULT 'TOPUP' CHECK (type IN ('TOPUP', 'BONUS', 'ADMIN_ADD')),
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Buat Tabel Affiliate Logs
CREATE TABLE public.affiliate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id TEXT REFERENCES public.profiles(id) NOT NULL,
  new_user_id TEXT REFERENCES public.profiles(id) NOT NULL,
  bonus_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Trigger: Auto Referral Code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();
