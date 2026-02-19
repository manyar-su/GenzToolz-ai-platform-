-- 0. Enable UUID Extension (Wajib untuk uuid_generate_v4)
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Data Utama User)
-- Gunakan "IF NOT EXISTS" agar tidak error jika tabel sudah ada
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  email text unique,
  balance_tokens integer default 10,
  referral_code text unique,
  referred_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pastikan kolom yang diperlukan ada (untuk tabel yang sudah ada sebelumnya)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'balance_tokens') then
    alter table profiles add column balance_tokens integer default 10;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'referral_code') then
    alter table profiles add column referral_code text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'referred_by') then
    alter table profiles add column referred_by uuid references profiles(id);
  end if;
end $$;


-- 2. Transactions Table (Log Pembayaran)
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  amount_paid decimal(12,2) not null,
  tokens_received integer not null,
  package_name text,
  status text default 'pending',
  payment_gateway_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Token Transfers Table (Fitur Kirim Token)
create table if not exists token_transfers (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  amount integer not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Affiliate Logs Table (Pusat Cuan Affiliator)
create table if not exists affiliate_logs (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references profiles(id) not null,
  buyer_id uuid references profiles(id) not null,
  transaction_id uuid references transactions(id),
  bonus_amount integer not null,
  percentage decimal(5,2) default 15.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FUNCTION: Handle Top-up Success (Trigger)
create or replace function handle_successful_payment()
returns trigger as $$
declare
  referrer_id uuid;
  bonus int;
begin
  if new.status = 'success' and old.status != 'success' then
    update profiles
    set balance_tokens = balance_tokens + new.tokens_received
    where id = new.user_id;

    select referred_by into referrer_id from profiles where id = new.user_id;

    if referrer_id is not null then
      bonus := floor(new.tokens_received * 0.15);
      if bonus > 0 then
        update profiles
        set balance_tokens = balance_tokens + bonus
        where id = referrer_id;

        insert into affiliate_logs (referrer_id, buyer_id, transaction_id, bonus_amount)
        values (referrer_id, new.user_id, new.id, bonus);
      end if;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Hapus dulu jika ada agar tidak error duplikat
drop trigger if exists on_transaction_paid on transactions;
create trigger on_transaction_paid
  after update on transactions
  for each row
  execute procedure handle_successful_payment();


-- FUNCTION: Atomic Token Transfer
create or replace function transfer_tokens(
  p_receiver_code text, 
  p_amount int, 
  p_message text
)
returns json as $$
declare
  v_sender_id uuid;
  v_receiver_id uuid;
  v_sender_balance int;
begin
  v_sender_id := auth.uid();

  select id into v_receiver_id from profiles where referral_code = p_receiver_code;
  
  if v_receiver_id is null then
    return json_build_object('success', false, 'message', 'Penerima tidak ditemukan');
  end if;

  if v_sender_id = v_receiver_id then
    return json_build_object('success', false, 'message', 'Tidak bisa kirim ke diri sendiri');
  end if;

  select balance_tokens into v_sender_balance from profiles where id = v_sender_id for update;

  if v_sender_balance < p_amount then
    return json_build_object('success', false, 'message', 'Saldo token tidak cukup');
  end if;

  update profiles 
  set balance_tokens = balance_tokens - p_amount 
  where id = v_sender_id;

  update profiles 
  set balance_tokens = balance_tokens + p_amount 
  where id = v_receiver_id;

  insert into token_transfers (sender_id, receiver_id, amount, message)
  values (v_sender_id, v_receiver_id, p_amount, p_message);

  return json_build_object('success', true, 'message', 'Transfer berhasil');

exception when others then
  return json_build_object('success', false, 'message', 'Terjadi kesalahan sistem');
end;
$$ language plpgsql security definer;

-- 5. Security & Policies (Profile Updates via RPC only)
alter table profiles enable row level security;

-- Drop existing policies to ensure clean slate
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;

-- Create Policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Note: No UPDATE policy. Updates must be done via RPC.

-- FUNCTION: Update Profile (Secure)
create or replace function update_profile(
  p_full_name text default null,
  p_avatar_url text default null
)
returns json as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  update profiles
  set 
    full_name = coalesce(p_full_name, full_name),
    avatar_url = coalesce(p_avatar_url, avatar_url)
  where id = v_user_id;

  return json_build_object('success', true, 'message', 'Profil berhasil diperbarui');
end;
$$ language plpgsql security definer;

grant execute on function update_profile to authenticated;
