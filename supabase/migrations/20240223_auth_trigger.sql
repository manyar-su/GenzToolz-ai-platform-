-- Trigger untuk Auto-Profile User Baru
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_referral_code text;
  ref_code_exists boolean;
begin
  -- Generate unique referral code (First 4 chars of email + random 4 digits)
  loop
    new_referral_code := upper(substring(new.email from 1 for 4)) || floor(random() * 9000 + 1000)::text;
    select exists(select 1 from public.profiles where referral_code = new_referral_code) into ref_code_exists;
    exit when not ref_code_exists;
  end loop;

  insert into public.profiles (id, full_name, email, avatar_url, balance_tokens, referral_code)
  values (
    new.id,
    split_part(new.email, '@', 1), -- Default name from email
    new.email,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.email,
    10, -- Welcome Bonus
    new_referral_code
  );
  return new;
end;
$$;

-- Pasang trigger ke tabel auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
