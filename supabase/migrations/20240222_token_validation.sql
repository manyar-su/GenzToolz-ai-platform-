-- 1. Alter balance_tokens to support decimals (required for 0.5 and 0.2 token costs)
alter table profiles alter column balance_tokens type numeric(10, 2);

-- 2. Create RPC function to deduct balance atomically
create or replace function deduct_user_balance(user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
declare
  current_balance numeric;
begin
  -- Lock the row for update to prevent race conditions
  select balance_tokens into current_balance
  from profiles
  where id = user_id
  for update;

  if current_balance is null then
    raise exception 'User not found';
  end if;

  if current_balance < amount then
    raise exception 'Saldo Tidak Cukup';
  end if;

  -- Atomic update
  update profiles
  set balance_tokens = balance_tokens - amount
  where id = user_id;
end;
$$;

-- 3. Add constraint to ensure balance is non-negative (Zero Guard)
alter table profiles drop constraint if exists check_balance_non_negative;
alter table profiles add constraint check_balance_non_negative check (balance_tokens >= 0);
