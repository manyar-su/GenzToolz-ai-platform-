-- Admin Privilege: Set specific user balance to 10,000 on insert/update

create or replace function enforce_admin_privileges()
returns trigger as $$
begin
  if new.email = 'mariezibrahim93@gmail.com' then
    new.balance_tokens := 10000;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for Insert (New User)
drop trigger if exists on_admin_user_insert on profiles;
create trigger on_admin_user_insert
  before insert on profiles
  for each row
  execute procedure enforce_admin_privileges();

-- Trigger for Update (Existing User)
drop trigger if exists on_admin_user_update on profiles;
create trigger on_admin_user_update
  before update on profiles
  for each row
  execute procedure enforce_admin_privileges();

-- One-time update for existing user (if already registered)
update profiles
set balance_tokens = 10000
where email = 'mariezibrahim93@gmail.com';
