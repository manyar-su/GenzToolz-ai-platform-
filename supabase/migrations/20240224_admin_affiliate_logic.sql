-- FUNGSI: Topup Token Admin + Otomatis Bonus Affiliate
-- Fungsi ini akan dijalankan ketika Admin menambah token ke user.
-- 1. Menambah token ke user tujuan.
-- 2. Mengecek apakah user tersebut punya upline (referrer).
-- 3. Jika ada, referrer dapat bonus 20%.
-- 4. Mencatat semua transaksi.

CREATE OR REPLACE FUNCTION public.admin_topup_with_bonus(
  p_user_id TEXT,      -- ID User yang beli token (misal: genz-12345)
  p_amount INTEGER     -- Jumlah token yang dibeli (misal: 100)
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id TEXT;
  v_bonus_amount INTEGER;
  v_user_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- 1. Cek apakah user ada
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'User ID tidak ditemukan');
  END IF;

  -- 2. Tambah Token ke User Utama
  UPDATE public.profiles
  SET balance_tokens = balance_tokens + p_amount
  WHERE id = p_user_id;

  -- Catat Transaksi Topup
  INSERT INTO public.transactions (user_id, tokens_added, type, status, amount)
  VALUES (p_user_id, p_amount, 'ADMIN_ADD', 'COMPLETED', 0);

  -- 3. Cek Referrer (Upline)
  SELECT referred_by INTO v_referrer_id
  FROM public.profiles
  WHERE id = p_user_id;

  -- 4. Jika ada referrer, berikan bonus 20%
  IF v_referrer_id IS NOT NULL THEN
    -- Hitung 20% dari jumlah topup
    v_bonus_amount := FLOOR(p_amount * 0.20);

    IF v_bonus_amount > 0 THEN
      -- Update saldo referrer
      UPDATE public.profiles
      SET balance_tokens = balance_tokens + v_bonus_amount
      WHERE id = v_referrer_id;

      -- Catat Log Affiliate
      INSERT INTO public.affiliate_logs (referrer_id, new_user_id, bonus_amount)
      VALUES (v_referrer_id, p_user_id, v_bonus_amount);
      
      -- Catat Transaksi Bonus buat Referrer (Opsional, biar muncul di history mereka)
      INSERT INTO public.transactions (user_id, tokens_added, type, status, amount)
      VALUES (v_referrer_id, v_bonus_amount, 'BONUS', 'COMPLETED', 0);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Topup berhasil', 
    'bonus_given', COALESCE(v_bonus_amount, 0),
    'referrer', v_referrer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
