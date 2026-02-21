-- Create or Update Admin User with 10,000 Tokens
INSERT INTO public.profiles (id, email, full_name, role, balance_tokens, referral_code)
VALUES ('admin_user', 'admin@genztools.com', 'Super Admin', 'admin', 10000, 'ADMIN001')
ON CONFLICT (id) 
DO UPDATE SET 
    balance_tokens = 10000,
    role = 'admin';
