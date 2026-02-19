import { supabase } from './supabase';

export const authorizedFetch = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (response.status === 402) {
    throw new Error('Saldo Tidak Cukup');
  }

  return response;
};
