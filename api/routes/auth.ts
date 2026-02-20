/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

/**
 * User Registration (Standard Email/Password + Custom User ID)
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, ref_code } = req.body

  if (!email || !password || !full_name) {
    res.status(400).json({
      success: false,
      error: 'Name, Email and Password are required',
    })
    return
  }

  try {
    // 1. Sign Up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    })

    if (authError) {
      res.status(400).json({ success: false, error: authError.message })
      return
    }

    if (!authData.user) {
        res.status(500).json({ success: false, error: 'Failed to create user' })
        return
    }

    // 2. Generate Custom User ID (genz-xxxxx)
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const userCode = `genz-${randomCode}`;

    // 3. Create Profile Entry
    // Note: We use the UUID from authData.user.id as the primary key
    // but store userCode for display/referral
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: authData.user.id,
            email: email,
            full_name: full_name,
            user_code: userCode,
            referral_code: userCode, // Same as user_code for simplicity
            balance_tokens: 10, // Bonus 10 Token
            referred_by: ref_code ? (await getReferrerId(ref_code)) : null
        }]);
    
    if (profileError) {
        console.error('Profile creation failed:', profileError);
        // If profile fails, we might want to delete the auth user or retry
        // For now, just return error
        res.status(500).json({ success: false, error: 'Failed to create profile: ' + profileError.message });
        return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
            ...authData.user,
            user_code: userCode,
            balance_tokens: 10
        },
        session: authData.session,
      },
    })
  } catch (err: any) {
    console.error('Registration error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    })
  }
})

// Helper to find referrer UUID by code
async function getReferrerId(code: string): Promise<string | null> {
    const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_code', code) // Look up by user_code (genz-xxxxx)
        .single();
    return data?.id || null;
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

export default router
