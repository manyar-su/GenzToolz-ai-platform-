// @ts-nocheck
/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

const router = Router()

/**
 * Register — langsung aktif tanpa konfirmasi email
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, ref_code } = req.body

  if (!email || !password || !full_name) {
    res.status(400).json({ success: false, error: 'Nama, Email, dan Password wajib diisi' })
    return
  }

  try {
    // Buat akun via Admin API — email_confirm: true = langsung aktif, tanpa OTP
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        res.status(400).json({ success: false, error: 'Email sudah terdaftar. Silakan login.' })
        return
      }
      res.status(400).json({ success: false, error: authError.message })
      return
    }

    if (!authData.user) {
      res.status(500).json({ success: false, error: 'Gagal membuat akun' })
      return
    }

    // Generate unique user code
    const userCode = await generateUniqueCode()

    const adminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL
    const adminTokens = parseInt(process.env.VITE_ADMIN_TOKENS || process.env.ADMIN_TOKENS || '1000')
    const initialTokens = email === adminEmail ? adminTokens : 10

    const referrerId = ref_code ? await getReferrerId(ref_code) : null

    // Buat profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        full_name,
        user_code: userCode,
        referral_code: userCode,
        balance_tokens: initialTokens,
        referred_by: referrerId
      }])

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      res.status(500).json({ success: false, error: 'Gagal membuat profil: ' + profileError.message })
      return
    }

    // Bonus referral ke pengundang
    if (referrerId) {
      const REFERRAL_BONUS = parseInt(process.env.VITE_REFERRAL_BONUS || '20')
      const { data: referrer } = await supabaseAdmin
        .from('profiles').select('balance_tokens').eq('id', referrerId).single()
      if (referrer) {
        await supabaseAdmin.from('profiles')
          .update({ balance_tokens: (referrer.balance_tokens || 0) + REFERRAL_BONUS })
          .eq('id', referrerId)
        await supabaseAdmin.from('transactions').insert([{
          user_id: referrerId, amount_paid: 0, tokens_received: REFERRAL_BONUS,
          package_name: `REFERRAL_BONUS from ${userCode}`, status: 'success',
          payment_gateway_id: 'referral'
        }])
      }
    }

    // Buat session langsung agar user bisa login otomatis
    const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password })

    res.status(200).json({
      success: true,
      data: {
        user: { ...authData.user, user_code: userCode, balance_tokens: initialTokens },
        session: sessionData?.session || null,
      }
    })
  } catch (err: any) {
    console.error('Registration error:', err)
    res.status(500).json({ success: false, error: err.message || 'Internal server error' })
  }
})

// Helper to find referrer UUID by code
async function getReferrerId(code: string): Promise<string | null> {
    const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_code', code)
        .single();
    return data?.id || null;
}

// Generate unique genz-XXXXX code (retry until no duplicate)
async function generateUniqueCode(): Promise<string> {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let attempt = 0; attempt < 10; attempt++) {
        // 5 random alphanumeric chars
        let suffix = '';
        for (let i = 0; i < 5; i++) {
            suffix += chars[Math.floor(Math.random() * chars.length)];
        }
        const code = `genz-${suffix}`;
        const { data } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_code', code)
            .maybeSingle();
        if (!data) return code; // unique
    }
    // Fallback: use timestamp-based suffix (virtually impossible to collide)
    return `genz-${Date.now().toString(36).slice(-5)}`;
}

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' })
    return
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      res.status(401).json({ success: false, error: error.message })
      return
    }

    // Fetch profile to get user_code
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    res.status(200).json({
      success: true,
      data: {
        user: {
            ...data.user,
            ...profile // Merge profile data
        },
        session: data.session,
      },
    })
  } catch (err: any) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: Supabase logout is usually client-side if using client SDK directly.
    // If we're managing session on backend, we need the access token.
    // For this simple implementation, we'll just sign out the client instance if relevant,
    // but in a real stateless REST API, logout is often just clearing the token on client.
    // However, we can call signOut() to invalidate the session if we have the session context.
    
    // Without session context (like passing the token), signOut() on the server client 
    // might not do what we expect for a specific user unless we scope the client.
    // For now, we'll just return success as a placeholder or perform a global signOut if applicable.
    
    // A better approach for backend logout is to invalidate the refresh token if stored.
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
       res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * Guest Initialization
 * POST /api/auth/guest-init
 */
