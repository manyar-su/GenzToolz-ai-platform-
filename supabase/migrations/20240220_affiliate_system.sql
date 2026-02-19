-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Update profiles table
alter table profiles 
add column if not exists referral_code text unique default substring(md5(random()::text) from 0 for 8),
add column if not exists referred_by uuid references profiles(id),
add column if not exists balance_tokens integer default 0;

-- 2. Create affiliate_logs table
create table if not exists affiliate_logs (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references profiles(id) not null,
  new_user_id uuid references profiles(id) not null,
  bonus_amount integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create transactions table (if not exists)
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) not null,
  amount numeric not null,
  tokens_purchased integer not null,
  status text check (status in ('PENDING', 'PAID', 'FAILED')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Function to handle affiliate bonus on successful top-up
create or replace function handle_affiliate_bonus()
returns trigger as $$
declare
  v_referrer_id uuid;
  v_bonus_tokens integer;
  v_is_first_topup boolean;
begin
  -- Only proceed if status changed to PAID
  if new.status = 'PAID' and old.status != 'PAID' then
    
    -- Check if this is the user's first top-up
    select not exists (
      select 1 from transactions 
      where user_id = new.user_id 
      and status = 'PAID' 
      and id != new.id
    ) into v_is_first_topup;

    if v_is_first_topup then
      -- Get referrer
      select referred_by into v_referrer_id
      from profiles
      where id = new.user_id;

      if v_referrer_id is not null then
        -- Calculate 20% bonus
        v_bonus_tokens := floor(new.tokens_purchased * 0.20);

        if v_bonus_tokens > 0 then
          -- Add bonus to referrer
          update profiles
          set balance_tokens = balance_tokens + v_bonus_tokens
          where id = v_referrer_id;

          -- Log the affiliate bonus
          insert into affiliate_logs (referrer_id, new_user_id, bonus_amount)
          values (v_referrer_id, new.user_id, v_bonus_tokens);
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger for transaction updates
drop trigger if exists on_transaction_paid on transactions;
create trigger on_transaction_paid
  after update on transactions
  for each row
  execute function handle_affiliate_bonus();
