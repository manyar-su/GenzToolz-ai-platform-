-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Supports both UUID and Custom Guest IDs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Changed from UUID to TEXT to support 'genz-XXXXX' format
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  balance_tokens INTEGER DEFAULT 10, -- Default 10 tokens for new users
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'guest')),
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow public read access to profiles (needed for referral checks)
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT 
  WITH CHECK (true); -- Simplified for guest mode

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid()::text = id OR role = 'admin'); -- Admin can update any profile

-- 4. Create Transactions Table (To log token additions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC DEFAULT 0,
  tokens_added INTEGER NOT NULL,
  type TEXT DEFAULT 'TOPUP' CHECK (type IN ('TOPUP', 'BONUS', 'ADMIN_ADD')),
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Affiliate Logs Table (To track referral bonuses)
CREATE TABLE IF NOT EXISTS public.affiliate_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id TEXT REFERENCES public.profiles(id) NOT NULL,
  new_user_id TEXT REFERENCES public.profiles(id) NOT NULL,
  bonus_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Admin Function to Add Tokens
CREATE OR REPLACE FUNCTION admin_add_tokens(
  p_user_id TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update user balance
  UPDATE public.profiles
  SET balance_tokens = balance_tokens + p_amount
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, tokens_added, type, status)
  VALUES (p_user_id, p_amount, 'ADMIN_ADD', 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to automatically assign referral code on insert if null
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    -- Use ID as referral code if it's short, or generate one
    NEW.referral_code := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();