router.post('/guest-init', async (req: Request, res: Response): Promise<void> => {
  const { guest_id, ref_code } = req.body; // Accept referral code
  
  // Generate shorter ID: genz-XXXXX
  const randomCode = Math.floor(10000 + Math.random() * 90000); // 5 digit random number
  const newGuestId = `genz-${randomCode}`;
  
  const userId = guest_id || newGuestId;

  // Bypass Supabase if placeholder
  const isPlaceholderSupabase = process.env.SUPABASE_URL?.includes('placeholder') || false;
  if (isPlaceholderSupabase) {
      res.status(200).json({
          success: true,
          data: {
              user: {
                  id: userId,
                  role: 'guest',
                  referral_code: userId // Use ID as referral code for simplicity
              }
          }
      });
      return;
  }

  try {
      // Check if guest exists
      const { data: existingUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

      if (!existingUser) {
          // Create new guest profile with 10 free tokens
          const { error } = await supabase
              .from('profiles')
              .insert([{
                  id: userId,
                  full_name: `User ${userId}`,
                  balance_tokens: 10,
                  role: 'guest',
                  referral_code: userId, // ID itself is the referral code
                  referred_by: ref_code || null // Store who referred this user
              }]);
          
          if (error) {
              console.error('Failed to create guest profile:', error);
              // Retry with new ID if collision (rare for 5 digits but possible)
              // For simplicity, we just fail or let client retry
          }
      }

      res.status(200).json({
          success: true,
          data: {
              user: {
                  id: userId,
                  role: 'guest',
                  referral_code: userId
              }
          }
      });
  } catch (err: any) {
      console.error('Guest init error:', err);
      res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin Login (Simple)
 * POST /api/auth/admin-login
 */
router.post('/admin-login', async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    
    const adminUser = process.env.VITE_ADMIN_USERNAME || 'admin';
    const adminPass = process.env.VITE_ADMIN_PASSWORD || 'adminsu';

    if (username === adminUser && password === adminPass) {
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: 'admin_user',
                    role: 'admin',
                    email: 'admin@genztools.com'
                },
                token: 'admin-secret-token'
            }
        });
        return;
    }

    res.status(401).json({ success: false, error: 'Invalid credentials' });
});

/**
 * Search Users (Admin)
 * GET /api/auth/search-users
 */
