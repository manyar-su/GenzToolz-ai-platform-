import { supabase } from './supabase';

export const authorizedFetch = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    (headers as any)['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    // 1. Check for Admin Token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
        (headers as any)['Authorization'] = `Bearer admin-secret-token`; // Hardcoded matching backend logic for now
    } else {
        // 2. Check for Guest ID
        const guestId = localStorage.getItem('guest_user_id');
        if (guestId) {
            (headers as any)['X-User-ID'] = guestId;
        } else {
             // 3. Dev Fallback
             const isDev = import.meta.env.DEV;
             if (isDev) {
                (headers as any)['Authorization'] = `Bearer dev-token-placeholder`;
             }
        }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // throw new Error('Unauthorized'); // Allow 401 to pass if backend handles it gracefully or if it's not actually unauthorized
    console.warn('Unauthorized response from server');
  }

  if (response.status === 402) {
    throw new Error('Saldo Tidak Cukup');
  }

  return response;
};
