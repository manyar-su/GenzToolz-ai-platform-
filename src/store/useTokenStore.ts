import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';

interface TokenTransfer {
  id: string;
  type: 'in' | 'out';
  amount: number;
  partner: string; // Sender or Receiver Name
  message: string;
  date: string;
}

interface TokenState {
  tokens: number;
  transactions: TokenTransfer[];
  loading: boolean;
  
  fetchBalance: () => Promise<void>;
  deductToken: (amount?: number) => Promise<boolean>;
  addToken: (amount: number) => Promise<void>; // Only for simulated Top-up in this context
  transferToken: (receiverCode: string, amount: number, message: string) => Promise<{ success: boolean; message: string }>;
  reset: () => void;
  subscribeToBalance: () => () => void; // Returns unsubscribe function
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: 0,
  transactions: [],
  loading: false,

  reset: () => set({ tokens: 0, transactions: [] }),

  subscribeToBalance: () => {
    // Safety check for placeholder/dev environment
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
      return () => {};
    }

    const userId = useUserStore.getState().id;
    if (!userId) return () => {};

    const channel = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.balance_tokens === 'number') {
            set({ tokens: payload.new.balance_tokens });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchBalance: async () => {
    // Mock for local dev without Supabase
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
        set({ tokens: 10 }); // 10 tokens for dev guest
        return;
    }

    const userId = useUserStore.getState().id;
    if (!userId) return;

    // Special handling for Hardcoded Admin User
    if (userId === 'admin_user') {
        set({ tokens: 1000 });
        return;
    }

    // Check if current user is Admin (via Email match) but has real UUID
    // Remove auto-reset logic to allow admin token persistence
    // const userEmail = useUserStore.getState().email;
    // const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    
    // if (userEmail && userEmail === adminEmail) {
    //     // Admin Logic Removed: Treat admin like normal user for token balance
    // }

    const { data, error } = await supabase
        .from('profiles')
        .select('balance_tokens')
        .eq('id', userId)
        .single();
    
    if (data) {
        set({ tokens: data.balance_tokens });
    }
  },

  deductToken: async (amount = 1) => {
    const userId = useUserStore.getState().id;
    const currentTokens = get().tokens;

    // Check Balance Local (Optimistic)
    if (!userId || currentTokens < amount) return false;

    // Optimistic Update (Server handles actual DB deduction via RPC)
    set({ tokens: currentTokens - amount }); 
    
    // We rely on the server response to confirm the transaction.
    // If the server returns 402, the UI handles it.
    // Ideally, we should sync with server balance periodically.
    return true;
  },

  addToken: async (amount) => {
    // This is primarily for Top-Up simulation
    const userId = useUserStore.getState().id;
    if (!userId) return;
    
    const currentTokens = get().tokens;
    
    // In a real app, we would create a transaction record here
    // For now, we update profile directly
    const { error } = await supabase
        .from('profiles')
        .update({ balance_tokens: currentTokens + amount })
        .eq('id', userId);

    if (!error) {
        set({ tokens: currentTokens + amount });
    }
  },

  transferToken: async (receiverCode, amount, message) => {
    set({ loading: true });
    
    // Admin Transfer Bypass
    const userId = useUserStore.getState().id;
    if (userId === 'admin_user') {
         try {
            const response = await fetch('/api/auth/admin-transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer admin-secret-token'
                },
                body: JSON.stringify({ receiver_code: receiverCode, amount })
            });
            const data = await response.json();
            set({ loading: false });
            if (data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.error || 'Transfer gagal' };
            }
        } catch (err: any) {
            set({ loading: false });
            return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
        }
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch('/api/auth/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ 
                receiver_identifier: receiverCode, 
                amount, 
                message 
            })
        });

        const data = await response.json();

        set({ loading: false });

        if (data.success) {
            // Refresh balance
            await get().fetchBalance();
            return { success: true, message: 'Transfer Berhasil!' };
        } else {
            return { success: false, message: data.error || 'Transfer Gagal' };
        }

    } catch (err: any) {
        set({ loading: false });
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
  }
}));