router.get('/search-users', async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;
    const authHeader = req.headers.authorization;

    if (authHeader !== 'Bearer admin-secret-token') {
        res.status(401).json({ success: false, error: 'Unauthorized Admin' });
        return;
    }

    if (!query || typeof query !== 'string') {
        // Allow empty query to fetch latest users
        // res.status(400).json({ success: false, error: 'Query is required' });
        // return;
    }

    try {
        let queryBuilder = supabase
            .from('profiles')
            .select('id, email, full_name, user_code, balance_tokens');

        if (query) {
            let filter = `email.ilike.%${query}%,full_name.ilike.%${query}%,user_code.ilike.%${query}%`;
            
            // Only append id.eq if query is a valid UUID to avoid PostgreSQL errors
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(query as string)) {
                filter += `,id.eq.${query}`;
            }
            queryBuilder = queryBuilder.or(filter);
        } else {
            // Default sort if no query
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }

        const { data, error } = await queryBuilder.limit(50);

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (err: any) {
        console.error('Search Users Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * User Transfer (P2P)
 * POST /api/auth/transfer
 */
router.post('/transfer', async (req: Request, res: Response): Promise<void> => {
    const { receiver_identifier, amount, message } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify User
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
         res.status(401).json({ success: false, error: 'Invalid Token' });
         return;
    }

    if (!receiver_identifier || !amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Invalid input' });
        return;
    }

    // Prevent self-transfer
    if (receiver_identifier === user.id || receiver_identifier === user.email) {
        res.status(400).json({ success: false, error: 'Cannot transfer to self' });
        return;
    }

    try {
        // 1. Get Sender Balance
        const { data: sender, error: senderError } = await supabaseAdmin
            .from('profiles')
            .select('balance_tokens, full_name')
            .eq('id', user.id)
            .single();

        if (senderError || !sender) throw new Error('Sender not found');
        
        if ((sender.balance_tokens || 0) < amount) {
            res.status(400).json({ success: false, error: 'Insufficient balance' });
            return;
        }

        // 2. Find Receiver
        let filter = `user_code.eq.${receiver_identifier},email.eq.${receiver_identifier}`;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(receiver_identifier)) {
             filter += `,id.eq.${receiver_identifier}`;
        }

        const { data: receiver, error: receiverError } = await supabaseAdmin
            .from('profiles')
            .select('id, balance_tokens, user_code')
            .or(filter)
            .single();

        if (receiverError || !receiver) {
            res.status(404).json({ success: false, error: 'User tujuan tidak ditemukan' });
            return;
        }

        // 3. Perform Transfer (Sequential with Compensation)
        // A. Deduct from Sender
        const { error: deductError } = await supabaseAdmin
            .from('profiles')
            .update({ balance_tokens: sender.balance_tokens - amount })
            .eq('id', user.id);

        if (deductError) throw deductError;

        // B. Add to Receiver
        const { error: addError } = await supabaseAdmin
            .from('profiles')
            .update({ balance_tokens: (receiver.balance_tokens || 0) + amount })
            .eq('id', receiver.id);

        if (addError) {
            // Compensation: Refund Sender
            await supabaseAdmin
                .from('profiles')
                .update({ balance_tokens: sender.balance_tokens })
                .eq('id', user.id);
            throw addError;
        }

        // 4. Log Transactions
        // Outgoing for Sender
        await supabaseAdmin.from('transactions').insert([{
            user_id: user.id,
            amount_paid: 0,
            tokens_received: -amount, // Negative for sent
            package_name: `TRANSFER_OUT to ${receiver.user_code}`,
            status: 'success',
            payment_gateway_id: 'p2p_transfer',
            metadata: { receiver_id: receiver.id, message }
        }]);

        // Incoming for Receiver
        await supabaseAdmin.from('transactions').insert([{
            user_id: receiver.id,
            amount_paid: 0,
            tokens_received: amount,
            package_name: `TRANSFER_IN from ${sender.full_name || 'User'}`,
            status: 'success',
            payment_gateway_id: 'p2p_transfer',
            metadata: { sender_id: user.id, message }
        }]);

        res.status(200).json({ success: true, message: 'Transfer berhasil' });

    } catch (err: any) {
        console.error('Transfer Error:', err);
        res.status(500).json({ success: false, error: err.message || 'Transfer failed' });
    }
});

/**
 * Admin Transfer (Top Up User)
 * POST /api/auth/admin-transfer
 */
router.post('/admin-transfer', async (req: Request, res: Response): Promise<void> => {
    const { receiver_identifier, amount } = req.body;
    const authHeader = req.headers.authorization;

    // 1. Verify Admin
    if (authHeader !== 'Bearer admin-secret-token') {
        res.status(401).json({ success: false, error: 'Unauthorized Admin' });
        return;
    }

    if (!receiver_identifier || !amount || amount <= 0) {
        res.status(400).json({ success: false, error: 'Invalid input' });
        return;
    }

    try {
        // 2. Find User by ID, Code, or Email
        let filter = `user_code.eq.${receiver_identifier},email.eq.${receiver_identifier}`;
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(receiver_identifier)) {
             filter += `,id.eq.${receiver_identifier}`;
        }

        const { data: receiver, error: findError } = await supabaseAdmin
            .from('profiles')
            .select('id, balance_tokens, user_code')
            .or(filter)
            .single();

        if (findError || !receiver) {
            res.status(404).json({ success: false, error: 'User tujuan tidak ditemukan' });
            return;
        }

        // 3. Add or Deduct Tokens (amount can be negative for deduction)
        const delta = Number(amount);
        const newBalance = Math.max(0, (receiver.balance_tokens || 0) + delta);
        
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ balance_tokens: newBalance })
            .eq('id', receiver.id);

        if (updateError) {
            throw updateError;
        }

        // 4. Log Transaction (Optional but good for history)
        await supabaseAdmin.from('transactions').insert([{
            user_id: receiver.id,
            amount_paid: 0,
            tokens_received: amount,
            package_name: 'ADMIN_GIFT',
            status: 'success',
            payment_gateway_id: 'admin_transfer'
        }]);

        res.status(200).json({ success: true, message: `Berhasil ${Number(amount) >= 0 ? 'mengirim' : 'mengurangi'} ${Math.abs(Number(amount))} token ke ${receiver.user_code || receiver.id}` });

    } catch (err: any) {
        console.error('Admin Transfer Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router
