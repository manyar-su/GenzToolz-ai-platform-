import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  login: (email: string, name: string, refCode?: string | null) => Promise<boolean>; 
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

  login: async (email, name, refCode = null) => {
    try {
      // 1. Sign Up / Sign In with Supabase Auth
      // Note: For simplicity in this demo, we'll use signUp. 
      // In prod, handle "User already registered" by trying signIn.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'temporary-password-123', // Hardcoded for demo simplicity
      });

      let userId = authData.user?.id;

      if (authError) {
         // If user exists, try signing in (Simulated flow for demo)
         // In real app, user would enter password.
         if (authError.message.includes('already registered')) {
             const { data: signInData } = await supabase.auth.signInWithPassword({
                 email,
                 password: 'temporary-password-123'
             });
             userId = signInData.user?.id;
         } else {
             console.error("Auth Error:", authError);
             return false;
         }
      }

      if (!userId) return false;

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
        return false; // Not a new user
      } else {
        // 3. Create New Profile (Welcome Bonus 10 Tokens handled by DB Default or Manual)
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
            return false;
        }

        set({
            isLoggedIn: true,
            id: userId,
            name: name,
            avatar: newProfile.avatar_url,
            email: email,
            referralCode: generatedRefCode,
            referredBy: referrerId ? refCode : null,
        });
        
        return true; // Is new user
      }

    } catch (err) {
      console.error("Login Failed:", err);
      return false;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
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
    
    // Using RPC for secure update
    const { error } = await supabase.rpc('update_profile', { p_avatar_url: newAvatar });

    if (error) {
        console.error("Update Avatar Error:", error);
        return;
    }
    set({ avatar: newAvatar });
  },

  syncProfile: async () => {
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
