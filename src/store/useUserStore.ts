import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useTokenStore } from './useTokenStore';

interface AffiliateStats {
  friendsJoined: number;
  totalBonusEarned: number;
}

interface UserState {
  isLoggedIn: boolean;
  id: string;
  name: string;
  avatar: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  affiliateStats: AffiliateStats;
  
  // Actions
  initializeGuest: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, refCode?: string | null) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, code: string, name: string, refCode?: string | null) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  generateRandomAvatar: () => Promise<void>;
  syncProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  isLoggedIn: false,
  id: '',
  name: 'Guest User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  email: '',
  referralCode: '',
  referredBy: null,
  affiliateStats: {
    friendsJoined: 0,
    totalBonusEarned: 0
  },

  initializeGuest: async () => {
      // Restore session from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
          // Fetch profile data
          const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
          
          if (profile) {
              set({
                  isLoggedIn: true,
                  id: profile.id,
                  name: profile.full_name,
                  avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`,
                  email: profile.email,
                  referralCode: profile.user_code || profile.referral_code, // Use user_code if available
                  referredBy: profile.referred_by,
              });
              // Sync additional stats
              get().syncProfile();
          }
      }
  },

  login: async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        set({
            isLoggedIn: true,
            id: data.data.user.id,
            name: data.data.user.full_name || 'User',
            avatar: data.data.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.data.user.full_name}`,
            email: data.data.user.email,
            referralCode: data.data.user.user_code || data.data.user.referral_code,
            referredBy: data.data.user.referred_by,
        });
        // Sync additional stats
        get().syncProfile();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  register: async (email, password, name, refCode = null) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name, ref_code: refCode })
      });
      const data = await response.json();
      
      if (data.success) {
        set({
            isLoggedIn: true,
            id: data.data.user.id,
            name: data.data.user.user_metadata?.full_name || name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            email: data.data.user.email,
            referralCode: data.data.user.user_code,
            referredBy: refCode || null,
        });
        get().syncProfile();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  adminLogin: async (username, password) => {
      try {
          const response = await fetch('/api/auth/admin-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
          });
          const data = await response.json();
          
          if (data.success) {
              set({
                  isLoggedIn: true,
                  id: data.data.user.id,
                  name: 'Admin',
                  email: data.data.user.email,
                  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
              });
              // Store admin token in localStorage for API client to pick up
              localStorage.setItem('admin_token', data.data.token);
              return true;
          }
          return false;
      } catch (e) {
          console.error(e);
          return false;
      }
  },

  sendOtp: async (email) => {
    try {
      // 0. Admin Bypass
      if (email === 'mariezibrahim93@gmail.com') {
          return { success: true };
      }

      // 1. Dev Mode Bypass
      if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
        return { success: true };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  verifyOtp: async (email, code, name, refCode = null) => {
    try {
      let authData;
      let authError;

      // 0. Dev Mode Bypass
      if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
          set({
              isLoggedIn: true,
              id: 'mock-user-id',
              name: name || 'Dev User',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Dev'}`,
              email: email,
              referralCode: 'DEV123',
              referredBy: null,
          });
          return { success: true };
      }

      // 0. Admin Bypass Login
      if (email === 'mariezibrahim93@gmail.com') {
          // Try Login with default admin password
          const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password: 'admin-password-123' 
          });
          
          if (error) {
              // If not found/wrong password, try Registering with that password
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email,
                  password: 'admin-password-123',
                  options: {
                      data: { full_name: name }
                  }
              });
              
              if (signUpError) throw signUpError;
              authData = signUpData;
          } else {
              authData = data;
          }
      } else {
          // Normal User OTP Login
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'email'
          });
          if (error) throw error;
          authData = data;
      }
      
      const userId = authData.session?.user.id;
      if (!userId) throw new Error("No session created");

      // 2. Check if Profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        // Load existing profile
        set({
            isLoggedIn: true,
            id: profile.id,
            name: profile.full_name,
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`,
            email: profile.email,
            referralCode: profile.referral_code,
            referredBy: profile.referred_by,
        });
      } else {
        // Create New Profile
        const generatedRefCode = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        
        // Resolve Referred By ID
        let referrerId = null;
        if (refCode) {
            const { data: refUser } = await supabase.from('profiles').select('id').eq('referral_code', refCode).single();
            if (refUser) referrerId = refUser.id;
        }

        const newProfile = {
            id: userId,
            full_name: name,
            email: email,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            referral_code: generatedRefCode,
            referred_by: referrerId,
            balance_tokens: 10 // Welcome Bonus
        };

        const { error: profileError } = await supabase.from('profiles').insert([newProfile]);

        if (profileError) {
            console.error("Profile Creation Error:", profileError);
            return { success: false, error: "Gagal membuat profil" };
        }

        set({
            isLoggedIn: true,
            id: userId,
            name: name,
            avatar: newProfile.avatar_url,
            email: email,
            referralCode: generatedRefCode,
            referredBy: referrerId ? (refCode || null) : null,
        });
      }

      return { success: true };

    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    useTokenStore.getState().reset();
    set({
        isLoggedIn: false,
        name: 'Guest User',
        email: '',
        referralCode: '',
        referredBy: null
    });
    set({
        isLoggedIn: false,
        name: 'Guest User',
        email: '',
        referralCode: '',
        referredBy: null
    });
  },

  updateName: async (name) => {
    const { id } = get();
    if (!id) return;
    
    // Mock for local dev without Supabase
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
        set({ name });
        return;
    }

    // Using RPC for secure update
    const { error } = await supabase.rpc('update_profile', { p_full_name: name });
    
    if (error) {
        console.error("Update Name Error:", error);
        return;
    }
    set({ name });
  },

  generateRandomAvatar: async () => {
    const { id } = get();
    if (!id) return;

    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    
    // Mock for local dev without Supabase
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
        set({ avatar: newAvatar });
        return;
    }

    // Using RPC for secure update
    const { error } = await supabase.rpc('update_profile', { p_avatar_url: newAvatar });

    if (error) {
        console.error("Update Avatar Error:", error);
        return;
    }
    set({ avatar: newAvatar });
  },

  syncProfile: async () => {
    // Mock for local dev without Supabase
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
        return;
    }
      const { id } = get();
      if (!id) return;

      // 1. Get Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (profile) {
          set({ 
              name: profile.full_name,
              avatar: profile.avatar_url,
              referralCode: profile.referral_code
          });
      }

      // 2. Get Affiliate Stats
      // Count friends
      const { count: friendsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', id);

      // Sum bonus
      const { data: bonuses } = await supabase
        .from('affiliate_logs')
        .select('bonus_amount')
        .eq('referrer_id', id);
      
      const totalBonus = bonuses?.reduce((acc, curr) => acc + curr.bonus_amount, 0) || 0;

      set({
          affiliateStats: {
              friendsJoined: friendsCount || 0,
              totalBonusEarned: totalBonus
          }
      });
  }
}));