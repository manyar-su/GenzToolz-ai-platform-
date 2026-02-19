/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required',
    })
    return
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required',
    })
    return
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      res.status(401).json({
        success: false,
        error: error.message,
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
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

export default router
